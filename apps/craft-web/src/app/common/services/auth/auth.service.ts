import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { tap } from 'rxjs/operators';
import { AuthenticationService } from './authentication.service';
import { AuthorizationService } from './authorization.service';
import { User, AuthResponse } from '../user.interface';
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
  // Define properties without initialization
  readonly isAuthenticated$: Observable<boolean>;
  readonly isAdmin$: Observable<boolean>;
  readonly isLoggedIn$: Observable<boolean>;

  // Guest user data
  private guestUser: User = {
    id: -1,
    username: 'guest',
    firstName: 'Guest',
    lastName: 'User',
    name: 'Guest User',
    email: '',
    roles: ['guest'],
    password: ''
  };

  constructor(
    private authenticationService: AuthenticationService,
    private authorizationService: AuthorizationService,
    private logger: LoggerService
  ) {
    // Initialize properties in the constructor after services are injected
    // authenticationService exposes `isLoggedIn$`; map facade `isAuthenticated$` to it
    this.isAuthenticated$ = this.authenticationService.isLoggedIn$;
    this.isAdmin$ = this.authenticationService.isAdmin$;
    this.isLoggedIn$ = this.authenticationService.isLoggedIn$;
    
    this.logger.registerService('AuthService');
    this.logger.info('Auth Service facade initialized');
    
    // Initialize properties after constructor parameters are available
    // Ensure facade observables reference the underlying authentication service
    this.isAuthenticated$ = this.authenticationService.isLoggedIn$;
    this.isAdmin$ = this.authenticationService.isAdmin$;
    this.isLoggedIn$ = this.authenticationService.isLoggedIn$;
  }

  // Authentication methods
  login(username: string, password: string): Observable<AuthResponse> {
    return this.authenticationService.login(username, password);
  }

  logout(): void {
    this.authenticationService.logout();
  }

  getAuthToken(): string | null {
    return this.authenticationService.getAuthToken();
  }

  // Guest access method
  loginAsGuest(): Observable<User> {
    this.logger.info('User logging in as guest');
    // No need to set a token for guest users
    return of(this.guestUser).pipe(
      tap(user => {
        // Store guest state but don't set an auth token
        this.logger.debug('Guest user state initialized');
      })
    );
  }

  // Check if the current user is a guest
  isGuest(): boolean {
    const token = this.getAuthToken();
    // If no token but can access guest resources, user is a guest
    return !token && this.canAccessGuestResources();
  }

  // Authorization methods
  canAccessResource(resource: string): Observable<boolean> {
    // Allow guests to access specific resources without authentication
    if (this.isGuestResource(resource) && this.isGuest()) {
      return of(true);
    }
    return this.authorizationService.canAccessResource(resource);
  }

  hasRole(role: string | string[]): boolean {
    // Return true for 'guest' role if the user is a guest
    if ((typeof role === 'string' && role === 'guest') || 
        (Array.isArray(role) && role.includes('guest'))) {
      if (this.isGuest()) {
        return true;
      }
    }
    
    // Otherwise delegate to the authorization service
    return false; // This would be implemented in the authorization service
  }

  // Helper methods for guest access
  private isGuestResource(resource: string): boolean {
    // Define which resources are accessible to guests
    const guestResources = [
      'memorial-timeline',
      'public-gallery',
      'about',
      'contact'
    ];
    return guestResources.some(r => resource.includes(r));
  }

  private canAccessGuestResources(): boolean {
    // Logic to determine if guest access is allowed
    // This could check app configuration or other conditions
    return true;
  }
}
