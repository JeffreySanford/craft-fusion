import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { tap } from 'rxjs/operators';
import { AuthenticationService } from './authentication.service';
import { AuthorizationService } from './authorization.service';
import { User, AuthResponse } from '../user.interface';
import { LoggerService } from '../logger.service';

@Injectable({
  providedIn: 'root',
})
export class AuthService {

  readonly isAuthenticated$: Observable<boolean>;
  readonly isAdmin$: Observable<boolean>;
  readonly isLoggedIn$: Observable<boolean>;

  private guestUser: User = {
    id: -1,
    username: 'guest',
    firstName: 'Guest',
    lastName: 'User',
    name: 'Guest User',
    email: '',
    roles: ['guest'],
    password: '',
  };

  constructor(
    private authenticationService: AuthenticationService,
    private authorizationService: AuthorizationService,
    private logger: LoggerService,
  ) {

    this.isAuthenticated$ = this.authenticationService.isLoggedIn$;
    this.isAdmin$ = this.authenticationService.isAdmin$;
    this.isLoggedIn$ = this.authenticationService.isLoggedIn$;

    this.logger.registerService('AuthService');
    this.logger.info('Auth Service facade initialized');

    this.isAuthenticated$ = this.authenticationService.isLoggedIn$;
    this.isAdmin$ = this.authenticationService.isAdmin$;
    this.isLoggedIn$ = this.authenticationService.isLoggedIn$;
  }

  login(username: string, password: string): Observable<AuthResponse> {
    return this.authenticationService.login(username, password);
  }

  logout(): void {
    this.authenticationService.logout();
  }

  getAuthToken(): string | null {
    return this.authenticationService.getAuthToken();
  }

  loginAsGuest(): Observable<User> {
    this.logger.info('User logging in as guest');

    return of(this.guestUser).pipe(
      tap(() => {

        this.logger.debug('Guest user state initialized');
      }),
    );
  }

  isGuest(): boolean {
    const token = this.getAuthToken();

    return !token && this.canAccessGuestResources();
  }

  canAccessResource(resource: string): Observable<boolean> {

    if (this.isGuestResource(resource) && this.isGuest()) {
      return of(true);
    }
    return this.authorizationService.canAccessResource(resource);
  }

  hasRole(role: string | string[]): boolean {

    if ((typeof role === 'string' && role === 'guest') || (Array.isArray(role) && role.includes('guest'))) {
      if (this.isGuest()) {
        return true;
      }
    }

    return false;                                                          
  }

  private isGuestResource(resource: string): boolean {

    const guestResources = ['memorial-timeline', 'public-gallery', 'about', 'contact'];
    return guestResources.some(r => resource.includes(r));
  }

  private canAccessGuestResources(): boolean {

    return true;
  }
}
