import { Injectable } from '@angular/core';
import { HttpRequest, HttpHandler, HttpEvent, HttpInterceptor } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { LoggerService } from '../services/logger.service';
import { SessionService } from '../services/session.service';

@Injectable()
export class ReadOnlyInterceptor implements HttpInterceptor {
  constructor(
    private sessionService: SessionService,
    private logger: LoggerService,
  ) {
    this.logger.registerService('ReadOnlyInterceptor');
    this.logger.info('ReadOnlyInterceptor initialized');
  }

  intercept(request: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
    const readOnly = this.sessionService.status();

    if (!readOnly) {

      this.logger.startServiceCall('ReadOnlyInterceptor', request.method, request.url);

      this.logger.debug(`Allowing ${request.method} request to ${request.url}`);

      return next.handle(request);
    } else {

      const errorMsg = `Error: cannot ${request.method} ${request.url} when read-only`;
      this.logger.error(errorMsg);

      const callId = this.logger.startServiceCall('ReadOnlyInterceptor', request.method, request.url);
      this.logger.endServiceCall(callId, 403);                                        

      return throwError(() => new Error(errorMsg));
    }
  }
}
