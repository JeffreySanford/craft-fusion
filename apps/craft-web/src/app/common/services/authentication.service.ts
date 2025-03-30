import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { BehaviorSubject, Observable, of, throwError, timer } from 'rxjs';
import { tap, catchError, map, switchMap, filter } from 'rxjs/operators';
import { LoggerService } from './logger.service';
import { JwtHelperService } from '@auth0/angular-jwt';
import { JwtSecurityUtil } from '../utils/jwt-security.util';
import { AuthUser, AuthToken, LoginCredentials, TokenPayload } from '../models/auth.model';

// Mock JWT token (in production, this would be created on the server)
const MOCK_JWT = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJhZG1pbi0xMjMiLCJuYW1lIjoiYWRtaW4iLCJlbWFpbCI6ImFkbWluQGV4YW1wbGUuY29tIiwicm9sZXMiOlsiYWRtaW4iLCJ1c2VyIl0sImlhdCI6MTUxNjIzOTAyMiwidiI6MX0.fake-signature';

// Mock refresh token
const MOCK_REFRESH_TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJhZG1pbi0xMjMiLCJ0eXBlIjoicmVmcmVzaCIsImlhdCI6MTUxNjIzOTAyMn0.fake-refresh-signature';

@Injectable({
  providedIn: 'root'
})
export class AuthenticationService {
  private currentUserSubject = new BehaviorSubject<AuthUser | null>(null);
  private isLoggedInSubject = new BehaviorSubject<boolean>(false);
  private isAdminSubject = new BehaviorSubject<boolean>(false);
  private jwtHelper = new JwtHelperService();
  
  // Observable for components to subscribe to
  authStateChanged$ = new BehaviorSubject<boolean>(false);
  isAdmin$ = this.isAdminSubject.asObservable();
  currentUser$ = this.currentUserSubject.asObservable().pipe(
    filter(user => user !== undefined)
  );

  // Token refresh timer
  private tokenRefreshTimer: any;
  
  // CSRF token for secure API calls
  private csrfToken: string | null = null;
  
  constructor(
    private http: HttpClient,
    private logger: LoggerService
  ) {
    this.logger.registerService('AuthenticationService');
    
    // Check if user is already logged in from stored token
    this.checkInitialAuthState();
    
    // Generate and store CSRF token
    this.initializeCsrf();
    
    // Store browser fingerprint
    JwtSecurityUtil.storeFingerprint();
  }

  private checkInitialAuthState(): void {
    // Get encrypted token from storage
    const token = JwtSecurityUtil.retrieveToken('access');
    
    if (token) {
      try {
        // Verify token isn't expired
        if (this.jwtHelper.isTokenExpired(token)) {
          this.logger.warn('Token expired, attempting refresh');
          this.refreshToken().subscribe({
            error: (err) => {
              this.logger.error('Failed to refresh token, logging out', { error: err });
              this.logout().subscribe();
            }
          });
          return;
        }

        // Verify browser fingerprint to detect possible session theft
        if (!JwtSecurityUtil.verifyFingerprint()) {
          this.logger.warn('Security alert: Browser fingerprint mismatch');
          this.logout().subscribe();
          return;
        }

        // Extract user data from token
        this.processToken(token);
      } catch (e) {
        this.logger.error('Failed to parse stored token', { error: e });
        this.logout().subscribe();
      }
    }
  }

  private processToken(token: string): void {
    try {
      const decodedToken = this.jwtHelper.decodeToken(token) as TokenPayload;
      
      // Version check - require minimum token version (useful for forcing re-login after security updates)
      const tokenVersion = decodedToken.v || 0;
      const requiredVersion = 1; // Minimum required token version
      
      if (tokenVersion < requiredVersion) {
        this.logger.warn('Token version too old, forcing re-login');
        this.logout().subscribe();
        return;
      }
      
      const user: AuthUser = {
        id: decodedToken.sub,
        username: decodedToken.name || decodedToken.email || 'User',
        email: decodedToken.email,
        roles: decodedToken.roles || [],
        isAdmin: decodedToken.roles?.includes('admin') || false
      };
      
      this.currentUserSubject.next(user);
      this.isLoggedInSubject.next(true);
      this.isAdminSubject.next(user.isAdmin);
      this.authStateChanged$.next(true);
      
      // Set up token refresh
      this.setupTokenRefresh(token);
    } catch (error) {
      this.logger.error('Failed to process token', { error });
      this.logout().subscribe();
    }
  }

  login(credentials: LoginCredentials): Observable<AuthUser> {
    this.logger.info('Attempting login', { username: credentials.username });
    
    // For demo purposes, simulate a successful login with admin rights
    if (credentials.username === 'admin') {
      // Simulate receiving tokens from server
      const authToken: AuthToken = {
        accessToken: MOCK_JWT,
        refreshToken: MOCK_REFRESH_TOKEN,
        tokenType: 'Bearer',
        expiresIn: 3600,
        issuedAt: Math.floor(Date.now() / 1000)
      };
      
      return this.processAuthTokenResponse(authToken);
    } else {
      return throwError(() => new Error('Invalid credentials'));
    }
    
    // In a real app, you'd make an HTTP request to your auth endpoint
    // return this.http.post<AuthToken>('/api/auth/login', credentials)
    //   .pipe(
    //     switchMap(authToken => this.processAuthTokenResponse(authToken)),
    //     catchError(error => {
    //       this.logger.error('Login failed', { error });
    //       return throwError(() => error);
    //     })
    //   );
  }

  logout(): Observable<any> {
    this.logger.info('Logging out user');
    
    // Clear token refresh timer
    if (this.tokenRefreshTimer) {
      clearTimeout(this.tokenRefreshTimer);
    }

    // Clear all tokens
    JwtSecurityUtil.clearAllTokens();
    
    // Update subjects
    this.currentUserSubject.next(null);
    this.isLoggedInSubject.next(false);
    this.isAdminSubject.next(false);
    
    // Emit auth state changed
    this.authStateChanged$.next(false);
    
    // Generate new CSRF token
    this.initializeCsrf();
    
    // In a real app, notify the server about logout
    // return this.http.post<any>('/api/auth/logout', {})
    //   .pipe(
    //     catchError(error => {
    //       this.logger.error('Server logout failed', { error });
    //       return of(null); // Still proceed with local logout
    //     }),
    //     map(() => ({ success: true }))
    //   );
    
    return of({ success: true });
  }

  refreshToken(): Observable<AuthUser> {
    this.logger.debug('Refreshing auth token');
    
    const refreshToken = JwtSecurityUtil.retrieveToken('refresh');
    
    if (!refreshToken) {
      return throwError(() => new Error('No refresh token available'));
    }
    
    // For demo purposes, just create a new mock token
    const authToken: AuthToken = {
      accessToken: MOCK_JWT,
      refreshToken: MOCK_REFRESH_TOKEN,
      tokenType: 'Bearer',
      expiresIn: 3600,
      issuedAt: Math.floor(Date.now() / 1000)
    };
    
    return this.processAuthTokenResponse(authToken);
    
    // In a real app:
    // const headers = new HttpHeaders().set('X-CSRF-TOKEN', this.getCSRFToken() || '');
    // 
    // return this.http.post<AuthToken>('/api/auth/refresh', { refreshToken }, { headers })
    //   .pipe(
    //     switchMap(authToken => this.processAuthTokenResponse(authToken)),
    //     catchError(error => {
    //       this.logger.error('Token refresh failed', { error });
    //       // If refresh fails, log the user out
    //       this.logout().subscribe();
    //       return throwError(() => error);
    //     })
    //   );
  }

  private processAuthTokenResponse(authToken: AuthToken): Observable<AuthUser> {
    // Store tokens securely
    JwtSecurityUtil.storeToken(authToken.accessToken, 'access');
    
    if (authToken.refreshToken) {
      JwtSecurityUtil.storeToken(authToken.refreshToken, 'refresh');
    }
    
    // Process the access token
    this.processToken(authToken.accessToken);
    
    // Store browser fingerprint
    JwtSecurityUtil.storeFingerprint();
    
    return this.currentUserSubject.pipe(
      filter(user => user !== null),
      map(user => user as AuthUser)
    );
  }

  private setupTokenRefresh(token: string): void {
    // Clear any existing timer
    if (this.tokenRefreshTimer) {
      clearTimeout(this.tokenRefreshTimer);
    }
    
    try {
      // Get token expiration
      const expiryDate = this.jwtHelper.getTokenExpirationDate(token);
      if (!expiryDate) return;
      
      // Calculate time until token is 80% of the way to expiry
      const nowTime = new Date().getTime();
      const expiryTime = expiryDate.getTime();
      const timeUntilExpiry = expiryTime - nowTime;
      const refreshTime = timeUntilExpiry * 0.8;
      
      this.logger.debug('Token refresh scheduled', { 
        expiryDate, 
        refreshIn: Math.round(refreshTime / 1000) + ' seconds' 
      });
      
      // Set timer to refresh token
      this.tokenRefreshTimer = setTimeout(() => {
        this.refreshToken().subscribe();
      }, refreshTime);
    } catch (e) {
      this.logger.error('Error setting up token refresh', { error: e });
    }
  }
  
  private initializeCsrf(): void {
    this.csrfToken = JwtSecurityUtil.generateCsrfToken();
    JwtSecurityUtil.storeCsrfToken(this.csrfToken);
  }
  
  getCSRFToken(): string | null {
    return this.csrfToken || JwtSecurityUtil.getCsrfToken();
  }

  isLoggedIn(): boolean {
    return this.isLoggedInSubject.getValue();
  }

  getCurrentUser(): Observable<AuthUser | null> {
    return this.currentUserSubject.asObservable();
  }
  
  getAccessToken(): string | null {
    return JwtSecurityUtil.retrieveToken('access');
  }
  
  hasRole(role: string): boolean {
    const user = this.currentUserSubject.getValue();
    return user?.roles?.includes(role) || false;
  }

  hasAnyRole(roles: string[]): boolean {
    const user = this.currentUserSubject.getValue();
    if (!user || !user.roles) return false;
    return roles.some(role => user.roles.includes(role));
  }
}
