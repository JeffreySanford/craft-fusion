import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { Router } from '@angular/router';
import { User } from '../user.interface';
// import { LoggerService } from './logger.service';
import { AdminStateService } from '../admin-state.service';
import { ApiService } from '../api.service';

@Injectable()
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
    private adminStateService: AdminStateService
  ) {
    // this.logger.registerService('AuthenticationService');
    this.initializeAuthentication();
  }

  private initializeAuthentication(): void {
    const token = this.getAuthToken();
    if (token) {
      // For security, clear token on refresh to require re-login
      this.clearAuthToken();
      // Don't authenticate user on refresh
    }
  }

  login(username: string, password: string): Observable<any> {
    // Use ApiService for login
    return this.apiService.authRequest<{ token: string, user: User }>('POST', 'auth/login', { username, password }).pipe(
      tap(response => {
        this.setAuthToken(response.token);
        this.currentUserSubject.next(response.user);
        this.isLoggedInSubject.next(true);
        this.isAuthenticatedSubject.next(true);
        const isAdmin = Array.isArray(response.user.roles) && response.user.roles.includes('admin');
        this.isAdminSubject.next(isAdmin);
        this.adminStateService.setAdminStatus(isAdmin);
      }),
      catchError(error => {
        throw error;
      })
    );
  }

  logout(): void {
    this.clearAuthToken();

    // Ensure persisted admin flag is removed from localStorage
    try {
      localStorage.removeItem('isAdmin');
    } catch (e) {
      // Failed to remove isAdmin
    }

    this.currentUserSubject.next(null);
    this.isLoggedInSubject.next(false);
    this.isAuthenticatedSubject.next(false);
    this.isAdminSubject.next(false);
    this.adminStateService.setAdminStatus(false); // Update AdminStateService on logout
    // Redirect to home - login page is not available in SPA routes
    try { this.router.navigate(['/home']); } catch (e) {  }
  }

  //TODO: Implement token validation logic
  validateToken(token: string): Observable<boolean> {
    return this.isAuthenticated$;
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
