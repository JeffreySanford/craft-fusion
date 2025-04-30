import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError, of, timer } from 'rxjs';
import { catchError, retry, timeout, map, concatMap, delay, retryWhen, tap } from 'rxjs/operators';
import { LoggerService } from './logger.service';
import { NotificationService } from './notification.service';

@Injectable({
  providedIn: 'root'
})
export class GatewayService {
  private readonly BASE_TIMEOUT = 10000;
  private readonly MAX_RETRIES = 3;
  private isOfflineMode = false;
  private serverStarting = false;
  private connectionAttempts = 0;
  private maxStartupRetries = 5;
  
  constructor(
    private http: HttpClient,
    private logger: LoggerService,
    private notificationService: NotificationService
  ) {
    this.logger.registerService('GatewayService');
  }

  /**
   * Makes an HTTP request with standardized error handling, retries and timeouts
   */
  public request<T>(
    method: string, 
    endpoint: string, 
    options: {
      body?: any;
      headers?: HttpHeaders;
      params?: HttpParams;
      responseType?: any;
      timeout?: number;
      retries?: number;
      isAuthRequest?: boolean;
    } = {}
  ): Observable<T> {
    // Configure request options
    const reqTimeout = options.timeout || this.BASE_TIMEOUT;
    const maxRetries = options.retries || this.MAX_RETRIES;
    const isAuthRequest = options.isAuthRequest || false;
    
    // Prepare URL and tracking ID
    const url = this.getFullApiUrl(endpoint);
    const trackingId = this.generateRequestId();
    
    // Log request start
    this.logger.debug(`${method} request initiated`, {
      endpoint,
      timeout: reqTimeout,
      retries: maxRetries,
      trackingId,
      isAuthRequest
    });
    
    // Make the request with the appropriate method
    let request: Observable<T>;
    
    switch (method.toUpperCase()) {
      case 'GET':
        request = this.http.get<T>(url, options);
        break;
      case 'POST':
        request = this.http.post<T>(url, options.body, options);
        break;
      case 'PUT':
        request = this.http.put<T>(url, options.body, options);
        break;
      case 'DELETE':
        request = this.http.delete<T>(url, options);
        break;
      default:
        this.logger.error(`Unsupported HTTP method: ${method}`);
        return throwError(() => new Error(`Unsupported HTTP method: ${method}`));
    }
    
    // Apply standard behaviors to all requests
    return request.pipe(
      timeout(reqTimeout),
      retryWhen(errors => errors.pipe(
        concatMap((error: HttpErrorResponse, index) => {
          const retryAttempt = index + 1;
          
          // Check for ECONNREFUSED or specific conditions indicating server startup
          const isServerStarting = error.status === 0 || 
                                  (error.error && typeof error.error.message === 'string' && 
                                   error.error.message.includes('ECONNREFUSED'));
          
          // Enhanced retry logic for authentication requests during server startup
          if (isAuthRequest && isServerStarting && this.connectionAttempts < this.maxStartupRetries) {
            // Track that we're in server startup mode
            if (!this.serverStarting) {
              this.serverStarting = true;
              this.notificationService.showInfo(
                'Server appears to be starting up. Will retry connecting automatically.',
                'Server Starting'
              );
            }
            
            this.connectionAttempts++;
            
            // Use exponential backoff with longer delays for server startup
            const startupDelay = Math.min(Math.pow(2, this.connectionAttempts) * 1000, 30000); // Max 30 seconds
            
            this.logger.info(`Server seems to be starting up, retry in ${startupDelay/1000}s...`, {
              endpoint,
              attempt: this.connectionAttempts,
              maxAttempts: this.maxStartupRetries,
              error: error.message,
              trackingId
            });
            
            return timer(startupDelay);
          }
          
          // Standard retry logic for normal connection issues
          if (retryAttempt <= maxRetries && 
              (error.status === 0 || error.status === 504 || error.status === 502)) {
            
            // Normal exponential backoff for regular retries
            const retryDelay = Math.pow(2, retryAttempt - 1) * 1000;
            
            this.logger.warn(`Connection issue, retrying in ${retryDelay}ms...`, {
              endpoint,
              attempt: retryAttempt,
              maxRetries: maxRetries,
              error: error.message,
              trackingId
            });
            
            // Show user notification on first retry
            if (retryAttempt === 1) {
              this.notificationService.showWarning(
                `Server connection issue. Retrying... (${retryAttempt}/${maxRetries})`,
                'Connection Issue'
              );
            }
            
            return of(error).pipe(delay(retryDelay));
          }
          
          return throwError(() => error);
        })
      )),
      tap(response => {
        // Reset connection tracking on success
        if (this.serverStarting) {
          this.serverStarting = false;
          this.connectionAttempts = 0;
          
          this.notificationService.showSuccess(
            'Successfully connected to the server!',
            'Connection Established'
          );
        }
        
        this.logger.debug(`${method} request successful`, {
          endpoint,
          trackingId,
          responseStatus: 'success'
        });
        return response;
      }),
      catchError(error => {
        // Handle offline mode detection
        if (error.status === 0 || error.status === 504) {
          this.isOfflineMode = true;
          
          // Check if we exceeded max startup retries
          if (this.serverStarting && this.connectionAttempts >= this.maxStartupRetries) {
            this.notificationService.showWarning(
              `Server appears to be unavailable after ${this.maxStartupRetries} attempts. Switching to offline mode.`,
              'Offline Mode'
            );
            this.serverStarting = false;
          }
          
          this.logger.warn('Network connectivity issue detected', {
            endpoint,
            errorStatus: error.status,
            errorMessage: error.message,
            trackingId,
            serverStarting: this.serverStarting,
            connectionAttempts: this.connectionAttempts
          });
        }
        
        this.logger.error(`${method} request failed`, {
          endpoint,
          status: error.status,
          message: error.message,
          trackingId
        });
        
        return throwError(() => error);
      })
    );
  }
  
  /**
   * Convenience methods for different HTTP verbs
   */
  public get<T>(endpoint: string, options = {}): Observable<T> {
    return this.request<T>('GET', endpoint, options);
  }
  
  public post<T>(endpoint: string, body: any, options = {}): Observable<T> {
    return this.request<T>('POST', endpoint, { ...options, body });
  }
  
  /**
   * Special method for authentication requests with enhanced retry logic
   */
  public authRequest<T>(method: string, endpoint: string, body?: any, options = {}): Observable<T> {
    return this.request<T>(method, endpoint, { 
      ...options, 
      body, 
      isAuthRequest: true,
      retries: this.maxStartupRetries,
      timeout: this.BASE_TIMEOUT * 2 // Double timeout for auth requests
    });
  }
  
  /**
   * Get offline mode status
   */
  public get isOffline(): boolean {
    return this.isOfflineMode;
  }
  
  /**
   * Check if server appears to be in startup process
   */
  public get isServerStarting(): boolean {
    return this.serverStarting;
  }
  
  /**
   * Reset connection attempt tracking
   */
  public resetConnectionTracking(): void {
    this.connectionAttempts = 0;
    this.serverStarting = false;
  }
  
  /**
   * Check if the backend is available
   */
  public checkBackendHealth(): Observable<boolean> {
    return this.get<any>('health-check', { timeout: 3000 }).pipe(
      map(() => {
        this.isOfflineMode = false;
        return true;
      }),
      catchError(() => {
        this.isOfflineMode = true;
        return of(false);
      })
    );
  }
  
  /**
   * Helper for full URL construction
   */
  private getFullApiUrl(endpoint: string): string {
    endpoint = endpoint.replace(/^\/+/, '');
    return `/api/${endpoint}`;
  }
  
  /**
   * Generate a unique tracking ID for requests
   */
  private generateRequestId(): string {
    return (window.crypto?.randomUUID?.() || Math.random().toString(36).slice(2));
  }
}
