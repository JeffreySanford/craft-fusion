import { Injectable } from '@angular/core';
import { Observable, BehaviorSubject, of } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { OAuthService } from './oauth.service';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private isAuthenticatedSubject = new BehaviorSubject<boolean>(false);
  private tokenKey = 'auth_token';
  private userKey = 'user_data';
  private refreshTokenKey = 'refresh_token';

  constructor(
    private http: HttpClient,
    private router: Router,
    private oauthService: OAuthService
  ) {
    // Check if token exists in local storage when service starts
    const token = this.getToken();
    if (token) {
      // Verify token validity
      this.verifyToken(token).subscribe(isValid => {
        this.isAuthenticatedSubject.next(isValid);
      });
    }
  }

  // Authentication status as an observable
  get isAuthenticated$(): Observable<boolean> {
    return this.isAuthenticatedSubject.asObservable();
  }

  // Current authentication status
  get isAuthenticated(): boolean {
    return this.isAuthenticatedSubject.value;
  }

  /**
   * Login user
   */
  login(credentials: { username: string; password: string }): Observable<any> {
    // Replace with actual API endpoint
    return this.http.post<any>('/api/auth/login', credentials).pipe(
      tap(response => {
        if (response && response.token) {
          localStorage.setItem(this.tokenKey, response.token);
          
          // Store user data if available
          if (response.user) {
            localStorage.setItem(this.userKey, JSON.stringify(response.user));
          }
          
          this.isAuthenticatedSubject.next(true);
        }
      })
    );
  }

  /**
   * Logout user
   */
  logout(): void {
    localStorage.removeItem(this.tokenKey);
    localStorage.removeItem(this.userKey);
    localStorage.removeItem(this.refreshTokenKey);
    this.isAuthenticatedSubject.next(false);
    this.router.navigate(['/login']);
  }

  /**
   * Get the current auth token
   */
  getToken(): string | null {
    return localStorage.getItem(this.tokenKey);
  }

  /**
   * Get the current user data
   */
  getUserData(): any {
    const userData = localStorage.getItem(this.userKey);
    return userData ? JSON.parse(userData) : null;
  }

  /**
   * Verify if a token is still valid
   */
  private verifyToken(token: string): Observable<boolean> {
    // In a real app, make an API call to verify the token
    // For simplicity in this example, we'll just check if it exists
    return of(!!token);
  }

  /**
   * Get the URL for OAuth authentication
   * @param useGo Whether to use Go server
   */
  getOAuthUrl(useGo: boolean = false): string {
    return this.oauthService.getAuthorizeUrl(useGo);
  }

  /**
   * Login user via OAuth
   * @param code Authorization code from OAuth callback
   * @param useGo Whether to use Go server
   */
  loginWithOAuth(code: string, useGo: boolean = false): Observable<any> {
    return this.oauthService.getAccessToken(code, useGo).pipe(
      tap(response => {
        if (response && response.access_token) {
          localStorage.setItem(this.tokenKey, response.access_token);
          
          if (response.refresh_token) {
            localStorage.setItem(this.refreshTokenKey, response.refresh_token);
          }
          
          this.isAuthenticatedSubject.next(true);
        }
      })
    );
  }

  /**
   * Refresh the current token
   */
  refreshToken(): Observable<any> {
    const refreshToken = localStorage.getItem(this.refreshTokenKey);
    
    if (!refreshToken) {
      return of(null);
    }

    return this.oauthService.refreshToken(refreshToken).pipe(
      tap(response => {
        if (response && response.access_token) {
          localStorage.setItem(this.tokenKey, response.access_token);
          
          if (response.refresh_token) {
            localStorage.setItem(this.refreshTokenKey, response.refresh_token);
          }
        }
      }),
      catchError(error => {
        // If refresh fails, log the user out
        this.logout();
        return of(null);
      })
    );
  }
}
