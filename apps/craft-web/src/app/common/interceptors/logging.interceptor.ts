import { Injectable, Injector } from '@angular/core';
import { HttpInterceptor, HttpRequest, HttpHandler, HttpEvent, HttpResponse } from '@angular/common/http';
import { Observable } from 'rxjs';
import { tap, finalize } from 'rxjs/operators';
import { LoggerService } from '../services/logger.service';

@Injectable()
export class LoggingHttpInterceptor implements HttpInterceptor {
  constructor(private injector: Injector) {}

  private get logger(): LoggerService {
    return this.injector.get(LoggerService);
  }

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    const startTime = performance.now();
    const reqId = Math.random().toString(36).substring(2, 10);
    
    return next.handle(req).pipe(
      tap({
        next: (event) => {
          if (event instanceof HttpResponse) {
            const duration = Math.round(performance.now() - startTime);
            this.logger.debug(`HTTP ${req.method} ${req.url} completed in ${duration}ms`, {
              url: req.url,
              method: req.method,
              duration,
              status: event.status,
              id: reqId
            });
          }
        },
        error: (error) => {
          const duration = Math.round(performance.now() - startTime);
          this.logger.error(`HTTP Error for ${req.method} ${req.url}`, {
            url: req.url,
            method: req.method,
            error: error.message,
            status: error.status,
            duration,
            id: reqId
          });
        }
      })
    );
  }
}