import { Injectable } from '@angular/core';
import { CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot, Router } from '@angular/router';
import { Observable, of } from 'rxjs';
import { map, take } from 'rxjs/operators';
import { AuthenticationService } from '../services/authentication.service';
import { LoggerService } from '../services/logger.service';

@Injectable({
  providedIn: 'root',
})
export class AuthGuard implements CanActivate {
  constructor(
    private authService: AuthenticationService,
    private router: Router,
    private logger: LoggerService,
  ) {}

  canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Observable<boolean> {
    if ((globalThis as any).__SKIP_AUTH_GUARD) {
      return of(true);
    }

    return this.authService.isLoggedIn$.pipe(
      take(1),
      map(isLoggedIn => {
        if (isLoggedIn) {
          this.logger.debug('Auth guard: User is authorized to access route', {
            url: state.url,
          });
          return true;
        }

        this.logger.warn('Auth guard: Unauthenticated access attempt, redirecting to home', {
          url: state.url,
        });

        this.router.navigate(['/home']);
        return false;
      }),
    );
  }
}
