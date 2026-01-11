import { Injectable } from '@angular/core';
import { HttpRequest, HttpHandler, HttpEvent, HttpInterceptor } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { LoggerService } from '../services/logger.service';
import { SessionService } from '../services/session.service';

@Injectable()
export class ReadOnlyInterceptor implements HttpInterceptor {

  constructor(private sessionService: SessionService, private logger: LoggerService) {
    this.logger.registerService('ReadOnlyInterceptor');
    this.logger.info('ReadOnlyInterceptor initialized');
  }

  intercept(request: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
    const readOnly = this.sessionService.status();

    if (!readOnly) { //|| okIfReadOnly(request)
      const callId = this.logger.startServiceCall('ReadOnlyInterceptor', request.method, request.url);
      
      // Let the request pass through
      this.logger.debug(`Allowing ${request.method} request to ${request.url}`);
      
      // For brevity, we're not handling the completion here, that's done in the metrics interceptor
      return next.handle(request);
    } else {
      // Block the request because we're in read-only mode
      const errorMsg = `Error: cannot ${request.method} ${request.url} when read-only`;
      this.logger.error(errorMsg);
      
      // Track as a failed API call
      const callId = this.logger.startServiceCall('ReadOnlyInterceptor', request.method, request.url);
      this.logger.endServiceCall(callId, 403); // Use 403 Forbidden for read-only mode
      
      return throwError(() => new Error(errorMsg));
    }
  }
}
