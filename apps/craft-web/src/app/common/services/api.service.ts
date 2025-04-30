import { Injectable, Inject, forwardRef } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
// Add ResponseType import for better typing
import { Observable, tap, catchError, throwError } from 'rxjs';
import { environment } from '../../../environments/environment';
import { environment as production } from '../../../environments/environment.prod';
import { LoggerService } from './logger.service';
import { User } from './user.interface'; // Import User directly from user.interface

/**
 * API Service for interacting with backend endpoints
 * 
 * This service provides a standardized interface for making HTTP requests to the API.
 * It works with Ward Bell's state mechanism and Dan Wahlin's RXJS state methodology
 * by returning Observables that can be directly consumed by state stores.
 * 
 * See the STATE-MANAGEMENT.md documentation for details on the state architecture.
 */
export interface Server {
  name: string;
  language: string;
  api: string;
  port: number;
  swagger: string;
}

@Injectable({
  providedIn: 'root',
})
export class ApiService {
  private isProduction = environment.production;

  // Default API URL set to NestJS server
  private apiUrl = `${environment.apiUrl}/api`;
  private recordSize = 100; // Default record size
  
  // Connection management properties
  private readonly BASE_TIMEOUT = 10000; // 10 seconds timeout for API requests
  private readonly MAX_RETRIES = 3;
  private serverStarting = false;
  private connectionAttempts = 0;
  private maxStartupRetries = 5;

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

  constructor(
    private http: HttpClient,
    @Inject(forwardRef(() => LoggerService)) private logger: LoggerService
  ) {
    // Register service with logger
    this.logger.registerService('ApiService');
    this.logger.info('API Service initialized', {
      production: this.isProduction,
      apiUrl: this.apiUrl
    });
  }

  private getHeaders(): HttpHeaders {
    return new HttpHeaders({
      'Content-Type': 'application/json',
      Authorization: 'Bearer YOUR_TOKEN_HERE', // Replace with dynamic token logic
    });
  }

  private addSecurityHeaders(headers: HttpHeaders): HttpHeaders {
    return headers
      .set('X-Content-Type-Options', 'nosniff')
      .set('X-Frame-Options', 'DENY')
      .set('X-XSS-Protection', '1; mode=block');
  }

  private getTracingHeaders(): HttpHeaders {
    let headers = this.getHeaders();
    // Generate or propagate trace ID (simple UUID for demo)
    const traceId = (window.crypto?.randomUUID?.() || Math.random().toString(36).slice(2));
    headers = headers.set('X-Request-ID', traceId);
    return this.addSecurityHeaders(headers);
  }

  // Get current URL construction for clarity
  private getFullUrl(endpoint: string): string {
    // Remove leading slashes
    endpoint = endpoint.replace(/^\/+/, '');
    
    // Ensure we have the correct base URL with environment-specific settings
    let baseUrl;
    if (this.isProduction) {
      // In production, use the full environment API URL
      baseUrl = this.apiUrl;
    } else {
      // In development, use the Angular proxy (no hostname needed)
      // This ensures requests go through Angular DevServer proxy
      baseUrl = '/api';
    }
    
    // Combine and return the full URL path
    return `${baseUrl}/${endpoint}`;
  }

  // 🛡️ API CRUD Operations
  /**
   * Creates HTTP GET request to specified endpoint
   * 
   * @param endpoint - API endpoint to request
   * @param options - Optional HTTP request options
   * @returns Observable<T> - Observable that can be subscribed to by state stores
   */
  get<T>(endpoint: string, options?: any): Observable<T> {
    const url = this.getFullUrl(endpoint);
    const callId = this.logger.startServiceCall('ApiService', 'GET', url);
    const httpOptions = { 
      ...options,
      headers: this.getTracingHeaders(),
    };
    
    // Use explicit type casting for the HTTP call
    return this.http.get<T>(url, httpOptions).pipe(
      tap(response => {
        this.logger.endServiceCall(callId, 200);
        this.logger.debug(`GET ${endpoint} succeeded`);
      }),
      catchError(error => {
        this.logger.endServiceCall(callId, error.status || 500);
        this.logger.error(`GET ${endpoint} failed`, { 
          status: error.status,
          message: error.message
        });
        throw error;
      })
    ) as Observable<T>; // Explicitly cast the return type
  }

  put<T>(endpoint: string, body: T, options?: any): Observable<T> {
    const url = this.getFullUrl(endpoint);
    const callId = this.logger.startServiceCall('ApiService', 'PUT', url);

    const httpOptions = {
      ...options,
      headers: this.getTracingHeaders(),
    };
    
    return this.http.put<T>(url, body, httpOptions).pipe(
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
    ) as Observable<T>;
  }

  delete<T>(endpoint: string, options?: any): Observable<T> {
    const url = this.getFullUrl(endpoint);
    const callId = this.logger.startServiceCall('ApiService', 'DELETE', url);

    const httpOptions = {
      ...options,
      headers: this.getTracingHeaders(),
    };
    
    return this.http.delete<T>(url, httpOptions).pipe(
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
    ) as Observable<T>;
  }

  /**
   * Fetches the current user state.
   * @returns An observable of the user state.
   */
  getUserState(): Observable<any> {
    // Use getFullUrl for proxy compatibility
    return this.http.get<any>(this.getFullUrl('users'), { headers: this.getHeaders() });
  }

  /**
   * Updates the user state.
   * @param userState - The new user state.
   * @returns An observable of the updated user state.
   */
  updateUserState(userState: any): Observable<any> {
    // Use getFullUrl for proxy compatibility
    return this.http.put<any>(this.getFullUrl('users'), userState, { headers: this.getHeaders() });
  }

  /**
   * Deletes the user state.
   * @returns An observable of the deletion result.
   */
  deleteUserState(): Observable<any> {
    // Use getFullUrl for proxy compatibility
    return this.http.delete<any>(this.getFullUrl('users'), { headers: this.getHeaders() });
  }

  /**
   * Sets the API URL based on the provided resource name.
   * @param resource - Resource name to determine which API URL to use
   * @returns The configured API URL
   */
  setApiUrl(resource: string): string {
    this.logger.debug(`Setting API URL for resource: ${resource}`);
    
    if (resource === 'Go') {
      this.apiUrl = 'http://localhost:8080/api';
    } else if (resource === 'Nest') {
      // Fix the malformed URL - remove duplicate http:// and port
      this.apiUrl = 'http://localhost:3000/api';
    } else {
      // Default case
      this.apiUrl = 'http://localhost:3000/api';
    }
    
    this.logger.debug(`API URL set to ${this.apiUrl}`);
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
    if (level && level.trim()) {
      params = params.set('level', level);
    }
    // Use getFullUrl for proxy compatibility
    return this.http.get(this.getFullUrl('logs'), { params });
  }

  getAllUsers(): Observable<User[]> {
    // Use getFullUrl for proxy compatibility
    return this.http.get<User[]>(this.getFullUrl('users'));
  }

  getUserById(id: string): Observable<User> {
    // Use getFullUrl for proxy compatibility
    return this.http.get<User>(this.getFullUrl(`users/${id}`));
  }

  /**
   * Check if server appears to be in startup process
   */
  public get isServerStarting(): boolean {
    return this.serverStarting;
  }

  /**
   * Special method for authentication requests with enhanced retry logic
   * @param method HTTP method (GET, POST, etc)
   * @param endpoint API endpoint
   * @param body Request body (for POST/PUT)
   * @param options Additional options
   * @returns Observable of response
   */
  public authRequest<T>(method: string, endpoint: string, body?: any, options = {}): Observable<T> {
    // Log detailed debugging information
    console.log('🔍 Auth request details', {
      method,
      endpoint,
      fullUrl: this.getFullUrl(endpoint),
      bodyKeys: body ? Object.keys(body) : 'none',
      timestamp: new Date().toISOString(),
      options,
      isProduction: this.isProduction
    });
    
    // Enhanced retry options for auth requests
    const enhancedOptions = { 
      ...options,
      timeout: this.BASE_TIMEOUT * 2, // Double timeout for auth requests
      retries: this.maxStartupRetries
    };
    
    // Add debugging information to request headers
    const debugHeaders = {
      headers: {
        'X-Debug-Timestamp': new Date().toISOString(),
        'X-Client-Info': navigator.userAgent
      }
    };
    
    const finalOptions = {
      ...enhancedOptions,
      ...debugHeaders
    };
    
    // Use regular request methods with enhanced options
    switch (method.toUpperCase()) {
      case 'GET':
        return this.get<T>(endpoint, finalOptions);
      case 'POST':
        // Allow a breakpoint here for debugging
        // debugger;
        console.log(`🔐 Making ${method} request to ${this.getFullUrl(endpoint)}`);
        return this.post<any, T>(endpoint, body, finalOptions);
      case 'PUT':
        return this.put<any>(endpoint, body, finalOptions);
      case 'DELETE':
        return this.delete<T>(endpoint, finalOptions);
      default:
        this.logger.error(`Unsupported HTTP method for auth request: ${method}`);
        return throwError(() => new Error(`Unsupported HTTP method: ${method}`));
    }
  }

  /**
   * Creates HTTP POST request to specified endpoint
   * 
   * @param endpoint - API endpoint to request
   * @param body - Request body
   * @param options - Optional HTTP request options
   * @returns Observable<R> - Observable of response type R
   */
  post<T extends object, R>(endpoint: string, body: T, options?: any): Observable<R> {
    const url = this.getFullUrl(endpoint);
    const callId = this.logger.startServiceCall('ApiService', 'POST', url);

    const httpOptions = {
      ...options,
      headers: this.getTracingHeaders(),
    };
    
    this.logger.debug(`Making POST request to ${url}`, {
      endpoint,
      baseUrl: this.apiUrl,
      fullUrl: url,
      isProduction: this.isProduction
    });
    
    // Add more detailed debugging for auth endpoints
    if (endpoint.includes('auth')) {
      console.log(`🌐 Network request details:`, {
        url,
        method: 'POST',
        bodyType: typeof body,
        hasCredentials: !!(body && 'username' in body),
        timestamp: Date.now(),
        options: Object.keys(httpOptions || {})
      });
    }
    
    return this.http.post<R>(url, body, httpOptions).pipe(
      tap(response => {
        this.logger.endServiceCall(callId, 200);
        this.logger.debug(`POST ${endpoint} succeeded`);
        
        if (endpoint.includes('auth')) {
          console.log(`✅ Auth request succeeded`, {
            endpoint, 
            responseReceived: true,
            responseType: typeof response
          });
        }
      }),
      catchError(error => {
        this.logger.endServiceCall(callId, error.status || 500);
        this.logger.error(`POST ${endpoint} failed`, { 
          status: error.status,
          message: error.message,
          url: url
        });
        
        if (endpoint.includes('auth')) {
          console.error(`❌ Auth request failed: ${error.status}`, {
            message: error.message || 'No message',
            statusText: error.statusText,
            url: url,
            error: error
          });
          
          // Check if the server is available by pinging it
          this.checkServerAvailability();
        }
        
        throw error;
      })
    ) as Observable<R>;
  }
  
  /**
   * Check if the server is available by making a simple HEAD request
   */
  private checkServerAvailability(): void {
    // Try to ping the server root to check if it's up
    fetch('/api', { method: 'HEAD' })
      .then(response => {
        console.log('🔄 Server availability check: Server is responding', {
          status: response.status, 
          ok: response.ok
        });
      })
      .catch(error => {
        console.error('🔄 Server availability check: Server is not responding', {
          error: error.message || 'Unknown error'
        });
      });
  }
}
