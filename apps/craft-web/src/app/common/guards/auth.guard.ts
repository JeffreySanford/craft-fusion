import { Injectable } from '@angular/core';
import { CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot, Router } from '@angular/router';
import { AuthenticationService } from '../services/authentication.service';
import { LoggerService } from '../services/logger.service';

@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanActivate {
  constructor(
    private authService: AuthenticationService,
    private router: Router,
    private logger: LoggerService
  ) {}

  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): boolean {
    // Check current authentication state synchronously
    if (this.authService.isAuthenticated) {
      this.logger.debug('Auth guard: User is authorized to access route', {
        url: state.url
      });
      return true;
    } else {
      this.logger.warn('Auth guard: Unauthenticated access attempt, redirecting to home', {
        url: state.url
      });
      
      // Redirect to landing page
      this.router.navigate(['/home']);
      return false;
    }
  }
}
