import { Inject, Injectable } from '@angular/core';
import { HttpRequest, HttpHandler, HttpEvent, HttpInterceptor, HttpResponse, HttpErrorResponse } from '@angular/common/http';
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

    let serviceName = 'api';
    try {
      const url = new URL(req.url || '', window.location.origin);
      const pathParts = url.pathname.split('/');
      serviceName = pathParts.length > 1 ? pathParts[1] : 'api';
    } catch (error) {
      this.logger.warn('Failed to parse URL for service name', { url: req.url, error });
    }

    const callId = this.logger.startServiceCall(serviceName, req.method, req.url || '');

    return next.handle(req).pipe(
      tap(event => {
        if (event instanceof HttpResponse) {

          this.logger.endServiceCall(callId, event.status);
        }
      }),
      catchError((error: unknown) => {
        let status = 500;                        
        if (error instanceof HttpErrorResponse) {
          status = error.status;
        }

        this.logger.endServiceCall(callId, status);
        return throwError(() => error);
      }),
    );
  }
}
