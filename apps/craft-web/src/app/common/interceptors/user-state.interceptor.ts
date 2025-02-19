import { Injectable } from '@angular/core';
import { HttpInterceptor, HttpRequest, HttpHandler, HttpEvent } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { UserStateService } from '../services/user-state.service';

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

  constructor(private userStateService: UserStateService) {}

  intercept(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    // Set login time on first request
    if (!this.loginTime) {
      this.loginTime = new Date();
      this.userStateService.setLoginDateTime(this.loginTime).subscribe();
    }

    // Track page visits
    const pageName = this.getPageNameFromUrl(request.url);
    if (pageName) {
      this.userStateService.setVisitedPage(pageName).subscribe();
    }

    // Update visit length periodically
    const now = Date.now();
    const elapsedTime = now - this.loginTime.getTime();
    this.userStateService.setVisitLength(elapsedTime);

    console.log('UserStateInterceptor: ', request.url, pageName, elapsedTime);

    return next.handle(request);
  }

  private getPageNameFromUrl(url: string): string | null {
    const path = url.split('?')[0];
    return this.pageNameMapping[path] || null;
  }
}
