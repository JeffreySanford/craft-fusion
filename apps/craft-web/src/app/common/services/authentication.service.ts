import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, of, throwError, timer, Subject } from 'rxjs';
import { catchError, map, tap, timeout, delay, concatMap, switchMap, takeUntil, shareReplay, filter } from 'rxjs/operators';
import { SessionService } from './session.service';
import { LoggerService } from './logger.service';
import { NotificationService } from './notification.service';
import { ApiService } from './api.service';
import { User } from '../interfaces/user.interface';
import { environment } from '../../../environments/environment';

// Auth-related interfaces
export interface AuthResponse {
  success: boolean;
  token: string;
  refreshToken?: string;
  user: User;
  expiresIn?: number; // Token expiration time in seconds
  message?: string;
}

export interface LoginRequest {
  username: string;
  password: string;
}

export interface RefreshTokenRequest {
  refreshToken: string;
}

export interface TokenInfo {
  token: string;
  refreshToken?: string; 
  expiresAt?: number; // Expiration timestamp
}

export interface AuthState {
  user: User | null;
  isLoggedIn: boolean;
  isAdmin: boolean;
  isOffline: boolean;
  lastSyncTime?: Date;
}

@Injectable({
  providedIn: 'root'
})
export class AuthenticationService {
  // CONSTANTS
  private readonly TOKEN_KEY = 'auth_token';
  private readonly REFRESH_TOKEN_KEY = 'auth_refresh_token';
  private readonly TOKEN_EXPIRES_KEY = 'auth_token_expires';
  private readonly AUTH_TIMEOUT = 15000; // 15 seconds timeout for auth requests
  private readonly TOKEN_REFRESH_THRESHOLD = 300; // Refresh token 5 minutes before expiry
  private readonly MAX_RETRIES = 3; // Maximum number of retries for connection issues
  
  // WebSocket connection for real-time auth updates
  private socket: WebSocket | null = null;
  private socketDestroy$ = new Subject<void>();
  
  // SUBJECTS FOR REACTIVE STATE
  private authState = new BehaviorSubject<AuthState>({
    user: {
      id: 0,
      username: '',
      name: '',
      firstName: '',
      lastName: '',
      email: '',
      password: '',
      roles: [],
      role: '' // Add the required role property
    },
    isLoggedIn: false,
    isAdmin: false,
    isOffline: false
  });
  
  // Public observables derived from auth state
  public readonly authState$ = this.authState.asObservable();
  public readonly currentUser$ = this.authState$.pipe(
    map(state => state.user),
    shareReplay(1)
  );
  public readonly isLoggedIn$ = this.authState$.pipe(
    map(state => state.isLoggedIn),
    shareReplay(1)
  );
  public readonly isAdmin$ = this.authState$.pipe(
    map(state => state.isAdmin),
    shareReplay(1)
  );
  
  // Network state
  private _isOfflineMode = false;
  private connectionRetryCount = 0;
  private tokenRefreshInProgress = false;
  private refreshTokenTimeout: any;

  constructor(
    private apiService: ApiService,
    private http: HttpClient,
    private router: Router,
    private sessionService: SessionService,
    private logger: LoggerService,
    private notificationService: NotificationService
  ) {
    this.logger.registerService('AuthService');
    this.logger.info('Authentication Service initialized');
    this.initializeAuthentication();
  }

  /**
   * Returns current authentication state
   */
  public get isAuthenticated(): boolean {
    return this.authState.value.isLoggedIn;
  }

  /**
   * Helper method to determine if a user has admin role based on roles array
   */
  private hasAdminRole(user: User | null): boolean {
    if (!user) return false;
    return Array.isArray(user.roles) && user.roles.includes('admin');
  }

  /**
   * Returns the current user data
   */
  public get currentUser(): User | null {
    return this.authState.value.user;
  }

  /**
   * Check if the app is currently in offline mode
   */
  public get isOffline(): boolean {
    return this._isOfflineMode;
  }

  /**
   * Initialize authentication state from stored token
   */
  public initializeAuthentication(): void {
    this.logger.debug('Initializing authentication process');
    
    // Check for existing auth token
    const tokenInfo = this.getStoredTokenInfo();
    
    if (tokenInfo && tokenInfo.token) {
      this.logger.debug('Found existing auth token, validating token integrity', {
        tokenLength: tokenInfo.token.length,
        tokenPrefix: tokenInfo.token.substring(0, 10) + '...',
        expiresIn: tokenInfo.expiresAt ? Math.floor((tokenInfo.expiresAt - Date.now()) / 1000) + 's' : 'unknown'
      });
      
      // Check if token is expired
      if (tokenInfo.expiresAt && Date.now() >= tokenInfo.expiresAt) {
        this.logger.debug('Token is expired, attempting to refresh');
        this.refreshToken().subscribe({
          error: () => {
            this.logger.warn('Failed to refresh expired token, clearing auth state');
            this.clearAuthState();
            this.router.navigate(['/login']);
          }
        });
        return;
      }
      
      // Schedule token refresh before expiration
      this.scheduleTokenRefresh(tokenInfo.expiresAt);
      
      // Attempt to validate token
      this.sessionService.validateToken(tokenInfo.token).pipe(
        catchError((error) => {
          this.logger.warn('Token validation failed, clearing session', { 
            error: error.message || 'Unknown error',
            errorType: error.constructor.name
          });
          this.clearAuthState();
          return of(false);
        })
      ).subscribe(isValid => {
        this.logger.debug('Token validation completed', { isValid });
        if (isValid) {
          this.logger.info('Token validated successfully, fetching user details');
          this.fetchUserDetails();
        } else {
          this.logger.warn('Token validation returned invalid, clearing authentication');
          this.clearAuthState();
        }
      });
    } else {
      this.logger.debug('No auth token found, user is not authenticated');
    }
  }

  /**
   * Log in a user with username and password
   */
  public login(username: string, password: string): Observable<AuthResponse> {
    // Clear any existing token before attempting login
    this.clearAuthState();
    
    this.logger.info('Login attempt initiated', { 
      username,
      timestamp: new Date().toISOString(),
      isOffline: this._isOfflineMode,
      serverStarting: this.apiService.isServerStarting
    });

    // Check if we appear to be offline based on previous errors
    if (this._isOfflineMode) {
      this.logger.warn('Operating in offline mode, using fallback login mechanism');
      return this.handleOfflineLogin(username, password);
    }

    // Development mode fallback for testing
    if (username === 'test' && password === 'test') {
      this.logger.debug('Using development mode login for test credentials');
      return this.handleDevLogin(username);
    }

    const loginRequest: LoginRequest = { username, password };
    
    this.logger.debug('Making authentication request to server', {
      endpoint: 'auth/login'
    });

    // Use special auth request method with enhanced retry logic
    return this.apiService.authRequest<AuthResponse>('POST', 'auth/login', loginRequest)
      .pipe(
        tap((response: AuthResponse) => {
          if (response && response.token) {
            this._isOfflineMode = false;
            
            this.logger.info('Authentication successful', {
              username: response.user?.username,
              hasRoles: Array.isArray(response.user?.roles),
              tokenReceived: true,
              tokenLength: response.token.length,
              hasRefreshToken: !!response.refreshToken
            });
            
            // Store the token with expiration if provided
            const expiresAt = response.expiresIn 
              ? Date.now() + (response.expiresIn * 1000) 
              : undefined;
              
            this.handleSuccessfulLogin(response, expiresAt);
            
            // Initialize WebSocket connection for real-time auth state updates
            this.initializeAuthSocket();
            
            // Schedule token refresh if expiration is provided
            if (expiresAt) {
              this.scheduleTokenRefresh(expiresAt);
            }
          } else {
            this.logger.warn('Server returned success but no token was provided');
          }
        }),
        catchError((error) => {
          // Check if this is a connection issue
          if (error.status === 0 || error.status === 504) {
            this._isOfflineMode = true;
            this.logger.warn('Network connectivity issue detected during authentication', {
              errorStatus: error.status,
              errorMessage: error.message,
              errorType: error.name,
              timestamp: new Date().toISOString(),
              offlineModeActivated: true
            });
            
            // Show more helpful message
            this.notificationService.showWarning(
              `Server appears to be unavailable. Using offline mode for demonstration.`,
              'Switching to Offline Mode'
            );
            
            // Always allow fallback login during connection issues
            return this.handleOfflineLogin(username, password);
          }
          
          return this.handleLoginError(error, username);
        })
      );
  }

  /**
   * Log out the current user
   */
  public logout(): void {
    const currentUser = this.authState.value.user;
    this.logger.info('User logout initiated', {
      username: currentUser?.username,
      wasAuthenticated: this.authState.value.isLoggedIn,
      timestamp: new Date().toISOString()
    });
    
    // Close WebSocket connection if open
    this.closeAuthSocket();
    
    // Cancel any pending token refresh
    if (this.refreshTokenTimeout) {
      clearTimeout(this.refreshTokenTimeout);
      this.refreshTokenTimeout = null;
    }
    
    // Clear auth state and navigate to login
    this.clearAuthState();
    this.sessionService.clearUserSession();
    this.router.navigate(['/login']);
    
    this.logger.debug('User logout completed, authentication state reset');
  }

  /**
   * Attempt to refresh the authentication token
   */
  public refreshToken(): Observable<AuthResponse> {
    if (this.tokenRefreshInProgress) {
      this.logger.debug('Token refresh already in progress, skipping duplicate request');
      return throwError(() => new Error('Token refresh already in progress'));
    }
    
    const tokenInfo = this.getStoredTokenInfo();
    if (!tokenInfo || !tokenInfo.refreshToken) {
      this.logger.warn('Cannot refresh token - no refresh token available');
      return throwError(() => new Error('No refresh token available'));
    }
    
    this.tokenRefreshInProgress = true;
    this.logger.debug('Attempting to refresh authentication token');
    
    const refreshRequest: RefreshTokenRequest = {
      refreshToken: tokenInfo.refreshToken
    };
    
    return this.apiService.authRequest<AuthResponse>('POST', 'auth/refresh-token', refreshRequest)
      .pipe(
        tap((response: AuthResponse) => {
          if (response && response.token) {
            this.logger.info('Token refreshed successfully');
            
            // Update stored token with new values
            const expiresAt = response.expiresIn 
              ? Date.now() + (response.expiresIn * 1000) 
              : undefined;
              
            this.storeTokenInfo({
              token: response.token,
              refreshToken: response.refreshToken || tokenInfo.refreshToken,
              expiresAt: expiresAt
            });
            
            // Schedule next token refresh
            if (expiresAt) {
              this.scheduleTokenRefresh(expiresAt);
            }
          } else {
            this.logger.warn('Token refresh response missing token');
          }
          
          this.tokenRefreshInProgress = false;
        }),
        catchError((error) => {
          this.logger.error('Failed to refresh authentication token', {
            error: error.message,
            status: error.status
          });
          this.tokenRefreshInProgress = false;
          
          // If refresh fails with 401/403, user needs to re-authenticate
          if (error.status === 401 || error.status === 403) {
            this.clearAuthState();
            this.router.navigate(['/login']);
            this.notificationService.showWarning(
              'Your session has expired. Please log in again.', 
              'Session Expired'
            );
          }
          
          return throwError(() => error);
        })
      );
  }

  /**
   * Fetch current user details from the server
   */
  private fetchUserDetails(): void {
    this.logger.debug('Fetching user details from server');
    this.apiService.get<User>('auth/user')
      .pipe(
        timeout(this.AUTH_TIMEOUT),
        catchError((error) => {
          this.logger.error('Failed to fetch user details', {
            error: error.message,
            status: error.status,
            timestamp: new Date().toISOString()
          });
          
          // Only clear auth if this is an auth error
          if (error.status === 401 || error.status === 403) {
            this.clearAuthState();
          }
          
          return throwError(() => error);
        })
      )
      .subscribe(user => {
        this.logger.info('User details retrieved successfully', {
          username: user.username,
          isAdmin: this.hasAdminRole(user)
        });
        
        // Update auth state with user details
        this.updateAuthState({
          user,
          isLoggedIn: true,
          isAdmin: this.hasAdminRole(user),
          isOffline: this._isOfflineMode,
          lastSyncTime: new Date()
        });
        
        this.sessionService.setUserSession(user);
      });
  }

  /**
   * Update the authentication state
   */
  private updateAuthState(state: Partial<AuthState>): void {
    this.authState.next({
      ...this.authState.value,
      ...state
    });
    
    // Update offline mode flag
    if (state.isOffline !== undefined) {
      this._isOfflineMode = state.isOffline;
    }
  }

  /**
   * Handle successful login
   */
  private handleSuccessfulLogin(response: AuthResponse, expiresAt?: number): void {
    // Store token information
    this.storeTokenInfo({
      token: response.token,
      refreshToken: response.refreshToken,
      expiresAt: expiresAt
    });
    
    // Update auth state
    this.updateAuthState({
      user: response.user,
      isLoggedIn: true,
      isAdmin: this.hasAdminRole(response.user),
      isOffline: false,
      lastSyncTime: new Date()
    });
    
    this.sessionService.setUserSession(response.user);
    
    this.logger.info('Login process completed successfully', { 
      username: response.user.username,
      hasRoles: Array.isArray(response.user.roles),
      permissions: response.user.permissions?.join(',') || 'none specified',
      sessionEstablished: true
    });
  }

  /**
   * Handle login error with appropriate messaging
   */
  private handleLoginError(error: any, username: string): Observable<never> {
    const statusCode = error.status;
    const errorMessage = error.message || 'Unknown error';
    
    this.logger.error('Authentication failed', { 
      username,
      errorType: error.constructor.name,
      status: statusCode, 
      message: errorMessage,
      timestamp: new Date().toISOString()
    });
    
    // Provide a user-friendly error message based on the error type
    let userMessage = 'Login failed. Please try again.'; 
    
    if (error.status === 0) {
      userMessage = 'Unable to connect to the server. Please check your connection.';
    } else if (error.status === 504) {
      userMessage = 'Server is taking too long to respond. Please try again later.';
    } else if (error.status === 401) {
      userMessage = 'Invalid username or password.';
      this.logger.warn('Invalid credentials provided', { username });
    } else if (error.status === 403) {
      userMessage = 'Your account is not authorized to access this system.';
      this.logger.warn('Authorization failure during login', { username });
    } else if (error.status >= 500) {
      userMessage = 'Server error. Please contact support if the problem persists.';
      this.logger.error('Server error during authentication', {
        username,
        status: error.status,
        serverMessage: error.error?.message || 'No server message'
      });
    }
    
    this.notificationService.showError(userMessage, 'Authentication Error');
    return throwError(() => error);
  }

  /**
   * Development mode login for testing
   */
  private handleDevLogin(username: string): Observable<AuthResponse> {
    this.logger.debug('Using development mode login');
    const mockUser: User = { 
      id: 1, 
      username: username, 
      name: 'Test User', 
      firstName: 'Test',
      lastName: 'User',
      email: 'test@example.com',
      roles: ['admin'],
      permissions: ['user:read', 'user:write', 'admin:access'],
      password: 'test'
    };
    
    // Generate a mock token that expires in 1 hour
    const expiresAt = Date.now() + (3600 * 1000);
    const mockResponse: AuthResponse = {
      success: true,
      token: 'mock-token-for-development-only-' + Date.now(),
      refreshToken: 'mock-refresh-token-' + Date.now(),
      user: mockUser,
      expiresIn: 3600
    };
    
    this.handleSuccessfulLogin(mockResponse, expiresAt);
    
    this.notificationService.showInfo(
      'Logged in using development mode credentials',
      'Development Mode'
    );
    
    return of(mockResponse);
  }

  /**
   * Offline mode login with mock data
   */
  private handleOfflineLogin(username: string, password: string): Observable<AuthResponse> {
    // Only allow certain usernames in offline mode
    const validOfflineUsers = ['test', 'demo', 'admin'];
    
    if (validOfflineUsers.includes(username.toLowerCase())) {
      const mockUser: User = { 
        id: 999, 
        username: username, 
        name: `${username.charAt(0).toUpperCase() + username.slice(1)} User`, 
        firstName: username.charAt(0).toUpperCase() + username.slice(1),
        lastName: 'User',
        email: `${username}@example.com`,
        roles: username === 'admin' ? ['admin'] : ['user'],
        permissions: username === 'admin' 
          ? ['user:read', 'user:write', 'admin:access'] 
          : ['user:read'],
        password: password
      };
      
      const mockResponse: AuthResponse = {
        success: true,
        token: 'offline-mock-token-' + Date.now(),
        user: mockUser
      };
      
      this.handleSuccessfulLogin(mockResponse);
      
      // Update offline flag
      this.updateAuthState({
        isOffline: true
      });
      
      this.logger.info('Offline mode login successful', {
        username,
        roles: mockUser.roles,
        isAdmin: this.hasAdminRole(mockUser)
      });
      
      // Notify user they are in offline mode
      this.notificationService.showInfo(
        'You are working in offline mode. Some features may be limited.', 
        'Offline Mode Active'
      );
      
      return of(mockResponse).pipe(delay(500)); // Simulate network delay
    } else {
      this.notificationService.showError(
        'Only test, demo and admin users are available in offline mode', 
        'Login Failed'
      );
      return throwError(() => new Error('Invalid offline user'));
    }
  }

  /**
   * Reset authentication state to default values
   */
  private clearAuthState(): void {
    // Clear stored tokens
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.REFRESH_TOKEN_KEY);
    localStorage.removeItem(this.TOKEN_EXPIRES_KEY);
    
    // Reset auth state
    this.updateAuthState({
      user: {
        id: 0,
        username: '',
        name: '',
        firstName: '',
        lastName: '',
        email: '',
        password: '',
        roles: []
      },
      isLoggedIn: false,
      isAdmin: false
    });
  }

  /**
   * Store token information in localStorage
   */
  private storeTokenInfo(tokenInfo: TokenInfo): void {
    localStorage.setItem(this.TOKEN_KEY, tokenInfo.token);
    
    if (tokenInfo.refreshToken) {
      localStorage.setItem(this.REFRESH_TOKEN_KEY, tokenInfo.refreshToken);
    }
    
    if (tokenInfo.expiresAt) {
      localStorage.setItem(this.TOKEN_EXPIRES_KEY, tokenInfo.expiresAt.toString());
    }
  }

  /**
   * Retrieve stored token information from localStorage
   */
  private getStoredTokenInfo(): TokenInfo | null {
    const token = localStorage.getItem(this.TOKEN_KEY);
    
    if (!token) {
      return null;
    }
    
    const refreshToken = localStorage.getItem(this.REFRESH_TOKEN_KEY);
    const expiresAtStr = localStorage.getItem(this.TOKEN_EXPIRES_KEY);
    const expiresAt = expiresAtStr ? parseInt(expiresAtStr, 10) : undefined;
    
    return {
      token,
      refreshToken: refreshToken || undefined,
      expiresAt
    };
  }

  /**
   * Get the authentication token
   */
  public getAuthToken(): string | null {
    return localStorage.getItem(this.TOKEN_KEY);
  }

  /**
   * Schedule token refresh before expiration
   */
  private scheduleTokenRefresh(expiresAt?: number): void {
    if (!expiresAt) {
      return;
    }
    
    // Clear any existing timeout
    if (this.refreshTokenTimeout) {
      clearTimeout(this.refreshTokenTimeout);
    }
    
    // Calculate time until refresh (token expiry minus threshold)
    const now = Date.now();
    const refreshTime = expiresAt - (this.TOKEN_REFRESH_THRESHOLD * 1000);
    
    // If already past the refresh time, refresh immediately
    if (now >= refreshTime) {
      this.logger.debug('Token is near expiration, refreshing now');
      this.refreshToken().subscribe();
      return;
    }
    
    // Schedule refresh
    const timeUntilRefresh = refreshTime - now;
    this.logger.debug(`Scheduling token refresh in ${Math.floor(timeUntilRefresh / 1000)} seconds`);
    
    this.refreshTokenTimeout = setTimeout(() => {
      this.logger.debug('Executing scheduled token refresh');
      this.refreshToken().subscribe();
    }, timeUntilRefresh);
  }

  /**
   * Initialize WebSocket connection for real-time auth events
   */
  private initializeAuthSocket(): void {
    // Close any existing connection first
    this.closeAuthSocket();
    
    // Skip if in offline mode or no valid token
    if (this._isOfflineMode || !this.getAuthToken()) {
      return;
    }
    
    const socketUrl = `${environment.socket.url}/auth`;
    this.logger.debug(`Initializing auth WebSocket connection to ${socketUrl}`);
    
    try {
      this.socket = new WebSocket(socketUrl);
      
      // Add auth token to the connection
      this.socket.onopen = () => {
        this.logger.debug('Auth WebSocket connection established');
        if (this.socket && this.getAuthToken()) {
          this.socket.send(JSON.stringify({
            type: 'authenticate',
            token: this.getAuthToken()
          }));
        }
      };
      
      // Handle incoming messages
      this.socket.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          this.logger.debug('Received auth WebSocket message', { type: data.type });
          
          switch (data.type) {
            case 'session_expired':
              this.notificationService.showWarning(
                'Your session has expired. Please log in again.',
                'Session Expired'
              );
              this.logout();
              break;
              
            case 'permissions_updated':
              this.logger.debug('User permissions updated, refreshing user details');
              this.fetchUserDetails();
              break;
              
            case 'force_logout':
              this.notificationService.showWarning(
                data.message || 'You have been logged out by an administrator.',
                'Signed Out'
              );
              this.logout();
              break;
          }
        } catch (error) {
          this.logger.error('Error processing WebSocket message', { error });
        }
      };
      
      // Handle connection errors
      this.socket.onerror = (error) => {
        this.logger.warn('Auth WebSocket error', { error });
      };
      
      // Handle connection close
      this.socket.onclose = () => {
        this.logger.debug('Auth WebSocket connection closed');
        
        // Try to reconnect after a delay if still authenticated
        if (this.isAuthenticated && !this._isOfflineMode) {
          setTimeout(() => {
            this.logger.debug('Attempting to reconnect Auth WebSocket');
            this.initializeAuthSocket();
          }, 5000);
        }
      };
    } catch (error) {
      this.logger.error('Failed to initialize Auth WebSocket', { error });
    }
  }

  /**
   * Close the WebSocket connection
   */
  private closeAuthSocket(): void {
    if (this.socket) {
      this.logger.debug('Closing auth WebSocket connection');
      this.socket.close();
      this.socket = null;
    }
    
    this.socketDestroy$.next();
  }

  /**
   * Check network connectivity status
   */
  public checkNetworkStatus(): Observable<boolean> {
    this.logger.debug('Checking network connectivity status');
    return this.apiService.get<any>('health-check', { 
      headers: { 'Cache-Control': 'no-cache' }
    }).pipe(
      timeout(3000),
      map(() => {
        const wasOffline = this._isOfflineMode;
        this._isOfflineMode = false;
        this.connectionRetryCount = 0;
        
        this.logger.info('Network connectivity check succeeded', {
          wasOffline,
          isOffline: false,
          transition: wasOffline ? 'offline->online' : 'online->online'
        });
        
        // Update auth state with offline flag
        this.updateAuthState({
          isOffline: false
        });
        
        // If we were offline but now online, notify the user
        if (wasOffline) {
          this.notificationService.showSuccess(
            'Connection to server restored. Full functionality available.', 
            'Back Online'
          );
          
          // Re-establish WebSocket connection
          if (this.isAuthenticated) {
            this.initializeAuthSocket();
          }
        }
        
        return true;
      }),
      catchError((error) => {
        const wasOffline = this._isOfflineMode;
        this._isOfflineMode = true;
        
        this.logger.warn('Network connectivity check failed', {
          wasOffline,
          isOffline: true,
          transition: wasOffline ? 'offline->offline' : 'online->offline',
          error: error.message,
          status: error.status || 'unknown'
        });
        
        // Update auth state with offline flag
        this.updateAuthState({
          isOffline: true
        });
        
        return of(false);
      })
    );
  }
  
  /**
   * Attempt to reconnect to the server with exponential backoff
   */
  public reconnectToServer(): Observable<boolean> {
    const maxRetries = 5;
    let attempt = 0;
    
    this.logger.info('Attempting to reconnect to server');
    
    const reconnect = (): Observable<boolean> => {
      attempt++;
      const backoffDelay = Math.pow(2, attempt - 1) * 1000; // 1s, 2s, 4s, 8s, 16s
      
      this.logger.debug(`Reconnect attempt ${attempt} of ${maxRetries} after ${backoffDelay}ms delay`);
      
      return of(null).pipe(
        // Add delay for backoff
        tap(() => this.notificationService.showInfo(
          `Attempting to reconnect to server (${attempt}/${maxRetries})...`,
          'Reconnecting'
        )),
        delay(backoffDelay),
        // Check connection
        concatMap(() => this.checkNetworkStatus()),
        // Try again if failed
        concatMap(isConnected => {
          if (isConnected) {
            return of(true);
          }
          if (attempt < maxRetries) {
            return reconnect();
          }
          return of(false);
        })
      );
    };
    
    return reconnect();
  }
}
