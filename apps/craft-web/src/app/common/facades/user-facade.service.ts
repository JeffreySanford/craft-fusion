import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, of, BehaviorSubject } from 'rxjs';
import { catchError, map, switchMap, tap } from 'rxjs/operators';
import { AuthenticationService } from '../services/authentication.service';
import { AuthorizationService, Permission, SecurityLevel } from '../services/authorization.service';
import { LoggerService } from '../services/logger.service';
import { NotificationService } from '../services/notification.service';
import { UserState } from '../interfaces/user-state.interface';

@Injectable({
  providedIn: 'root'
})
export class UserFacadeService {
  private userStateSubject = new BehaviorSubject<UserState | null>(null);
  
  // Observable of user state for components to subscribe to
  readonly userState$ = this.userStateSubject.asObservable();

  constructor(
    private authService: AuthenticationService,
    private authzService: AuthorizationService,
    private router: Router,
    private logger: LoggerService,
    private notification: NotificationService
  ) {
    this.logger.registerService('UserFacadeService');
    
    // Initialize user state from authentication service
    this.initializeUserState();
    
    // Subscribe to auth state changes
    this.authService.authStateChanged$.subscribe(isAuthenticated => {
      if (isAuthenticated) {
        this.refreshUserState();
      } else {
        this.clearUserState();
      }
    });
  }

  // Initialize user state from current auth state
  private initializeUserState(): void {
    if (this.authService.isLoggedIn()) {
      this.refreshUserState();
    } else {
      this.clearUserState();
    }
  }

  // Update user state when authentication changes
  private refreshUserState(): void {
    this.authService.getCurrentUser().subscribe({
      next: (user) => {
        if (user) {
          const userState: UserState = {
            id: user.id,
            username: user.username || user.email || 'User',
            email: user.email,
            isAdmin: user.isAdmin || user.roles?.includes('admin') || false,
            roles: user.roles || [],
            preferences: user.preferences || {},
            isAuthenticated: true
          };
          
          this.userStateSubject.next(userState);
          this.logger.debug('User state updated', { username: userState.username });
        }
      },
      error: (error) => {
        this.logger.error('Error refreshing user state', { error });
        this.clearUserState();
      }
    });
  }

  // Clear user state on logout
  private clearUserState(): void {
    this.userStateSubject.next(null);
    this.logger.debug('User state cleared');
  }

  // Get current user state
  getUserState(): Observable<UserState | null> {
    return this.userState$;
  }

  // Authenticate user
  login(credentials: { username: string; password: string }): Observable<UserState | null> {
    return this.authService.login(credentials).pipe(
      tap(() => this.notification.showSuccess('Login successful')),
      map(() => this.userStateSubject.getValue()),
      catchError(error => {
        this.notification.showError('Login failed: ' + error.message);
        this.logger.error('Login error', { error });
        return of(null);
      })
    );
  }

  // Log out user
  logout(): Observable<boolean> {
    return this.authService.logout().pipe(
      tap(() => {
        this.notification.showSuccess('Logout successful');
        this.router.navigate(['/']);
      }),
      map(() => true),
      catchError(error => {
        this.notification.showError('Logout failed: ' + error.message);
        this.logger.error('Logout error', { error });
        return of(false);
      })
    );
  }

  // Check if user has specified permission
  hasPermission(permission: Permission): Observable<boolean> {
    return this.authzService.hasPermission(permission);
  }

  // Check if user has multiple permissions (all are required)
  hasPermissions(permissions: Permission[]): Observable<boolean> {
    return this.authzService.hasPermissions(permissions);
  }

  // Check if user has admin role
  isAdmin(): boolean {
    const state = this.userStateSubject.getValue();
    return state?.isAdmin || false;
  }

  // Set security level
  setSecurityLevel(level: SecurityLevel): void {
    this.authzService.setSecurityLevel(level);
    this.notification.showInfo(`Security level set to ${level}`);
  }

  // Get current security level
  getSecurityLevel(): SecurityLevel {
    return this.authzService.getSecurityLevel();
  }

  // Update user preferences
  updatePreferences(preferences: any): Observable<boolean> {
    const currentState = this.userStateSubject.getValue();
    if (!currentState) {
      return of(false);
    }

    // Update local state
    const updatedState = {
      ...currentState,
      preferences: {
        ...currentState.preferences,
        ...preferences
      }
    };
    
    this.userStateSubject.next(updatedState);

    // In a real app, you would persist this to the server
    // return this.http.post('/api/user/preferences', preferences).pipe(
    //   map(() => true),
    //   catchError(() => of(false))
    // );
    
    return of(true);
  }
}
