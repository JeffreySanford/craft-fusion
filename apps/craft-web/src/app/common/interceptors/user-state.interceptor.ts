import { Injectable } from '@angular/core';
import { HttpInterceptor, HttpRequest, HttpHandler, HttpEvent } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { UserStateService } from '../services/user-state.service';
import { LoggerService } from '../services/logger.service';

@Injectable()
export class UserStateInterceptor implements HttpInterceptor {
  private loginTime: Date | null = null;
  private pageNameMapping: { [key: string]: string } = {
    '/home': 'Home',
    '/table': 'Table',
    '/table/:id': 'Table Detail',
    '/data-visualizations': 'Data Visualizations',
    '/book': 'Book',
    '/peasant-kitchen': 'Peasant Kitchen',
    '/peasant-kitchen/recipe/:id': 'Recipe Detail',
    '/space-video': 'Space Video',
    '/material-icons': 'Material Icons',
    '/material-buttons': 'Material Buttons',
    '/resume': 'Resume',
    '/404': 'Not Found',
  };

  constructor(
    private userStateService: UserStateService,
    private logger: LoggerService
  ) {
    // Register the interceptor with the logger
    this.logger.registerService('UserStateInterceptor');
    this.logger.info('UserStateInterceptor initialized');
  }

  intercept(request: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
    // Set login time on first request
    if (!this.loginTime) {
      this.loginTime = new Date();
      this.logger.highlight(`Setting initial login time: ${this.loginTime.toISOString()}`);
      this.userStateService.setLoginDateTime(this.loginTime).subscribe();
    }

    // Track page visits
    const pageName = this.getPageNameFromUrl(request.url);
    if (pageName) {
      this.logger.info(`User navigated to page: ${pageName}`);
      this.userStateService.setVisitedPage(pageName).subscribe();
    }

    // Update visit length periodically
    const now = Date.now();
    const elapsedTime = now - (this.loginTime?.getTime() || now);
    this.userStateService.setVisitLength(elapsedTime).subscribe();

    this.logger.debug(`Request intercepted: ${request.url}`, { 
      pageName,
      elapsedTime: `${Math.floor(elapsedTime / 1000)}s`
    });

    return next.handle(request);
  }

  private getPageNameFromUrl(url: string): string | null {
    const path = url.split('?')[0];
    return this.pageNameMapping[path] || null;
  }
}
