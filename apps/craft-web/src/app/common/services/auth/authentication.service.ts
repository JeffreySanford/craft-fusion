import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { Router } from '@angular/router';
import { User } from '../session.service';
import { LoggerService } from '../logger.service';

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
    private http: HttpClient,
    private router: Router,
    private logger: LoggerService
  ) {
    this.logger.registerService('AuthenticationService');
    this.initializeAuthentication();
  }

  private initializeAuthentication(): void {
    const token = this.getAuthToken();
    if (token) {
      // Validate token and retrieve user information
      this.http.get<User>('/api/auth/user').pipe(
        tap(user => {
          this.currentUserSubject.next(user);
          this.isLoggedInSubject.next(true);
          this.isAuthenticatedSubject.next(true);
          this.isAdminSubject.next(user.role === 'admin');
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
    
    return this.http.post<{ token: string, user: User }>('/api/auth/login', { username, password }).pipe(
      tap(response => {
        this.setAuthToken(response.token);
        this.currentUserSubject.next(response.user);
        this.isLoggedInSubject.next(true);
        this.isAuthenticatedSubject.next(true);
        this.isAdminSubject.next(response.user.role === 'admin');
        this.logger.info('User logged in successfully', { username });
      }),
      catchError(error => {
        this.logger.error('Login failed', { error, username });
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
    this.router.navigate(['/login']);
  }

  getAuthToken(): string | null {
    return localStorage.getItem(this.TOKEN_KEY);
  }

  private setAuthToken(token: string): void {
    localStorage.setItem(this.TOKEN_KEY, token);
  }

  private clearAuthToken(): void {
    localStorage.removeItem(this.TOKEN_KEY);
  }
}
