import { Injectable } from '@angular/core';
import {
  HttpRequest,
  HttpHandler,
  HttpEvent,
  HttpInterceptor,
  HttpResponse,
  HttpErrorResponse
} from '@angular/common/http';
import { Observable } from 'rxjs';
import { tap, finalize } from 'rxjs/operators';
import { PerformanceMetricsService } from '../services/performance-metrics.service';

/**
 * Interceptor to track API call performance metrics
 */
@Injectable()
export class MetricsInterceptor implements HttpInterceptor {
  constructor(private performanceMetricsService: PerformanceMetricsService) {}

  intercept(request: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
    // Skip non-API requests or metrics requests (to avoid infinite loops)
    if (!request.url.includes('/api/') || request.url.includes('/api/metrics')) {
      return next.handle(request);
    }
    
    const startTime = performance.now();
    
    return next.handle(request).pipe(
      tap(
        event => {
          if (event instanceof HttpResponse) {
            const endTime = performance.now();
            const duration = endTime - startTime;
            const size = this.getResponseSize(event);
            
            this.performanceMetricsService.recordApiCall({
              url: request.url,
              method: request.method,
              duration,
              statusCode: event.status,
              timestamp: new Date(),
              size,
              error: false
            });
          }
        },
        error => {
          if (error instanceof HttpErrorResponse) {
            const endTime = performance.now();
            const duration = endTime - startTime;
            
            this.performanceMetricsService.recordApiCall({
              url: request.url,
              method: request.method,
              duration,
              statusCode: error.status,
              timestamp: new Date(),
              error: true
            });
          }
        }
      )
    );
  }
  
  /**
   * Estimate response size in bytes
   */
  private getResponseSize(response: HttpResponse<any>): number {
    let size = 0;
    
    try {
      if (response.body) {
        size = new TextEncoder().encode(JSON.stringify(response.body)).length;
      }
    } catch (e) {
      // Fallback if we can't calculate size
      size = 0;
    }
    
    return size;
  }
}
