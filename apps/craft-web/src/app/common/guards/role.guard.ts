import { Injectable } from '@angular/core';
import { CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot, Router } from '@angular/router';
import { Observable } from 'rxjs';
import { map, take } from 'rxjs/operators';
import { AuthenticationService } from '../services/authentication.service';
import { LoggerService } from '../services/logger.service';

@Injectable({
  providedIn: 'root'
})
export class RoleGuard implements CanActivate {
  constructor(
    private authService: AuthenticationService,
    private router: Router,
    private logger: LoggerService
  ) {}

  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): Observable<boolean> {
    // Get required roles from route data
    const requiredRoles = route.data['roles'] as Array<string>;
    
    if (!requiredRoles || requiredRoles.length === 0) {
      this.logger.warn('Role guard: No roles specified in route data', {
        url: state.url
      });
      return new Observable<boolean>(observer => observer.next(true));
    }

    return this.authService.currentUser$.pipe(
      take(1),
      map(user => {
        // If no user or user has no role
        if (!user || !user.role) {
          this.logger.warn('Role guard: User has no role', {
            url: state.url,
            requiredRoles
          });
          
          this.router.navigate(['/access-denied']);
          return false;
        }

        // Check if user has one of the required roles
        const hasRole = requiredRoles.includes(user.role);
        
        if (hasRole) {
          this.logger.debug('Role guard: User has required role', {
            url: state.url,
            userRole: user.role,
            requiredRoles
          });
          return true;
        } else {
          this.logger.warn('Role guard: User does not have required role', {
            url: state.url,
            userRole: user.role,
            requiredRoles
          });
          
          this.router.navigate(['/access-denied']);
          return false;
        }
      })
    );
  }
}
