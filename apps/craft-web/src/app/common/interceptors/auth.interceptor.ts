import { Injectable } from '@angular/core';
import {
  HttpRequest,
  HttpHandler,
  HttpEvent,
  HttpInterceptor,
  HttpErrorResponse
} from '@angular/common/http';
import { Observable, throwError, BehaviorSubject, of } from 'rxjs';
import { catchError, filter, take, switchMap, finalize } from 'rxjs/operators';
import { AuthenticationService } from '../services/authentication.service';
import { LoggerService } from '../services/logger.service';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {
  private isRefreshing = false;
  private refreshTokenSubject: BehaviorSubject<any> = new BehaviorSubject<any>(null);

  constructor(
    private authService: AuthenticationService,
    private logger: LoggerService
  ) {}

  intercept(request: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
    // Skip authentication for public endpoints
    if (this.isPublicEndpoint(request.url)) {
      return next.handle(request);
    }
    
    // Add auth headers if we have a token
    const token = this.authService.getAccessToken();
    if (token) {
      request = this.addAuthenticationHeader(request, token);
    }
    
    // Add CSRF token for mutation operations (POST, PUT, DELETE, PATCH)
    if (this.isMutationMethod(request.method)) {
      const csrfToken = this.authService.getCSRFToken();
      if (csrfToken) {
        request = request.clone({
          headers: request.headers.set('X-CSRF-TOKEN', csrfToken)
        });
      }
    }
    
    return next.handle(request).pipe(
      catchError(error => {
        if (error instanceof HttpErrorResponse && error.status === 401) {
          return this.handle401Error(request, next);
        }
        
        // Add detailed logging for security-related errors
        if (error instanceof HttpErrorResponse && 
            [400, 401, 403, 419, 429].includes(error.status)) {
          this.logger.warn('Security-related HTTP error', {
            status: error.status,
            url: request.url,
            method: request.method,
            message: error.message
          });
        }
        
        return throwError(() => error);
      })
    );
  }
  
  private addAuthenticationHeader(request: HttpRequest<any>, token: string): HttpRequest<any> {
    return request.clone({
      headers: request.headers.set('Authorization', `Bearer ${token}`)
    });
  }
  
  private handle401Error(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    if (!this.isRefreshing) {
      this.isRefreshing = true;
      this.refreshTokenSubject.next(null);
      
      return this.authService.refreshToken().pipe(
        switchMap(() => {
          this.isRefreshing = false;
          const newToken = this.authService.getAccessToken();
          this.refreshTokenSubject.next(newToken);
          
          return next.handle(this.addAuthenticationHeader(request, newToken!));
        }),
        catchError((refreshError) => {
          this.isRefreshing = false;
          this.logger.error('Token refresh failed in interceptor', { error: refreshError });
          this.authService.logout().subscribe();
          return throwError(() => refreshError);
        }),
        finalize(() => {
          this.isRefreshing = false;
        })
      );
    } else {
      // Wait for the token to be refreshed
      return this.refreshTokenSubject.pipe(
        filter(token => token !== null),
        take(1),
        switchMap(token => {
          return next.handle(this.addAuthenticationHeader(request, token));
        })
      );
    }
  }
  
  private isPublicEndpoint(url: string): boolean {
    const publicEndpoints = [
      '/api/auth/login',
      '/api/auth/register',
      '/api/auth/forgot-password',
      '/api/public',
      '/assets/'
    ];
    
    return publicEndpoints.some(endpoint => url.includes(endpoint));
  }
  
  private isMutationMethod(method: string): boolean {
    return ['POST', 'PUT', 'DELETE', 'PATCH'].includes(method.toUpperCase());
  }
}