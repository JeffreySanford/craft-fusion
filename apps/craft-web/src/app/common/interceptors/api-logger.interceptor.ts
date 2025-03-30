import { Injectable, Injector } from '@angular/core';
import { HttpInterceptor, HttpRequest, HttpHandler, HttpEvent, HttpResponse } from '@angular/common/http';
import { Observable } from 'rxjs';
import { tap, finalize } from 'rxjs/operators';
import { ApiLoggerService } from '../services/api-logger.service';
import { LoggerService } from '../services/logger.service';

@Injectable()
export class ApiLoggerInterceptor implements HttpInterceptor {
  constructor(
    private apiLoggerService: ApiLoggerService,
    private injector: Injector
  ) {}

  private get logger(): LoggerService {
    return this.injector.get(LoggerService);
  }

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    const startTime = performance.now();
    const requestId = Math.random().toString(36).substring(2, 15);
    
    // Log request start
    this.logger.debug(`API Request: ${req.method} ${req.url}`, {
      requestId,
      url: req.url,
      method: req.method
    });
    
    return next.handle(req).pipe(
      tap(event => {
        if (event instanceof HttpResponse) {
          const duration = performance.now() - startTime;
          
          // Log API call
          this.apiLoggerService.logApiCall({
            request: {
              method: req.method,
              url: req.url,
              headers: req.headers.keys().reduce((acc, key) => {
                acc[key] = req.headers.get(key);
                return acc;
              }, {} as Record<string, string | null>)
            },
            response: {
              status: event.status,
              statusText: event.statusText,
              body: this.sanitizeResponseBody(event.body)
            },
            timestamp: Date.now(),
            responseTime: Math.round(duration),
            id: requestId
          });
          
          this.logger.debug(`API Response: ${req.method} ${req.url}`, {
            requestId,
            status: event.status,
            duration: Math.round(duration)
          });
        }
      }),
      finalize(() => {
        // Additional cleanup if needed
      })
    );
  }
  
  private sanitizeResponseBody(body: any): any {
    // Sanitize sensitive data before logging
    if (!body) return null;
    
    try {
      // Create a shallow copy
      const sanitized = { ...body };
      
      // Remove sensitive fields
      if (sanitized.password) sanitized.password = '***';
      if (sanitized.token) sanitized.token = '***';
      if (sanitized.accessToken) sanitized.accessToken = '***';
      
      return sanitized;
    } catch (e) {
      return '[unsanitizable response]';
    }
  }
}
