import { Injectable } from '@angular/core';
import {
  HttpRequest,
  HttpHandler,
  HttpEvent,
  HttpInterceptor
} from '@angular/common/http';
import { Observable } from 'rxjs';
import { AuthenticationService } from '../services/authentication.service';
import { LoggerService } from '../services/logger.service';

@Injectable()
export class CsrfInterceptor implements HttpInterceptor {
  constructor(
    private authService: AuthenticationService,
    private logger: LoggerService
  ) {}

  intercept(request: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
    // Only add CSRF token for state-changing methods
    if (this.isMutationMethod(request.method)) {
      const csrfToken = this.authService.getCSRFToken();
      
      if (csrfToken) {
        // Add the CSRF token to both headers and cookies
        // The header is used for verification
        // The cookie is used for cross-checking (Double Submit Cookie pattern)
        request = request.clone({
          headers: request.headers.set('X-CSRF-TOKEN', csrfToken),
          // In a production app that uses HttpOnly cookies, you'd set the cookie on the server
          // but for our demo, we'll pretend we're sending the token
          withCredentials: true
        });
      } else {
        this.logger.warn('CSRF token missing for mutation request', {
          url: request.url,
          method: request.method
        });
      }
    }
    
    return next.handle(request);
  }
  
  private isMutationMethod(method: string): boolean {
    return ['POST', 'PUT', 'DELETE', 'PATCH'].includes(method.toUpperCase());
  }
}
