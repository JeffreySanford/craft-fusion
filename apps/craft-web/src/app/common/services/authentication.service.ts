import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, of, throwError } from 'rxjs';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Router } from '@angular/router';
import { catchError, map, tap, timeout } from 'rxjs/operators';
import { SessionService } from './session.service';
import { LoggerService } from './logger.service';
import { NotificationService } from './notification.service';
import { User } from './user.interface'; // Import from user.interface instead

@Injectable({
  providedIn: 'root'
})
export class AuthenticationService {
  private readonly TOKEN_KEY = 'auth_token';
  private currentUserSubject: BehaviorSubject<User> = new BehaviorSubject<User>({
    id: 0,
    username: '',
    name: '',
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    roles: [] // Use roles array instead of singular role
  });

  private isLoggedInSubject: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false);
  private isAdminSubject: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false);

  public currentUser$ = this.currentUserSubject.asObservable();
  public isLoggedIn$ = this.isLoggedInSubject.asObservable();
  public isAdmin$ = this.isAdminSubject.asObservable();

  constructor(
    private http: HttpClient,
    private router: Router,
    private sessionService: SessionService,
    private logger: LoggerService,
    private notificationService: NotificationService
  ) {
    this.initializeAuthentication();
  }

  public get isAuthenticated(): boolean {
    return this.isLoggedInSubject.value;
  }

  /**
   * Helper method to determine if a user has admin role based on roles array
   * @param user User object to check
   * @returns boolean indicating if user has admin role
   */
  private hasAdminRole(user: User): boolean {
    return Array.isArray(user.roles) && user.roles.includes('admin');
  }

  public login(username: string, password: string): Observable<any> {
    // Clear any existing token before attempting login
    this.clearAuthToken();

    // Development mode fallback for testing
    if (username === 'test' && password === 'test') {
      this.logger.debug('Using development mode login');
      const mockUser: User = { 
        id: 1, 
        username: 'test', 
        name: 'Test User', 
        firstName: 'Test',
        lastName: 'User',
        email: 'test@example.com',
        roles: ['admin'], // Use roles array instead of singular role
        password: 'test', // Add password to match SessionService's User interface
      };
      this.setAuthToken('mock-token-for-development-only');
      this.currentUserSubject.next(mockUser);
      this.isLoggedInSubject.next(true);
      this.isAdminSubject.next(this.hasAdminRole(mockUser));
      this.sessionService.setUserSession(mockUser);
      return of({ success: true, user: mockUser });
    }

    return this.http.post('/api/auth/login', { username, password })
      .pipe(
        timeout(10000), // 10 second timeout
        tap((response: any) => {
          if (response && response.token) {
            this.setAuthToken(response.token);
            this.currentUserSubject.next(response.user);
            this.isLoggedInSubject.next(true);
            // Use the user's roles to determine admin status instead of a property
            this.isAdminSubject.next(this.hasAdminRole(response.user));
            this.sessionService.setUserSession(response.user);
            this.logger.info('User logged in successfully', { username });
          }
        }),
        catchError(this.handleError)
      );
  }

  public logout(): void {
    this.logger.info('User logging out');
    this.clearAuthToken();
    this.currentUserSubject.next({ 
      id: 0, 
      username: '', 
      name: '',
      firstName: '',
      lastName: '',
      email: '',
      roles: [], // Use roles array instead of singular role
      password: ''
    });
    this.isLoggedInSubject.next(false);
    this.isAdminSubject.next(false);
    this.sessionService.clearUserSession();
    this.router.navigate(['/login']);
  }

  private initializeAuthentication(): void {
    // Check if token exists
    const token = this.getAuthToken();
    
    if (token) {
      // For security, we're clearing the existing token during initialization
      // In a production system, you'd validate this token with the server first
      this.clearAuthToken();
      
      // If you want to retain login between page refreshes, 
      // you'd validate the token instead of clearing it:
      /*
      this.sessionService.validateToken(token).subscribe(
        isValid => {
          if (isValid) {
            this.http.get('/api/auth/user').subscribe(
              (user: any) => {
                this.currentUserSubject.next(user);
                this.isLoggedInSubject.next(true);
                // Set admin status based on roles instead of property
                this.isAdminSubject.next(this.hasAdminRole(user));
              },
              error => this.logout()
            );
          } else {
            this.logout();
          }
        }
      );
      */
    }
  }

  private setAuthToken(token: string): void {
    localStorage.setItem(this.TOKEN_KEY, token);
  }

  public getAuthToken(): string | null {
    return localStorage.getItem(this.TOKEN_KEY);
  }

  private clearAuthToken(): void {
    localStorage.removeItem(this.TOKEN_KEY);
  }

  private handleError(error: HttpErrorResponse): Observable<never> {
    let errorMessage = 'An unknown error occurred';
    
    if (error.error instanceof ErrorEvent) {
      // Client-side error
      errorMessage = `Error: ${error.error.message}`;
    } else {
      // Server-side error
      errorMessage = `Error Code: ${error.status}\nMessage: ${error.message}`;
    }
    
    this.logger.error('Authentication error', { error: errorMessage });
    return throwError(() => new Error(errorMessage));
  }
}
