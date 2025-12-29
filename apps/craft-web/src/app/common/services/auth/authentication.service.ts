import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { Router } from '@angular/router';
import { User } from '../user.interface';
import { LoggerService } from '../logger.service';
import { AdminStateService } from '../admin-state.service';
import { ApiService } from '../api.service';

@Injectable({
  providedIn: 'root'
})
export class AuthenticationService {
  private currentUserSubject = new BehaviorSubject<User | null>(null);
  private isLoggedInSubject = new BehaviorSubject<boolean>(false);
  private isAuthenticatedSubject = new BehaviorSubject<boolean>(false);
  private isAdminSubject = new BehaviorSubject<boolean>(false);
  
  readonly currentUser$ = this.currentUserSubject.asObservable();
  readonly isLoggedIn$ = this.isLoggedInSubject.asObservable();
  readonly isAuthenticated$ = this.isAuthenticatedSubject.asObservable();
  readonly isAdmin$ = this.isAdminSubject.asObservable();

  private readonly TOKEN_KEY = 'auth_token';

  constructor(
    private apiService: ApiService,
    private http: HttpClient,
    private router: Router,
    private logger: LoggerService,
    private adminStateService: AdminStateService
  ) {
    this.logger.registerService('AuthenticationService');
    this.initializeAuthentication();
  }

  private initializeAuthentication(): void {
    const token = this.getAuthToken();
    if (token) {
      // Use ApiService for user info
      this.apiService.get<User>('auth/user').pipe(
        tap(user => {
          this.currentUserSubject.next(user);
          this.isLoggedInSubject.next(true);
          this.isAuthenticatedSubject.next(true);
          const isAdmin = user.roles.includes('admin');
          this.isAdminSubject.next(isAdmin);
          this.adminStateService.setAdminStatus(isAdmin);
          this.setAuthToken(token);
          this.logger.info('User authenticated on init', { username: user.username });
        }),
        catchError(error => {
          this.logger.warn('Token validation failed', { error });
          this.logout();
          return of(null);
        })
      ).subscribe();
    }
  }

  login(username: string, password: string): Observable<any> {
    this.logger.info('Login attempt', { username });
    // Use ApiService for login
    return this.apiService.authRequest<{ token: string, user: User }>('POST', 'auth/login', { username, password }).pipe(
      tap(response => {
        this.logger.debug('Login response received', {
          status: 'success',
          tokenLength: response.token.length,
          user: response.user.username,
          roles: response.user.roles
        });
        this.setAuthToken(response.token);
        this.currentUserSubject.next(response.user);
        this.isLoggedInSubject.next(true);
        this.isAuthenticatedSubject.next(true);
        const isAdmin = Array.isArray(response.user.roles) && response.user.roles.includes('admin');
        this.logger.debug('Admin role check', { isAdmin, roles: response.user.roles });
        this.isAdminSubject.next(isAdmin);
        this.adminStateService.setAdminStatus(isAdmin);
        this.logger.debug('Admin state updated', {
          isAdmin,
          adminStateValue: this.adminStateService.getAdminStatus()
        });
        this.logger.info('User logged in successfully', { username, isAdmin });
      }),
      catchError(error => {
        this.logger.error('Login failed', {
          error,
          username,
          status: error.status,
          message: error.message || 'Unknown error'
        });
        throw error;
      })
    );
  }

  logout(): void {
    this.logger.info('Logging out user');
    this.clearAuthToken();
    this.currentUserSubject.next(null);
    this.isLoggedInSubject.next(false);
    this.isAuthenticatedSubject.next(false);
    this.isAdminSubject.next(false);
    this.adminStateService.setAdminStatus(false); // Update AdminStateService on logout
    this.router.navigate(['/login']);
  }

  //TODO: Implement token validation logic
  validateToken(token: string): Observable<boolean> {
    return this.isAuthenticated$.pipe(
      tap(isAuthenticated => {
        if (isAuthenticated) {
          this.logger.info('Token is valid', { token });
        } else {
          this.logger.warn('Token is invalid', { token });
        }
      })
    );
  }
  public getAuthToken(): string | null {
    return localStorage.getItem(this.TOKEN_KEY);
  }

  private setAuthToken(token: string): void {
    localStorage.setItem(this.TOKEN_KEY, token);
  }

  private clearAuthToken(): void {
    localStorage.removeItem(this.TOKEN_KEY);
  }
}
