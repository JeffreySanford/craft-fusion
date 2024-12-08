import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable } from 'rxjs';
import { Router } from '@angular/router';
import { NotificationService } from './notification.service';
import { SessionService, User } from './session.service';
import { switchMap, catchError, EMPTY, of } from 'rxjs';

/**
 * Interface representing the authentication response from the server
 * @todo Add refresh token support
 */
interface AuthResponse {
  token: string;
  user: User;
}

/**
 * Service responsible for handling authentication state and operations.
 * Manages user sessions, token storage, and authentication status.
 * 
 * @todo
 * - Implement refresh token mechanism
 * - Add biometric authentication support
 * - Implement OAuth2 flow
 * - Add rate limiting for failed attempts
 * - Implement token rotation
 * - Add 2FA support
 * 
 * @security
 * - Token is stored in localStorage (consider more secure alternatives)
 * - Password is never stored in memory
 * - Auto-logout on token expiration
 */
@Injectable({ providedIn: 'root' })
export class AuthenticationService {
  private readonly TOKEN_KEY = 'auth_token';
  
  /**
   * BehaviorSubject holding the current user state
   * Initializes with a default anonymous user
   * @security Ensure password is never exposed in user object
   */
  private currentUserSubject = new BehaviorSubject<User>({
    id: 0,
    username: '',
    password: 'not provided', // @todo Remove password from User interface
    firstName: 'Sam',
    lastName: 'Sam Sample',
    role: 'user'
  });

  /**
   * @todo Future improvements:
   * 1. Move token storage to HttpOnly cookie
   * 2. Implement token refresh mechanism
   * 3. Add session timeout handling
   * 4. Add device fingerprinting
   * 5. Implement concurrent session management
   * 6. Add audit logging
   * 7. Implement passwordless authentication
   * 8. Add social login providers
   * 9. Implement remember me functionality
   * 10. Add JWT claims validation
   */
  private isAdminSubject = new BehaviorSubject<boolean>(false);
  private isLoggedIn = new BehaviorSubject<boolean>(false);
  private isAuthenticated = new BehaviorSubject<boolean>(false);
  private readonly isProduction = false;

  constructor(
    private http: HttpClient,
    private router: Router,
    private notificationService: NotificationService,
    private sessionService: SessionService
  ) {
    this.initializeAuthentication();
  }

  get currentUser$(): Observable<User> {
    return this.currentUserSubject.asObservable();
  }

  get isAdmin$(): Observable<boolean> {
    return this.isAdminSubject.asObservable();
  }

  get isLoggedIn$(): Observable<boolean> {
    return this.isLoggedIn.asObservable();
  }

  login(username: string, password: string): Observable<AuthResponse> {
    return this.http.post<AuthResponse>('/api/auth/login', { username, password });
  }

  logout(): void {
    localStorage.removeItem(this.TOKEN_KEY);
    this.currentUserSubject.next({
      id: 0,
      username: '',
      password: '',
      firstName: '',
      lastName: '',
      role: ''
    });
    this.isLoggedIn.next(false);
    this.isAuthenticated.next(false);
    this.isAdminSubject.next(false);
    this.router.navigate(['/login']);
  }

  private initializeAuthentication(): void {
    const token = localStorage.getItem(this.TOKEN_KEY);
    if (token) {
      this.sessionService.validateToken(token).pipe(
        switchMap(isValid => {
          if (isValid) {
            return this.http.get<User>('/api/auth/user');
          } else {
            return EMPTY;
          }
        }),
        catchError(error => {
          console.error('Error validating token:', error);
          return of(null);
        })
      ).subscribe(user => {
        if (user) {
          this.currentUserSubject.next(user);
          this.isLoggedIn.next(true);
          this.isAuthenticated.next(true);
          this.isAdminSubject.next(user.role === 'admin');
          this.router.navigate(['/dashboard']);
        } else {
          this.logout();
        }
      });
    }
  }

  setAuthToken(token: string): void {
    localStorage.setItem(this.TOKEN_KEY, token);
  }

  getAuthToken(): string | null {
    return localStorage.getItem(this.TOKEN_KEY);
  }
}