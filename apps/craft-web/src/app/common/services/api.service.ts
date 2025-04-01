import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError, of } from 'rxjs';
import { catchError, tap, finalize, map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';

interface LogEntry {
  timestamp: Date;
  level: string;
  message: string;
  data?: any;
}

/**
 * Server metrics data structure
 */
export interface ServerMetrics {
  name: string;
  cpuUsage: number;
  memoryUsage: number;
  uptime: number;
  requestsPerMinute: number;
  activeConnections: number;
  errorRate: number;
  responseTime: number;
  timestamp: Date;
  throughput?: number;
  status: 'healthy' | 'degraded' | 'critical' | 'warning' | 'online' | 'offline';
  latency?: number;
  serverMetrics?: {
    cpu: number;
    memory: number;
    uptime: number;
    activeUsers: number;
    requests?: number;
    errors?: number;
    connections?: number;
    throughput?: number;
    requestsPerSecond?: number;
  };
  apiPerformance: {
    avgResponseTime: number;
    totalRequests: number;
    successfulRequests: number;
    failedRequests: number;
    endpointStats: Record<string, any>;
  };
  tol?: number; // Time of last update
}

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  private apiUrl = environment.apiUrl;
  private debugLogs: LogEntry[] = [];

  constructor(private http: HttpClient) { }

  /**
   * Internal logging method to avoid circular dependency with LoggerService
   */
  private log(level: string, message: string, data?: any): void {
    // Store logs internally for possible server reporting
    this.debugLogs.push({
      timestamp: new Date(),
      level,
      message,
      data
    });
    
    // Keep log history manageable
    if (this.debugLogs.length > 100) {
      this.debugLogs.shift();
    }
    
    // Still log to console for development visibility
    if (!environment.production) {
      const method = level === 'error' ? 'error' : 'log';
      console[method](`API Service: ${message}`, data || '');
    }
  }

  /**
   * GET request
   * @param endpoint API endpoint
   * @param options HTTP options
   * @returns Observable of response
   */
  get<T>(endpoint: string, options?: { 
    headers?: HttpHeaders | {[header: string]: string | string[]},
    params?: HttpParams | {[param: string]: string | string[]},
    reportProgress?: boolean,
    withCredentials?: boolean
  }): Observable<T> {
    const startTime = performance.now();
    const url = this.createUrl(endpoint);
    
    this.log('info', `GET request to ${url}`);
    
    return this.http.get<T>(url, options).pipe(
      tap(() => {
        // Success handling
        const duration = Math.round(performance.now() - startTime);
        this.log('debug', `GET ${url} completed successfully in ${duration}ms`);
      }),
      catchError((error) => this.handleError(error, url, 'GET')),
      finalize(() => {
        // Clean up if needed
      })
    );
  }

  /**
   * POST request
   * @param endpoint API endpoint
   * @param body Request body
   * @param options HTTP options
   * @returns Observable of response
   */
  post<T>(endpoint: string, body: any, options?: {
    headers?: HttpHeaders | {[header: string]: string | string[]},
    params?: HttpParams | {[param: string]: string | string[]},
    reportProgress?: boolean,
    withCredentials?: boolean
  }): Observable<T> {
    const startTime = performance.now();
    const url = this.createUrl(endpoint);
    
    this.log('info', `POST request to ${url}`);
    
    return this.http.post<T>(url, body, options).pipe(
      tap(() => {
        // Success handling
        const duration = Math.round(performance.now() - startTime);
        this.log('debug', `POST ${url} completed successfully in ${duration}ms`);
      }),
      catchError((error) => this.handleError(error, url, 'POST')),
      finalize(() => {
        // Clean up if needed
      })
    );
  }

  /**
   * PUT request
   * @param endpoint API endpoint
   * @param body Request body
   * @param options HTTP options
   * @returns Observable of response
   */
  put<T>(endpoint: string, body: any, options?: {
    headers?: HttpHeaders | {[header: string]: string | string[]},
    params?: HttpParams | {[param: string]: string | string[]},
    reportProgress?: boolean,
    withCredentials?: boolean
  }): Observable<T> {
    const startTime = performance.now();
    const url = this.createUrl(endpoint);
    
    this.log('info', `PUT request to ${url}`);
    
    return this.http.put<T>(url, body, options).pipe(
      tap(() => {
        // Success handling
        const duration = Math.round(performance.now() - startTime);
        this.log('debug', `PUT ${url} completed successfully in ${duration}ms`);
      }),
      catchError((error) => this.handleError(error, url, 'PUT')),
      finalize(() => {
        // Clean up if needed
      })
    );
  }

  /**
   * DELETE request
   * @param endpoint API endpoint
   * @param options HTTP options
   * @returns Observable of response
   */
  delete<T>(endpoint: string, options?: {
    headers?: HttpHeaders | {[header: string]: string | string[]},
    params?: HttpParams | {[param: string]: string | string[]},
    reportProgress?: boolean,
    withCredentials?: boolean,
    body?: any
  }): Observable<T> {
    const startTime = performance.now();
    const url = this.createUrl(endpoint);
    
    this.log('info', `DELETE request to ${url}`);
    
    return this.http.delete<T>(url, options).pipe(
      tap(() => {
        // Success handling
        const duration = Math.round(performance.now() - startTime);
        this.log('debug', `DELETE ${url} completed successfully in ${duration}ms`);
      }),
      catchError((error) => this.handleError(error, url, 'DELETE')),
      finalize(() => {
        // Clean up if needed
      })
    );
  }
  
  /**
   * Check API status - used by health service
   * @returns Observable of status response
   */
  checkApiStatus(): Observable<any> {
    return this.get<any>('/health');
  }

  /**
   * Get API base URL
   * @returns Current API URL
   */
  getApiUrl(): string {
    return this.apiUrl;
  }

  /**
   * Set API base URL
   * @param url New API URL
   * @returns Observable for chaining
   */
  setApiUrl(url: string): Observable<void> {
    this.apiUrl = url;
    this.log('info', `API URL set to ${url}`);
    return of(undefined);
  }

  /**
   * Get NestJS server metrics
   * @returns Observable with server metrics
   */
  getNestServerMetrics(): Observable<ServerMetrics> {
    return this.get<ServerMetrics>('/metrics/nest').pipe(
      map(metrics => ({
        ...metrics,
        timestamp: new Date()
      }))
    );
  }

  /**
   * Get Go server metrics
   * @returns Observable with server metrics
   */
  getGoServerMetrics(): Observable<ServerMetrics> {
    return this.get<ServerMetrics>('/metrics/go').pipe(
      map(metrics => ({
        ...metrics,
        timestamp: new Date()
      }))
    );
  }

  /**
   * Create full URL from endpoint
   */
  private createUrl(endpoint: string): string {
    // If the endpoint already starts with http, it's already a full URL
    if (endpoint.startsWith('http')) {
      return endpoint;
    }
    
    // Remove leading slash if present to avoid double slashes
    const sanitizedEndpoint = endpoint.startsWith('/') ? endpoint.substr(1) : endpoint;
    return `${this.apiUrl}/${sanitizedEndpoint}`;
  }

  /**
   * Handle API errors
   */
  private handleError(error: HttpErrorResponse, url: string, method: string): Observable<never> {
    let errorMessage = 'Unknown error occurred';
    
    if (error.error instanceof ErrorEvent) {
      // Client-side error
      errorMessage = `Client error: ${error.error.message}`;
    } else {
      // Server-side error
      errorMessage = `Server error: ${error.status} ${error.statusText}`;
    }
    
    this.log('error', `${method} ${url} failed`, {
      status: error.status,
      message: error.message,
      error: error.error
    });
    
    return throwError(error);
  }

  /**
   * Get logs for server reporting (can be used by LoggerService)
   */
  getDebugLogs(): LogEntry[] {
    return [...this.debugLogs];
  }

  /**
   * Clear internal logs
   */
  clearDebugLogs(): void {
    this.debugLogs = [];
  }
}
