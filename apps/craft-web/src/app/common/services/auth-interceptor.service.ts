import { Injectable, Injector } from '@angular/core';
import { 
  HttpEvent, HttpInterceptor, HttpHandler, HttpRequest,
  HttpResponse, HttpErrorResponse
} from '@angular/common/http';
import { Observable, throwError, from } from 'rxjs';
import { catchError, map, switchMap } from 'rxjs/operators';
import { AuthService } from './auth.service';
import { LoggerService } from './logger.service';

@Injectable()
export class AuthInterceptorService implements HttpInterceptor {
  // Using private properties instead of constructor injection
  private authService!: AuthService;
  private logger!: LoggerService;

  constructor(private injector: Injector) {}

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    // Lazy load services to break circular dependency
    if (!this.authService) {
      this.authService = this.injector.get(AuthService);
    }
    
    if (!this.logger) {
      this.logger = this.injector.get(LoggerService);
    }
    
    const token = this.authService.getToken();
    const requestId = Math.random().toString(36).substring(2, 15);
    const startTime = performance.now();
    
    // Log outgoing request
    this.logger.debug(`HTTP ${req.method} request to ${req.url}`, {
      requestId,
      method: req.method,
      url: req.url,
      headers: req.headers.keys().length,
      withCredentials: req.withCredentials,
      timestamp: new Date()
    });

    // Only add auth header if token exists and request is to our own API
    if (token && this.isApiUrl(req.url)) {
      req = req.clone({
        setHeaders: {
          Authorization: `Bearer ${token}`
        }
      });
      
      this.logger.debug('Added auth token to request', {
        requestId,
        url: req.url
      });
    }

    return next.handle(req).pipe(
      map((event: HttpEvent<any>) => {
        if (event instanceof HttpResponse) {
          const duration = Math.round(performance.now() - startTime);
          this.logger.debug(`HTTP ${req.method} response from ${req.url}`, {
            requestId,
            status: event.status,
            duration,
            size: this.getResponseSize(event),
            timestamp: new Date()
          });
        }
        return event;
      }),
      catchError((error: HttpErrorResponse) => {
        const duration = Math.round(performance.now() - startTime);
        
        // Log detailed error info
        this.logger.error(`HTTP ${req.method} error from ${req.url}`, {
          requestId,
          status: error.status,
          message: error.message,
          duration,
          timestamp: new Date()
        });

        // If 401 Unauthorized, try to refresh the token
        if (error.status === 401 && this.isApiUrl(req.url)) {
          this.logger.info('Unauthorized request, attempting token refresh', { requestId });
          return this.handle401Error(req, next, requestId);
        }

        return throwError(() => error);
      })
    );
  }

  private handle401Error(request: HttpRequest<any>, next: HttpHandler, requestId: string): Observable<HttpEvent<any>> {
    this.logger.info('Refreshing authentication token', { requestId });
    
    return from(this.authService.refreshToken()).pipe(
      switchMap(success => {
        if (success) {
          this.logger.info('Token refresh successful, retrying request', { requestId });
          const token = this.authService.getToken();
          
          const newRequest = request.clone({
            setHeaders: {
              Authorization: `Bearer ${token}`
            }
          });
          
          return next.handle(newRequest);
        }
        
        // If refresh fails, redirect to login
        this.logger.warn('Token refresh failed, redirecting to login', { requestId });
        this.authService.logout();
        return throwError(() => new Error('Session expired. Please login again.'));
      }),
      catchError(error => {
        this.logger.error('Error during token refresh', { 
          requestId,
          error: error.message
        });
        this.authService.logout();
        return throwError(() => new Error('Authentication failed. Please login again.'));
      })
    );
  }
  
  private isApiUrl(url: string): boolean {
    return url.includes('/api/') || url.includes('/api-go/');
  }
  
  private getResponseSize(response: HttpResponse<any>): string {
    if (!response.body) return '0 KB';
    
    try {
      const jsonSize = JSON.stringify(response.body).length;
      if (jsonSize < 1024) {
        return `${jsonSize} B`;
      } else if (jsonSize < 1048576) {
        return `${Math.round(jsonSize / 1024)} KB`;
      } else {
        return `${Math.round(jsonSize / 1048576)} MB`;
      }
    } catch (e) {
      return 'unknown size';
    }
  }
}
