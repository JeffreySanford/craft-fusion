import { Injectable } from '@angular/core';
import { CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot, Router, UrlTree } from '@angular/router';
import { Observable } from 'rxjs';
import { AuthenticationService } from '../services/authentication.service';
import { LoggerService } from '../services/logger.service';
import { map, take } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanActivate {
  constructor(
    private authService: AuthenticationService,
    private router: Router,
    private logger: LoggerService
  ) {
    this.logger.registerService('AuthGuard');
  }

  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): Observable<boolean | UrlTree> | Promise<boolean | UrlTree> | boolean | UrlTree {
    // Get the flag if this is a security-sensitive route
    const isSecurityPage = route.data?.['securitySensitive'] === true;
    
    this.logger.debug('Auth guard checking route', { 
      url: state.url, 
      securitySensitive: isSecurityPage,
      data: route.data
    });
    
    return this.authService.isAuthenticated$.pipe(
      take(1),
      map(isAuthenticated => {
        if (isAuthenticated) {
          this.logger.info('User authenticated, granting access', { url: state.url });
          return true;
        }
        
        this.logger.warn('Authentication required, redirecting to login', { 
          url: state.url, 
          securitySensitive: isSecurityPage
        });
        
        // For security pages, add a message param to emphasize security
        const queryParams = isSecurityPage ? 
          { returnUrl: state.url, message: 'securityAccess' } : 
          { returnUrl: state.url };
          
        // Redirect to login page with return URL
        return this.router.createUrlTree(['/login'], { queryParams });
      })
    );
  }
}
