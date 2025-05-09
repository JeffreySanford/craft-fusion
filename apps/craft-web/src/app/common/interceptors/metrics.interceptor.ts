import { Inject, Injectable } from '@angular/core';
import {
  HttpRequest,
  HttpHandler,
  HttpEvent,
  HttpInterceptor,
  HttpResponse,
  HttpErrorResponse
} from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { LoggerService } from '../services/logger.service';

@Injectable()
export class MetricsInterceptor implements HttpInterceptor {

  constructor(@Inject(LoggerService) private logger: LoggerService) {
    this.logger.registerService('MetricsInterceptor');
    this.logger.info('MetricsInterceptor initialized');
  }

  intercept(req: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
    // Generate service name from URL
    const url = new URL(req.url, window.location.origin);
    const pathParts = url.pathname.split('/');
    const serviceName = pathParts.length > 1 ? pathParts[1] : 'api';
    
    // Start tracking the call - use the enhanced method
    const callId = this.logger.startServiceCall(serviceName, req.method, req.url);

    return next.handle(req).pipe(
      tap((event) => {
        if (event instanceof HttpResponse) {
          // End tracking with status code
          this.logger.endServiceCall(callId, event.status);
        }
      }),
      catchError((error: any) => {
        let status = 500; // Default server error
        if (error instanceof HttpErrorResponse) {
          status = error.status;
        }
        // End tracking with error status
        this.logger.endServiceCall(callId, status);
        return throwError(() => error);
      })
    );
  }
}
