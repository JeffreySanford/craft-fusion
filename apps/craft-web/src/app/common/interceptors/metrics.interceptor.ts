import { Injectable, Injector } from '@angular/core';
import { HttpInterceptor, HttpRequest, HttpHandler, HttpEvent, HttpResponse } from '@angular/common/http';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { PerformanceMetricsService } from '../services/performance-metrics.service';
import { LoggerService } from '../services/logger.service';

@Injectable()
export class MetricsInterceptor implements HttpInterceptor {
  constructor(
    private performanceMetricsService: PerformanceMetricsService,
    private injector: Injector
  ) {}

  private get logger(): LoggerService {
    return this.injector.get(LoggerService);
  }

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    const startTime = performance.now();
    
    return next.handle(req).pipe(
      tap(event => {
        if (event instanceof HttpResponse) {
          const duration = performance.now() - startTime;
          
          // Log performance metrics for this API call
          this.performanceMetricsService.recordApiCall({
            endpoint: req.url,
            method: req.method,
            duration: Math.round(duration),
            success: event.status >= 200 && event.status < 400
          });
          
          this.logger.debug('MetricsInterceptor: Recorded API call metrics', {
            url: req.url,
            method: req.method,
            duration: Math.round(duration),
            status: event.status
          });
        }
      })
    );
  }
}
