import { Injectable, Inject, forwardRef } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
// Add ResponseType import for better typing
import { Observable, tap, catchError, throwError, timer, switchMap, finalize } from 'rxjs';
import { environment } from '../../../environments/environment';
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

  // Default API URL set to NestJS server - Use relative path for Angular DevServer proxy
  private apiUrl = '/api'; // FIXED: Always use relative URLs for proxy compatibility
  private apiPrefix = '/api'; // Base API path for NestJS
  private apiPrefixGo = '/api-go'; // Base API path for Go
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
      swagger: '/api-go/swagger',
    },
  ];

  private currentServer: Server = this.servers[0]!;

  // Add request throttling to prevent too many simultaneous requests
  private requestThrottler = new Map<string, number>();
  private activeRequests = new Set<string>();
  private readonly MAX_CONCURRENT_REQUESTS = 8;
  private readonly THROTTLE_WINDOW_MS = 1000; // 1 second window

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
    // Prefer token from localStorage (kept by AuthenticationService)
    const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
    const authHeader = token ? `Bearer ${token}` : '';
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (authHeader) {
      headers['Authorization'] = authHeader;
    }
    // Log for debugging which Authorization header is being attached
    this.logger.debug('ApiService.getHeaders', { hasToken: !!token, tokenPreview: token ? token.slice(0, 24) + '...' : null });
    return new HttpHeaders(headers);
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

  // Normalize various header shapes (Headers, HttpHeaders, Record<...>) into a type acceptable by Angular HttpClient
  private normalizeHeaders(headers?: HeadersInit | HttpHeaders | Record<string, string | string[]>): HttpHeaders | Record<string, string | string[]> | undefined {
    if (!headers) return undefined;
    if (headers instanceof HttpHeaders) return headers;
    // Browser Headers
    try {
      // @ts-ignore - Headers may not be available in all environments but will work in browser
      if (typeof (headers as any).forEach === 'function') {
        const h = headers as Headers;
        const obj: Record<string, string> = {};
        h.forEach((value: string, key: string) => { obj[key] = value; });
        return new HttpHeaders(obj);
      }
    } catch (e) {
      // fallthrough
    }

    // Assume it's already a plain record or compatible type
    return headers as Record<string, string | string[]>;
  }

  private normalizeOptions(options?: any): { headers?: HttpHeaders | Record<string, string | string[]>; params?: HttpParams | Record<string, string | string[]>; [k: string]: any } {
    const opts: any = { ...(options || {}) };
    if (opts.headers) {
      opts.headers = this.normalizeHeaders(opts.headers);
    }
    return opts;
  }

  // FIX: Get current URL construction for clarity
  private getFullUrl(endpoint: string): string {
    // Remove leading slashes
    endpoint = endpoint.replace(/^\/+/, '');
    
    // FIXED: Always use the correct API prefix for the proxy
    // This ensures requests go through Angular DevServer proxy correctly
    const baseUrl = this.apiUrl;
    
    // Log the full URL being constructed
    const fullUrl = `${baseUrl}/${endpoint}`;
    this.logger.debug(`Constructed API URL: ${fullUrl}`);
    
    return fullUrl;
  }

  // 🛡️ API CRUD Operations
  /**
   * Creates HTTP GET request to specified endpoint
   * 
   * @param endpoint - API endpoint to request
   * @param options - Optional HTTP request options
   * @returns Observable<T> - Observable that can be subscribed to by state stores
   */
  get<T>(endpoint: string, options?: { headers?: HttpHeaders | Record<string, string | string[]>; params?: HttpParams | Record<string, string | string[]>; [k: string]: any }): Observable<T> {
    const url = this.getFullUrl(endpoint);
    const callId = this.logger.startServiceCall('ApiService', 'GET', url);
    const httpOptions = this.normalizeOptions(options);
    // ensure tracing headers are applied (override or set)
    httpOptions.headers = this.getTracingHeaders();
    
    // Check if we should throttle this request
    if (this.shouldThrottleRequest(url)) {
      return this.delayedRequest<T>(() => this.get(endpoint, options), 300);
    }
    
    // Track this request
    this.trackRequest(url);

    // Enhanced logging for debugging
    this.logger.debug(`Making GET request to ${url}`, {
      endpoint,
      fullUrl: url,
      options: JSON.stringify(httpOptions),
      timestamp: new Date().toISOString()
    });
    
    // Use explicit type casting for the HTTP call
    return this.http.get<T>(url, httpOptions).pipe(
      tap(response => {
        this.logger.endServiceCall(callId, 200);
        this.logger.debug(`GET ${endpoint} succeeded`, {
          responseReceived: true,
          url
        });
      }),
      catchError(error => {
        this.releaseRequest(url);
        this.logger.endServiceCall(callId, error.status || 500);
        this.logger.error(`GET ${endpoint} failed`, { 
          status: error.status,
          message: error.message,
          url,
          timestamp: new Date().toISOString(),
          errorObject: JSON.stringify(error)
        });
        
        // Enhanced error logging
        console.error(`API Error Details:`, {
          url,
          status: error.status,
          message: error.message,
          error
        });
        
        // Implement better backoff for specific error types
        if (error.status === 504 || error.status === 0) {
          // Gateway timeout or network error - don't retry automatically
          return throwError(() => error);
        }

        // Ping server to check availability on error
        this.checkServerAvailability();
        
        throw error;
      }),
      finalize(() => {
        this.releaseRequest(url);
      })
    ) as Observable<T>;
  }

  put<T>(endpoint: string, body: T, options?: { headers?: HttpHeaders | Record<string, string | string[]>; params?: HttpParams | Record<string, string | string[]>; [k: string]: any }): Observable<T> {
    const url = this.getFullUrl(endpoint);
    const callId = this.logger.startServiceCall('ApiService', 'PUT', url);

    const httpOptions = this.normalizeOptions(options);
    httpOptions.headers = this.getTracingHeaders();
    
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

  delete<T>(endpoint: string, options?: { headers?: HttpHeaders | Record<string, string | string[]>; params?: HttpParams | Record<string, string | string[]>; [k: string]: any }): Observable<T> {
    const url = this.getFullUrl(endpoint);
    const callId = this.logger.startServiceCall('ApiService', 'DELETE', url);

    const httpOptions = this.normalizeOptions(options);
    httpOptions.headers = this.getTracingHeaders();
    
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
  getUserState(): Observable<unknown> {
    // Use getFullUrl for proxy compatibility
    return this.http.get<unknown>(this.getFullUrl('users'), { headers: this.getHeaders() });
  }

  /**
   * Updates the user state.
   * @param userState - The new user state.
   * @returns An observable of the updated user state.
   */
  updateUserState(userState: unknown): Observable<unknown> {
    // Use getFullUrl for proxy compatibility
    return this.http.put<unknown>(this.getFullUrl('users'), userState, { headers: this.getHeaders() });
  }

  /**
   * Deletes the user state.
   * @returns An observable of the deletion result.
   */
  deleteUserState(): Observable<unknown> {
    // Use getFullUrl for proxy compatibility
    return this.http.delete<unknown>(this.getFullUrl('users'), { headers: this.getHeaders() });
  }

  /**
   * Sets the API URL based on the provided resource name.
   * @param resource - Resource name to determine which API URL to use
   * @returns The configured API URL
   */
  setApiUrl(resource: string): string {
    this.logger.debug(`Setting API URL for resource: ${resource}`);
    
    // FIXED: Always use relative URLs for proxy compatibility
    if (resource === 'Go') {
      this.apiUrl = '/api-go';  // Use relative URL for Go API
      this.logger.debug(`Switched to Go API: ${this.apiUrl}`);
    } else {
      // Default to NestJS
      this.apiUrl = '/api';  // Use relative URL for NestJS API
      this.logger.debug(`Switched to NestJS API: ${this.apiUrl}`);
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
  handleStringArray(data: string[]): unknown {
    // Implement your logic here
    console.log('Handling string array:', data);
    // Example: Return the length of each string
    return data.map(str => str.length);
  }

  getLogs(limit: number, level?: string): Observable<unknown> {
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
  public authRequest<T>(method: string, endpoint: string, body?: unknown, options?: { headers?: HttpHeaders | Record<string, string | string[]>; params?: HttpParams | Record<string, string | string[]>; [k: string]: any }): Observable<T> {
    // Log detailed debugging information
    console.log('🔍 Auth request details', {
      method,
      endpoint,
      fullUrl: this.getFullUrl(endpoint),
      bodyKeys: body ? Object.keys(body as Record<string, unknown>) : 'none',
      timestamp: new Date().toISOString(),
      options,
      isProduction: this.isProduction
    });
    
    // Enhanced retry options for auth requests
    const enhancedOptions: Record<string, unknown> = { 
      ...(options as Record<string, unknown> || {}),
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
        return this.post<unknown, T>(endpoint, body, finalOptions) as unknown as Observable<T>;
      case 'PUT':
        return this.put<unknown>(endpoint, body, finalOptions) as unknown as Observable<T>;
      case 'DELETE':
        return this.delete<T>(endpoint, finalOptions) as unknown as Observable<T>;
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
  post<T = unknown, R = unknown>(endpoint: string, body: T, options?: { headers?: HttpHeaders | Record<string, string | string[]>; params?: HttpParams | Record<string, string | string[]>; [k: string]: any }): Observable<R> {
    const url = this.getFullUrl(endpoint);
    const callId = this.logger.startServiceCall('ApiService', 'POST', url);

    const httpOptions = this.normalizeOptions(options);
    httpOptions.headers = this.getTracingHeaders();
    
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
        hasCredentials: !!(body && typeof body === 'object' && 'username' in (body as any)),
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
   * Enhanced server availability check
   */
  private checkServerAvailability(): void {
    this.logger.debug('Checking server availability...');
    // Try to ping the server root to check if it's up
    fetch('/api/health', { method: 'HEAD', signal: (AbortSignal as any).timeout ? (AbortSignal as any).timeout(3000) : null })
      .then(response => {
        this.logger.info('Server availability check: Server is responding', {
          status: response.status, 
          ok: response.ok
        });
        this.serverStarting = false;
      })
      .catch(error => {
        // Fallback: try to fetch a static asset to check if frontend is responsive
        fetch('/assets/ping.txt', { method: 'HEAD', signal: (AbortSignal as any).timeout ? (AbortSignal as any).timeout(2000) : null })
          .then(() => {
            this.logger.warn('Backend unavailable, but frontend assets are reachable');
          })
          .catch(() => {
            this.logger.error('Server availability check: Server is not responding', {
              error: error.message || 'Unknown error',
              timestamp: new Date().toISOString()
            });
          });
        this.connectionAttempts++;
        if (this.connectionAttempts <= this.maxStartupRetries) {
          this.serverStarting = true;
          this.logger.warn(`Server might be starting up. Attempt ${this.connectionAttempts} of ${this.maxStartupRetries}`);
        } else {
          this.serverStarting = false;
          this.logger.error('Server appears to be offline after multiple attempts');
        }
      });
  }

  private shouldThrottleRequest(endpoint: string): boolean {
    // If we have too many active requests, throttle new ones
    if (this.activeRequests.size >= this.MAX_CONCURRENT_REQUESTS) {
      return true;
    }
    
    const now = Date.now();
    const lastRequest = this.requestThrottler.get(endpoint) || 0;
    
    if (now - lastRequest < this.THROTTLE_WINDOW_MS) {
      return true; // Should throttle
    }
    
    this.requestThrottler.set(endpoint, now);
    return false;
  }
  
  private trackRequest(endpoint: string): void {
    this.activeRequests.add(endpoint);
  }
  
  private releaseRequest(endpoint: string): void {
    this.activeRequests.delete(endpoint);
  }
  
  private delayedRequest<T>(requestFn: () => Observable<T>, delayMs: number): Observable<T> {
    return timer(delayMs).pipe(
      switchMap(() => requestFn())
    );
  }
}
