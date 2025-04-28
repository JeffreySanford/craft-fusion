import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { AuthenticationService } from './authentication.service';
import { AuthorizationService } from './authorization.service';
import { User } from '../session.service';
import { LoggerService } from '../logger.service';

/**
 * Auth Service Facade
 * 
 * This service acts as a facade for authentication and authorization,
 * providing a simplified API for components to use.
 */
@Injectable({
  providedIn: 'root'
})
export class AuthService {
  // Expose key observables from AuthenticationService
  readonly isAuthenticated$ = this.authenticationService.isAuthenticated$;
  readonly isAdmin$ = this.authenticationService.isAdmin$;
  readonly isLoggedIn$ = this.authenticationService.isLoggedIn$;

  constructor(
    private authenticationService: AuthenticationService,
    private authorizationService: AuthorizationService,
    private logger: LoggerService
  ) {
    this.logger.registerService('AuthService');
    this.logger.info('Auth Service facade initialized');
  }

  // Authentication methods
  login(username: string, password: string): Observable<any> {
    return this.authenticationService.login(username, password);
  }

  logout(): void {
    this.authenticationService.logout();
  }

  getAuthToken(): string | null {
    return this.authenticationService.getAuthToken();
  }

  // Authorization methods
  canAccessResource(resource: string): Observable<boolean> {
    return this.authorizationService.canAccessResource(resource);
  }
}
