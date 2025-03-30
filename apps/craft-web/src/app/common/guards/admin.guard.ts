import { Injectable } from '@angular/core';
import { 
  CanActivate, 
  ActivatedRouteSnapshot, 
  RouterStateSnapshot, 
  Router,
  UrlTree
} from '@angular/router';
import { Observable, of } from 'rxjs';
import { catchError, map, tap } from 'rxjs/operators';
import { AuthenticationService } from '../services/authentication.service';
import { AuthorizationService, Permission } from '../services/authorization.service';
import { LoggerService } from '../services/logger.service';
import { NotificationService } from '../services/notification.service';

@Injectable({
  providedIn: 'root'
})
export class AdminGuard implements CanActivate {
  constructor(
    private authService: AuthenticationService,
    private authzService: AuthorizationService,
    private router: Router,
    private logger: LoggerService,
    private notification: NotificationService
  ) {}

  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): Observable<boolean | UrlTree> | Promise<boolean | UrlTree> | boolean | UrlTree {
    // Check if user is logged in
    if (!this.authService.isLoggedIn()) {
      this.logger.warn('Access denied: User not logged in', { 
        targetUrl: state.url 
      });
      
      this.notification.showWarning('You must be logged in to access this page');
      return this.router.createUrlTree(['/login'], { 
        queryParams: { redirectUrl: state.url }
      });
    }

    // Get required permissions from route data
    const requiredPermissions: Permission[] = route.data['permissions'] || [];
    
    // If no specific permissions defined, just check for admin role
    if (requiredPermissions.length === 0) {
      const isAdmin = this.authService.hasRole('admin');
      
      if (!isAdmin) {
        this.logger.warn('Access denied: User is not an admin', { 
          targetUrl: state.url 
        });
        
        this.notification.showError('You do not have permission to access this area');
        return this.router.createUrlTree(['/']);
      }
      
      return true;
    }

    // Check specific permissions
    return this.authzService.hasPermissions(requiredPermissions).pipe(
      tap(hasPermission => {
        if (!hasPermission) {
          this.logger.warn('Access denied: Insufficient permissions', { 
            targetUrl: state.url,
            requiredPermissions
          });
          
          this.notification.showError('You do not have permission to access this area');
        }
      }),
      map(hasPermission => {
        return hasPermission ? true : this.router.createUrlTree(['/']);
      }),
      catchError(err => {
        this.logger.error('Error checking permissions', { error: err });
        return of(this.router.createUrlTree(['/']));
      })
    );
  }
}
