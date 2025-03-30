import { Injectable, Inject, forwardRef, Optional } from '@angular/core';
import { HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable, tap, catchError, of, map, delay, timeout, BehaviorSubject, timer } from 'rxjs';
import { environment } from '../../../environments/environment';
import { environment as production } from '../../../environments/environment.prod';
import { LoggerService } from './logger.service';
import { User } from './user-state.service';
import { AuthService } from './auth.service';
import { UserStateService } from './user-state.service';
import { HttpClientWrapperService } from './http-client-wrapper.service';
import { v4 as uuidv4 } from 'uuid';

// Interface for server status
export interface ServerStatus {
  isOnline: boolean;
  lastChecked?: Date;
  server: string;
  statusCode?: string;
  message?: string;
}

export interface Server {
  name: string;
  language: string;
  api: string;
  port: number;
  swagger: string;
}

export interface ServerMetrics {
  name: string;
  tol: number;
  status: 'online' | 'degraded' | 'warning' | 'offline';
  latency: number;
  serverMetrics: {
    cpu: number;
    memory: number;
    uptime: number;
    activeUsers: number;
    requestsPerSecond: number;
  };
  apiPerformance: {
    avgResponseTime: number;
    totalRequests: number;
    successfulRequests: number;
    failedRequests: number;
    endpointStats: Record<string, {
      hits: number;
      avgResponseTime: number;
      errors: number;
    }>;
  };
}

export interface UserMetricsPayload {
  clientInfo: {
    userAgent: string;
    ipAddress: string;
    location?: {
      country: string;
      city?: string;
      latitude?: number;
      longitude?: number;
    };
    browserInfo: {
      name: string;
      version: string;
      platform: string;
    };
  };
  performance: {
    networkLatency: number;
    fps: number;
    pageLoadTime: number;
    memoryUsage?: number;
  };
  activity: {
    clicks: number;
    scrolls: number;
    keypresses: number;
    sessionDuration: number;
    pageViews: number;
  };
  timestamp: number;
}

@Injectable({
  providedIn: 'root',
})
export class ApiService {
  private isProduction = environment.production;

  // Default API URL set to NestJS server
  private apiUrl = `${environment.apiUrl}/api`;
  private recordSize = 100; // Default record size

  private servers: Server[] = [
    {
      name: 'Nest',
      language: 'NestJS (Node.js)',
      api: 'api',
      port: 3000,
      swagger: '/api/swagger',
    },
    {
      name: 'Go',
      language: 'Go',
      api: 'api-go',
      port: 4000,
      swagger: '/swagger',
    },
  ];

  private currentServer: Server = this.servers[0];
  
  // Fix environment variables - use hardcoded defaults if properties don't exist
  private nestApiUrl = 'http://localhost:3000';
  private goApiUrl = 'http://localhost:4000/api-go';

  // Track connection status
  private serverStatus = {
    nest: false,
    go: false,
    lastCheck: 0
  };

  private healthEndpoint = '/health';
  private serverStatusSubject = new BehaviorSubject<ServerStatus>({
    isOnline: true,
    server: 'Nest',
    lastChecked: new Date()
  });

  // Expose the server status as an observable
  serverStatus$ = this.serverStatusSubject.asObservable();

  constructor(
    private httpClient: HttpClientWrapperService,
    @Inject(forwardRef(() => LoggerService)) private logger: LoggerService,
    @Inject(forwardRef(() => AuthService)) private authService: AuthService,
    @Optional() @Inject(forwardRef(() => UserStateService)) private userStateService: UserStateService
  ) {
    // Register service with logger
    this.logger.registerService('ApiService');
    this.logger.info('API Service initialized', {
      production: this.isProduction,
      apiUrl: this.apiUrl
    });
    
    // Set API URLs with environment values if available
    if (typeof environment.nestApiUrl === 'string') {
      this.nestApiUrl = environment.nestApiUrl;
    }
    
    if (typeof environment.goApiUrl === 'string') {
      this.goApiUrl = environment.goApiUrl;
    }

    // Check server status periodically
    this.checkServerConnections();
    setInterval(() => this.checkServerConnections(), 60000); // Check every minute

    // Initialize server status check
    this.startServerStatusCheck();
  }

  private getHeaders(): HttpHeaders {
    return new HttpHeaders({
      'Content-Type': 'application/json',
      Authorization: 'Bearer YOUR_TOKEN_HERE', // Replace with dynamic token logic
    });
  }

  private getAuthHeaders(): HttpHeaders {
    const token = this.authService.getToken();
    return new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    });
  }

  private getFullUrl(endpoint: string): string {
    // Remove leading slash if present to avoid double slashes
    endpoint = endpoint.replace(/^\/+/, '');
    return `${this.apiUrl}/${endpoint}`;
  }

  // Start periodic server status checks
  private startServerStatusCheck(): void {
    // Check every 30 seconds (adjust as needed)
    timer(0, 30000).subscribe(() => {
      this.checkServerConnections();
    });
  }

  // Check server connections and update status
  private checkServerConnections(): void {
    this.checkServerHealth().pipe(
      timeout(5000), // Timeout after 5 seconds
      map(response => {
        // If we get a successful response, server is online
        return {
          isOnline: true,
          server: 'Nest',
          lastChecked: new Date(),
          statusCode: 'OK',
          message: 'Server is online'
        };
      }),
      catchError(error => {
        this.logger.error('[SERVER_CONNECTIVITY]: Nest server health check failed', error);
        
        return of({
          isOnline: false,
          server: 'Nest',
          lastChecked: new Date(),
          statusCode: error.status ? `${error.status}` : 'TIMEOUT',
          message: error.message || 'Server is unreachable'
        });
      }),
      tap(status => {
        // Log status changes
        if (this.serverStatusSubject.value.isOnline !== status.isOnline) {
          if (status.isOnline) {
            this.logger.info('[SERVER_CONNECTIVITY]: Nest server is online', { server: 'Nest' });
          } else {
            this.logger.info('[SERVER_CONNECTIVITY]: Nest server is offline', { server: 'Nest' });
          }
        }
      })
    ).subscribe(status => {
      this.serverStatusSubject.next(status);
    });
  }

  // Check server health
  private checkServerHealth(): Observable<any> {
    return this.httpClient.get(`${this.apiUrl}${this.healthEndpoint}`);
  }

  // Method to manually trigger a server check
  public checkServerAvailability(): Observable<ServerStatus> {
    this.checkServerConnections();
    return this.serverStatus$;
  }

  // 🛡️ API CRUD Operations
  get<T>(endpoint: string, options?: any): Observable<T> {
    const url = this.getFullUrl(endpoint);
    const callId = this.logger.startServiceCall('ApiService', 'GET', url);
    const requestId = uuidv4(); 
    const startTime = performance.now();
    
    this.logger.debug(`API Request: GET ${endpoint}`, {
      requestId,
      url,
      method: 'GET',
      timestamp: new Date() // Fix: Use Date object instead of timestamp
    });
    
    // Fix: Cast the Observable to correct return type
    return this.httpClient.get<T>(url, { headers: this.getHeaders(), ...options }).pipe(
      tap(response => {
        const duration = Math.round(performance.now() - startTime);
        this.logger.endServiceCall(callId, 200);
        this.logger.debug(`GET ${endpoint} succeeded in ${duration}ms`, {
          requestId,
          duration,
          timestamp: new Date() // Fix: Use Date object instead of timestamp
        });
      }),
      catchError(error => {
        const duration = Math.round(performance.now() - startTime);
        this.logger.endServiceCall(callId, error.status || 500);
        this.logger.error(`GET ${endpoint} failed in ${duration}ms`, { 
          requestId,
          status: error.status,
          message: error.message,
          duration,
          timestamp: new Date() // Fix: Use Date object instead of timestamp
        });
        throw error;
      })
    ) as Observable<T>; // Add explicit type cast to fix return type
  }

  post<T, R>(endpoint: string, body: T): Observable<R> {
    const url = `${this.apiUrl}/${endpoint}`;
    const callId = this.logger.startServiceCall('ApiService', 'POST', url);
    
    return this.httpClient.post<R>(url, body, { headers: this.getHeaders() }).pipe(
      tap(response => {
        this.logger.endServiceCall(callId, 200);
        this.logger.debug(`POST ${endpoint} succeeded`);
      }),
      catchError(error => {
        this.logger.endServiceCall(callId, error.status || 500);
        this.logger.error(`POST ${endpoint} failed`, { 
          status: error.status,
          message: error.message
        });
        throw error;
      })
    );
  }

  put<T>(endpoint: string, body: T): Observable<T> {
    const url = `${this.apiUrl}/${endpoint}`;
    const callId = this.logger.startServiceCall('ApiService', 'PUT', url);
    
    return this.httpClient.put<T>(url, body, { headers: this.getHeaders() }).pipe(
      tap(response => {
        this.logger.endServiceCall(callId, 200);
        this.logger.debug(`PUT ${endpoint} succeeded`);
      }),
      catchError(error => {
        this.logger.endServiceCall(callId, error.status || 500);
        this.logger.error(`PUT ${endpoint} failed`, { 
          status: error.status,
          message: error.message
        });
        throw error;
      })
    );
  }

  delete<T>(endpoint: string): Observable<T> {
    const url = `${this.apiUrl}/${endpoint}`;
    const callId = this.logger.startServiceCall('ApiService', 'DELETE', url);
    
    return this.httpClient.delete<T>(url, { headers: this.getHeaders() }).pipe(
      tap(response => {
        this.logger.endServiceCall(callId, 200);
        this.logger.debug(`DELETE ${endpoint} succeeded`);
      }),
      catchError(error => {
        this.logger.endServiceCall(callId, error.status || 500);
        this.logger.error(`DELETE ${endpoint} failed`, { 
          status: error.status,
          message: error.message
        });
        throw error;
      })
    );
  }

  /**
   * Fetches the current user state.
   * @returns An observable of the user state.
   */
  getUserState(): Observable<any> {
    return this.httpClient.get<any>(`${this.apiUrl}/users`, { headers: this.getHeaders() });
  }

  /**
   * Updates the user state.
   * @param userState - The new user state.
   * @returns An observable of the updated user state.
   */
  updateUserState(userState: any): Observable<any> {
    return this.httpClient.put<any>(`${this.apiUrl}/users`, userState, { headers: this.getHeaders() });
  }

  /**
   * Deletes the user state.
   * @returns An observable of the deletion result.
   */
  deleteUserState(): Observable<any> {
    return this.httpClient.delete<any>(`${this.apiUrl}/users`, { headers: this.getHeaders() });
  }

  /**
   * Dynamically sets the server API URL based on the selected server name.
   * Updates `apiUrl` to point to the selected server.
   * @param serverName - Name of the server ('Nest' or 'Go')
   * @example
   * setApiUrl('Nest');
   * setApiUrl('Go');
   */
  setApiUrl(serverName: string): string {
    const server = this.servers.find(s => s.name === serverName);

    if (server) {
      this.currentServer = server;
      const protocol = this.isProduction ? 'https' : 'http';
      const host = this.isProduction ? production.host : environment.host;

      // Remove extra "/api" if Nest is already exposing "/api/logs"
      this.apiUrl = `${protocol}://${host}:${server.port}`;
      this.logger.info(`API URL set to ${this.apiUrl}`);
    } else {
      this.apiUrl = '';
      this.logger.error(`Server with name '${serverName}' not found`);
    }

    return this.apiUrl;
  }

  /**
   * Gets the currently active API URL.
   * @returns The current API URL.
   */
  getApiUrl(): string {
    return this.apiUrl;
  }

  /**
   * Sets the number of records to fetch/generate.
   * @param size - The number of records.
   */
  setRecordSize(size: number): void {
    this.recordSize = size;
    console.log(`API Service: Record size set to ${this.recordSize}`);
  }

  /**
   * Selects the server by its name.
   * @param serverName - The name of the server.
   */
  setServerType(serverName: string): void {
    const server = this.servers.find(s => s.name === serverName);
    if (server) {
      this.currentServer = server;
      this.setApiUrl(serverName);
      console.log(`API Service: Server switched to ${server.name}`);
    } else {
      console.error('API Service: Server not found');
    }
  }

  /**
   * Logs performance details based on the current configuration.
   */
  getPerformanceDetails(): void {
    console.log(`API Service: Performance details for ${this.recordSize} records on ${this.currentServer.name} server`);
  }

  /**
   * Generates a performance report based on the selected server.
   * @param selectedServer - Selected server object.
   * @param totalRecords - Number of records generated.
   * @param generationTimeLabel - Time taken to generate records.
   * @param roundtripLabel - Time taken for round-trip delivery.
   * @returns A performance report string.
   */
  generatePerformanceReport(selectedServer: { language: string }, totalRecords: number, generationTimeLabel: string, roundtripLabel: string): string {
    return `Using the backend server language, ${selectedServer.language}, Mock record set of ${totalRecords} records was generated in ${generationTimeLabel} and delivered in ${roundtripLabel}.`;
  }

  /**
   * Handles an array of strings.
   * @param data - An array of strings.
   * @returns A processed result.
   */
  handleStringArray(data: string[]): any {
    // Implement your logic here
    console.log('Handling string array:', data);
    // Example: Return the length of each string
    return data.map(str => str.length);
  }

  getLogs(limit: number, level?: string): Observable<any> {
    let params = new HttpParams().set('limit', limit.toString());
    
    // Only add level param if it has a value
    if (level && level.trim()) {
      params = params.set('level', level);
    }

    return this.httpClient.get(`${this.apiUrl}/logs`, { params });
  }

  getAllUsers(): Observable<User[]> {
    // Updated endpoint from '/api/user/getAllUsers' to '/api/users'
    return this.httpClient.get<User[]>('/api/users');
  }

  getUserById(id: string): Observable<User> {
    return this.httpClient.get<User>(`/api/users/${id}`);
  }

  // Get Nest server metrics with enhanced logging
  getNestServerMetrics(): Observable<ServerMetrics | null> {
    const options = { headers: this.getAuthHeaders() };
    const startTime = performance.now();
    const requestId = uuidv4();
    
    this.logger.info('Requesting Nest server metrics', { 
      requestId,
      url: `${this.nestApiUrl}/api/metrics/nest`,
      timestamp: new Date() // Fix: Use Date object instead of timestamp
    });
    
    // Only use mock data if configured to do so or if known to be offline
    if (environment.useMockMetrics || !this.serverStatus.nest) {
      this.logger.info('Using mock Nest server metrics', { 
        requestId,
        reason: environment.useMockMetrics ? 'configured' : 'server offline',
        timestamp: new Date() // Fix: Use Date object instead of timestamp
      });
      
      return of(this.createMockNestMetrics()).pipe(
        delay(300), // Simulate network delay
        tap(() => {
          const duration = Math.round(performance.now() - startTime);
          this.logger.info('Mock Nest metrics retrieved', { 
            requestId,
            duration,
            timestamp: new Date() // Fix: Use Date object instead of timestamp
          });
        })
      );
    }
    
    return this.httpClient.get<ServerMetrics>(`${this.nestApiUrl}/api/metrics/nest`, options)
      .pipe(
        tap(response => {
          const duration = Math.round(performance.now() - startTime);
          this.logger.info('Nest server metrics retrieved', { 
            requestId,
            duration,
            status: response?.status,
            timestamp: new Date() // Fix: Use Date object instead of timestamp
          });
        }),
        catchError(error => {
          const duration = Math.round(performance.now() - startTime);
          this.logger.error('Failed to fetch Nest server metrics', { 
            requestId,
            error: error.message,
            status: error.status,
            duration,
            timestamp: new Date() // Fix: Use Date object instead of timestamp
          });
          
          // Fall back to mock data
          this.logger.info('Falling back to mock Nest metrics', { requestId });
          return of(this.createMockNestMetrics());
        })
      );
  }

  // Get Go server metrics with enhanced logging and fallbacks
  getGoServerMetrics(): Observable<ServerMetrics | null> {
    const options = { headers: this.getAuthHeaders() };
    const startTime = performance.now();
    const requestId = uuidv4();
    
    this.logger.info('Requesting Go server metrics', { 
      requestId,
      url: `${this.goApiUrl}/api/metrics`,
      timestamp: new Date() // Fix: Use Date object instead of timestamp
    });
    
    // Use mock data if configured or if server is known to be offline
    if (environment.useMockMetrics || !this.serverStatus.go) {
      this.logger.info('Using mock Go server metrics', { 
        requestId,
        reason: environment.useMockMetrics ? 'configured' : 'server offline',
        timestamp: new Date() // Fix: Use Date object instead of timestamp
      });
      
      return of(this.createMockGoMetrics()).pipe(
        delay(300), // Simulate network delay
        tap(() => {
          const duration = Math.round(performance.now() - startTime);
          this.logger.info('Mock Go metrics retrieved', { 
            requestId,
            duration,
            timestamp: new Date() // Fix: Use Date object instead of timestamp
          });
        })
      );
    }
    
    // Try more URL patterns with additional fallbacks
    return this.httpClient.get<ServerMetrics>(`${this.goApiUrl}/api/metrics`, options)
      .pipe(
        catchError(error => {
          this.logger.info('Falling back to alternate Go metrics endpoint', { requestId });
          return this.httpClient.get<ServerMetrics>(`${this.goApiUrl}/metrics`, options);
        }),
        catchError(error => {
          this.logger.info('Falling back to base metrics endpoint', { requestId });
          return this.httpClient.get<ServerMetrics>('http://localhost:4000/metrics', options);
        }),
        catchError(error => {
          this.logger.info('Falling back to metrics endpoint without prefix', { requestId });
          return this.httpClient.get<ServerMetrics>('http://localhost:4000/api/metrics', options);
        }),
        catchError(error => {
          this.logger.info('Falling back to v1 metrics endpoint', { requestId });
          return this.httpClient.get<ServerMetrics>(`${this.goApiUrl}/v1/metrics`, options);
        }),
        map(response => {
          const duration = Math.round(performance.now() - startTime);
          this.logger.info('Go server metrics retrieved', { 
            requestId, 
            duration,
            status: response?.status,
            timestamp: new Date() // Fix: Use Date object instead of timestamp
          });
          return this.transformGoServerResponse(response);
        }),
        catchError(error => {
          const duration = Math.round(performance.now() - startTime);
          this.logger.error('Failed to fetch Go server metrics after all fallbacks', { 
            requestId,
            error: error.message,
            status: error.status,
            duration,
            timestamp: new Date() // Fix: Use Date object instead of timestamp
          });
          return of(this.createMockGoMetrics());
        })
      );
  }

  /**
   * Create mock Nest server metrics for development and fallback
   */
  private createMockNestMetrics(): ServerMetrics {
    // Generate realistic-looking mock data for development
    const cpuLoad = 45 + Math.floor(Math.random() * 20); // 45% to 65%
    const memoryUsage = 50 + Math.floor(Math.random() * 20); // 50% to 70%
    const latency = 60 + Math.floor(Math.random() * 30); // 60ms to 90ms
    const status = this.calculateMockServerStatus(cpuLoad, memoryUsage, latency);
    
    // Create server-specific mock data
    return {
      name: 'Nest Server (Mock)',
      tol: Date.now(),
      status: status,
      latency: latency,
      serverMetrics: {
        cpu: cpuLoad,
        memory: memoryUsage,
        uptime: 3600 * 24 * (2 + Math.floor(Math.random() * 5)), // 2-7 days in seconds
        activeUsers: 45 + Math.floor(Math.random() * 40),
        requestsPerSecond: 25 + Math.floor(Math.random() * 20)
      },
      apiPerformance: {
        avgResponseTime: latency,
        totalRequests: 12000 + Math.floor(Math.random() * 6000),
        successfulRequests: 11800 + Math.floor(Math.random() * 180),
        failedRequests: Math.floor(Math.random() * 40),
        endpointStats: {
          '/api/users': { hits: 5243, avgResponseTime: 55, errors: 8 },
          '/api/products': { hits: 3212, avgResponseTime: 65, errors: 5 },
          '/api/orders': { hits: 2341, avgResponseTime: 90, errors: 12 },
          '/api/metrics': { hits: 1120, avgResponseTime: 30, errors: 2 }
        }
      }
    };
  }

  /**
   * Create mock Go server metrics for development and fallback
   */
  private createMockGoMetrics(): ServerMetrics {
    // Generate realistic-looking mock data for development
    const cpuLoad = 30 + Math.floor(Math.random() * 40); // 30% to 70%
    const memoryUsage = 40 + Math.floor(Math.random() * 35); // 40% to 75%
    const latency = 80 + Math.floor(Math.random() * 50); // 80ms to 130ms
    const status = this.calculateMockServerStatus(cpuLoad, memoryUsage, latency);
    
    return {
      name: 'Go Server (Mock)',
      tol: Date.now(),
      status: status,
      latency: latency,
      serverMetrics: {
        cpu: cpuLoad,
        memory: memoryUsage,
        uptime: 3600 * 24 * (1 + Math.floor(Math.random() * 7)), // 1-7 days in seconds
        activeUsers: 30 + Math.floor(Math.random() * 50),
        requestsPerSecond: 15 + Math.floor(Math.random() * 25)
      },
      apiPerformance: {
        avgResponseTime: latency,
        totalRequests: 10000 + Math.floor(Math.random() * 5000),
        successfulRequests: 9800 + Math.floor(Math.random() * 150),
        failedRequests: Math.floor(Math.random() * 50),
        endpointStats: {
          '/api/users': { hits: 3453, avgResponseTime: 65, errors: 12 },
          '/api/products': { hits: 2343, avgResponseTime: 85, errors: 8 },
          '/api/orders': { hits: 1242, avgResponseTime: 120, errors: 15 }
        }
      }
    };
  }

  /**
   * Calculate mock server status based on metrics
   */
  private calculateMockServerStatus(
    cpu: number, 
    memory: number, 
    latency: number
  ): 'online' | 'degraded' | 'warning' | 'offline' {
    if (cpu > 90 || memory > 90 || latency > 300) {
      return 'warning';
    } else if (cpu > 70 || memory > 80 || latency > 200) {
      return 'degraded';
    }
    return 'online';
  }

  // Send user metrics to the server
  sendUserMetrics(metrics: UserMetricsPayload): Observable<any> {
    const options = { headers: this.getAuthHeaders() };
    
    return this.httpClient.post(`${this.nestApiUrl}/user-metrics`, metrics, options)
      .pipe(
        catchError(error => {
          console.error('Error sending user metrics:', error);
          return of(null);
        })
      );
  }

  // Check API status (useful for connectivity tests)
  checkApiStatus(): Observable<any> {
    // Use a shorter timeout to avoid long waits when server is unreachable
    const timeoutMs = 2000;
    
    // Create a simple way to track repeated errors for the same endpoint
    const errorKey = `status_check_${Date.now()}`;
    const isRecentlyLogged = this.hasLoggedErrorRecently(errorKey);
    
    // Try the most common endpoint paths with fallback
    return this.httpClient.get(`${this.nestApiUrl}/api/status`, { timeout: timeoutMs })
      .pipe(
        catchError(error => {
          if (!isRecentlyLogged) {
            this.logger.info('Falling back to alternate status endpoint');
          }
          // Fallback to endpoint without /api prefix
          return this.httpClient.get(`${this.nestApiUrl}/status`, { timeout: timeoutMs });
        }),
        tap(status => {
          if (!isRecentlyLogged) {
            this.logger.info('API status check successful', { status });
          }
        }),
        catchError(error => {
          if (!isRecentlyLogged) {
            this.logger.warn('All API status endpoints failed', { 
              error: error.message,
              timestamp: new Date()
            });
            // Track this error to prevent repeated logging
            this.markErrorAsLogged(errorKey);
          }
          // Return a mock offline status instead of throwing error
          return of({ 
            status: 'offline', 
            error: error.message,
            timestamp: new Date().toISOString()
          });
        })
      );
  }

  // Helper methods to prevent error spam for the same endpoints
  private recentErrors: {[key: string]: number} = {};
  private readonly ERROR_LOG_TIMEOUT = 60000; // 1 minute

  private hasLoggedErrorRecently(key: string): boolean {
    const now = Date.now();
    const lastTime = this.recentErrors[key] || 0;
    return now - lastTime < this.ERROR_LOG_TIMEOUT;
  }

  private markErrorAsLogged(key: string): void {
    this.recentErrors[key] = Date.now();
    
    // Clean up old entries
    Object.keys(this.recentErrors).forEach(k => {
      if (Date.now() - this.recentErrors[k] > this.ERROR_LOG_TIMEOUT) {
        delete this.recentErrors[k];
      }
    });
  }

  // Transform Go server response to match our interface if needed
  private transformGoServerResponse(response: any): ServerMetrics {
    // Make sure the response matches our interface structure
    return {
      name: response.name || 'Go Server',
      tol: response.tol || Date.now(),
      status: response.status || 'offline',
      latency: response.latency || 0,
      serverMetrics: {
        cpu: response.serverMetrics?.cpu || 0,
        memory: response.serverMetrics?.memory || 0,
        uptime: response.serverMetrics?.uptime || 0,
        activeUsers: response.serverMetrics?.activeUsers || 0,
        requestsPerSecond: response.serverMetrics?.requestsPerSecond || 0,
      },
      apiPerformance: {
        avgResponseTime: response.apiPerformance?.avgResponseTime || 0,
        totalRequests: response.apiPerformance?.totalRequests || 0,
        successfulRequests: response.apiPerformance?.successfulRequests || 0,
        failedRequests: response.apiPerformance?.failedRequests || 0,
        endpointStats: response.apiPerformance?.endpointStats || {}
      }
    };
  }
}
