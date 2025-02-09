import { Injectable } from '@angular/core';
import { HttpEvent, HttpHandler, HttpInterceptor, HttpRequest } from '@angular/common/http';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { UserStateService } from '../services/user-state.service';

@Injectable()
export class UserStateInterceptor implements HttpInterceptor {
  private loginLogged = false;
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

  constructor(private userStateService: UserStateService) {
    console.log('UserStateInterceptor initialized');
  }

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    console.log('Intercepting request:', req.url);
    const userStateEndpoints = ['/api/user/saveLoginDateTime', '/api/user/saveVisitLength', '/api/user/saveVisitedPages'];
    console.log('User state endpoints:', userStateEndpoints);

    if (!userStateEndpoints.some(endpoint => req.url.includes(endpoint))) {
      const startTime = Date.now();
      console.log('STATE: Request started:', req.url);

      if (!this.loginLogged) {
        console.log('Logging login date and time');
        this.userStateService.setLoginDateTime(new Date());
        this.loginLogged = true;
      }

      const pageName = this.pageNameMapping[req.url.split('?')[0]] || 'Unknown';
      console.log('Page name determined:', pageName);
      this.userStateService.addVisitedPage(pageName);
      console.log('STATE: Visited page added:', pageName);

      return next.handle(req).pipe(
        tap(event => {
          const elapsedTime = Date.now() - startTime;
          console.log(`STATE: Request completed: ${req.url}, Elapsed time: ${elapsedTime}`);
          this.userStateService.setVisitLength(elapsedTime);
          console.log(`STATE: Visit length set: ${elapsedTime}`);
        })
      );
    } else {
      console.log('Request URL is in user state endpoints, passing through');
      return next.handle(req);
    }
  }
}
