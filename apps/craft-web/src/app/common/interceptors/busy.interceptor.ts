import { HttpHandler, HttpInterceptor, HttpRequest } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { finalize, tap } from 'rxjs';
import { BusyService } from '../services/busy.service';
import { LoggerService } from '../services/logger.service';

@Injectable({ providedIn: 'root' })
export class BusyHttpInterceptor implements HttpInterceptor {
  constructor(
    private busyService: BusyService,
    private logger: LoggerService,
  ) {
    this.logger.registerService('BusyHttpInterceptor');
    this.logger.info('BusyHttpInterceptor initialized');
  }

  intercept(request: HttpRequest<unknown>, next: HttpHandler) {
    const msg = request.method === 'GET' ? 'Loading...' : 'Saving...';
    this.busyService.increment(msg);

    this.logger.debug(`Busy state incremented: ${msg}`, {
      method: request.method,
      url: request.url,
    });

    return next.handle(request).pipe(
      tap({
        error: error => {
          this.logger.debug(`Request errored: ${request.url}`, { error: error.message });
        },
      }),
      finalize(() => {
        this.busyService.decrement();
        this.logger.debug(`Busy state decremented`);
      }),
    );
  }
}
