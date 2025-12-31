import { Injectable } from '@angular/core';
import { HttpInterceptor, HttpRequest, HttpHandler, HttpEvent } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AuthenticationService } from '../services/authentication.service';

@Injectable()
export class AuthHttpInterceptor implements HttpInterceptor {
  constructor(private authService: AuthenticationService) {}

  intercept(req: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
    // Get the current token
    const token = this.authService.getAuthToken();

    // Clone the request and add authorization header if token exists
    // Skip adding token to auth endpoints to avoid circular dependencies
    if (token && !this.isAuthEndpoint(req.url)) {
      req = req.clone({
        setHeaders: {
          Authorization: `Bearer ${token}`,
        },
      });
    }

    return next.handle(req);
  }

  private isAuthEndpoint(url: string): boolean {
    // Don't add auth headers to auth endpoints to avoid circular dependencies
    return url.includes('/auth/login') || url.includes('/auth/refresh-token') || url.includes('/auth/user');
  }
}
