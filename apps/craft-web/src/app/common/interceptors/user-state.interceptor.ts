import { Injectable, Injector } from '@angular/core';
import { HttpInterceptor, HttpRequest, HttpHandler, HttpEvent } from '@angular/common/http';
import { Observable } from 'rxjs';
import { UserStateService } from '../services/user-state.service';
import { LoggerService } from '../services/logger.service';

@Injectable()
export class UserStateInterceptor implements HttpInterceptor {
  constructor(
    private userStateService: UserStateService,
    private injector: Injector
  ) {}

  private get logger(): LoggerService {
    return this.injector.get(LoggerService);
  }

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    this.logger.debug('UserStateInterceptor: Processing request', {
      url: req.url,
      method: req.method
    });
    
    return next.handle(req);
  }
}
