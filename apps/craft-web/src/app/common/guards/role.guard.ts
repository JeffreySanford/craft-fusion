import { Injectable } from '@angular/core';
import { CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot, Router } from '@angular/router';
import { Observable } from 'rxjs';
import { map, take } from 'rxjs/operators';
import { AuthenticationService } from '../services/authentication.service';
import { LoggerService } from '../services/logger.service';

@Injectable({
  providedIn: 'root',
})
export class RoleGuard implements CanActivate {
  constructor(
    private authService: AuthenticationService,
    private router: Router,
    private logger: LoggerService,
  ) {}

  canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Observable<boolean> {

    const requiredRoles = route.data['roles'] as Array<string>;

    if (!requiredRoles || requiredRoles.length === 0) {
      this.logger.warn('Role guard: No roles specified in route data', {
        url: state.url,
      });
      return new Observable<boolean>(observer => observer.next(true));
    }

    return this.authService.currentUser$.pipe(
      take(1),
      map(user => {

        if (!user || !Array.isArray(user.roles)) {
          this.logger.warn('Role guard: User has no roles', {
            url: state.url,
            requiredRoles,
          });

          this.router.navigate(['/access-denied']);
          return false;
        }

        const hasRole = requiredRoles.some(role => user.roles.includes(role));

        if (hasRole) {
          this.logger.debug('Role guard: User has required role', {
            url: state.url,
            userRoles: user.roles,
            requiredRoles,
          });
          return true;
        } else {
          this.logger.warn('Role guard: User does not have required role', {
            url: state.url,
            userRoles: user.roles,
            requiredRoles,
          });

          this.router.navigate(['/access-denied']);
          return false;
        }
      }),
    );
  }
}
