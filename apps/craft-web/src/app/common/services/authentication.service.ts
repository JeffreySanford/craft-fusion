import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, of, throwError, Subject } from 'rxjs';
import { catchError, map, tap, timeout, delay, concatMap, shareReplay } from 'rxjs/operators';
import { AdminStateService } from './admin-state.service';
import { UserTrackingService } from './user-tracking.service';
import { ApiService } from './api.service';
import { SessionService } from './session.service';
import { LoggerService } from './logger.service';
import { NotificationService } from './notification.service';
import { User } from '../interfaces/user.interface';
import { environment } from '../../../environments/environment';
import { io, Socket } from 'socket.io-client';

export interface AuthResponse {
  success: boolean;
  token: string;
  refreshToken?: string;
  user: User;
  expiresIn?: number;                                    
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
  refreshToken?: string | undefined;
  expiresAt?: number | undefined;                        
}

export interface AuthState {
  user: User | null;
  isLoggedIn: boolean;
  isAdmin: boolean;
  isOffline: boolean;
  lastSyncTime?: Date;
}

@Injectable()
export class AuthenticationService {

  private readonly TOKEN_KEY = 'auth_token';
  private readonly REFRESH_TOKEN_KEY = 'auth_refresh_token';
  private readonly TOKEN_EXPIRES_KEY = 'auth_token_expires';
  private readonly AUTH_TIMEOUT = 15000;                                        
  private readonly TOKEN_REFRESH_THRESHOLD = 300;                                         
  private readonly MAX_RETRIES = 3;                                                   

  private socket: Socket | null = null;
  private socketDestroy$ = new Subject<void>();

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
      role: '',                                  
    },
    isLoggedIn: false,
    isAdmin: false,
    isOffline: false,
  });

  public readonly authState$ = this.authState.asObservable();
  public readonly currentUser$ = this.authState$.pipe(
    map(state => state.user),
    shareReplay(1),
  );
  public readonly isLoggedIn$ = this.authState$.pipe(
    map(state => state.isLoggedIn),
    shareReplay(1),
  );
  public readonly isAdmin$ = this.authState$.pipe(
    map(state => state.isAdmin),
    tap(isAdmin => console.log('🔐 AuthService: isAdmin$ emitted:', isAdmin)),
    shareReplay(1),
  );

  private _isOfflineMode = false;
  private connectionRetryCount = 0;
  private tokenRefreshInProgress = false;

  private refreshTokenTimeout: ReturnType<typeof setTimeout> | null = null;

  private normalizeError(error: unknown): { status?: number; message?: string; error?: any; name?: string } {
    if (!error) return { message: String(error) };
    if (typeof error === 'object' && error !== null) {
      const e = error as any;
      return {
        status: e.status,
        message: e.message || (e.error && e.error.message) || String(e),
        error: e.error || e,
        name: e.name || (e.constructor && e.constructor.name) || typeof e,
      };
    }
    return { message: String(error), name: typeof error };
  }

  constructor(
    private apiService: ApiService,
    private http: HttpClient,
    private router: Router,
    private sessionService: SessionService,
    private logger: LoggerService,
    private notificationService: NotificationService,
    private adminStateService: AdminStateService,
    private userTrackingService: UserTrackingService,
  ) {
    this.logger.registerService('AuthService');
    console.log('🔐 AuthService: Constructor called');
    this.logger.info('Authentication Service initialized');

    this.clearAuthState();

  }

  public manualInitialize(): void {
    this.initializeAuthentication();
  }

  private hasAdminRole(user: User | null): boolean {
    if (!user) {
      console.log('hasAdminRole: No user provided');
      return false;
    }

    const isAdmin = Array.isArray(user.roles) && user.roles.includes('admin');
    console.log('hasAdminRole:', { username: user.username, roles: user.roles, isAdmin });

    return isAdmin;
  }

  public get currentUser(): User | null {
    return this.authState.value.user;
  }

  public get isAuthenticated(): boolean {
    return this.authState.value.isLoggedIn;
  }

  public get isOffline(): boolean {
    return this._isOfflineMode;
  }

  public initializeAuthentication(): void {
    console.log('🔐 AuthService: initializeAuthentication called');
    this.logger.debug('Initializing authentication - checking for existing tokens');

    const tokenInfo = this.getStoredTokenInfo();
    console.log('🔐 AuthService: Token info found:', {
      hasToken: !!tokenInfo?.token,
      hasRefreshToken: !!tokenInfo?.refreshToken,
      expiresAt: tokenInfo?.expiresAt,
    });

    if (tokenInfo && tokenInfo.token) {
      this.logger.debug('Found existing token, validating with API');

      this.apiService
        .get<User>('auth/user')
        .pipe(
          timeout(this.AUTH_TIMEOUT),
          catchError((error: any) => {
            console.log('initializeAuthentication: Token validation failed', error);
            this.logger.warn('Token validation failed, clearing auth state', {
              error: (error && error.message) || 'Unknown error',
              status: (error && error.status) || 0,
            });

            this.clearAuthState();
            return throwError(() => error);
          }),
        )
        .subscribe({
          next: user => {
            console.log('initializeAuthentication: Token validation successful', {
              username: user.username,
              roles: user.roles,
              isAdmin: this.hasAdminRole(user),
            });

            this.logger.info('Token validation successful, restoring user session', {
              username: user.username,
              isAdmin: this.hasAdminRole(user),
            });

            this.updateAuthState({
              user,
              isLoggedIn: true,
              isAdmin: this.hasAdminRole(user),
              isOffline: false,
              lastSyncTime: new Date(),
            });

            this.sessionService.setUserSession(user);

            if (tokenInfo.expiresAt) {
              this.scheduleTokenRefresh(tokenInfo.expiresAt);
            }
          },
          error: () => {
            console.log('initializeAuthentication: Token validation failed, clearing state');

            this.clearAuthState();
            this.router.navigate(['/home']);
          },
        });
    } else {
      console.log('initializeAuthentication: No existing tokens found');
      this.logger.debug('No existing tokens found, user not authenticated');

      this.clearAuthState();
      this.router.navigate(['/home']);
    }
  }

  public login(username: string, password: string): Observable<AuthResponse> {

    this.clearAuthState();

    this.logger.info('Login attempt initiated', {
      username,
      timestamp: new Date().toISOString(),
      isOffline: this._isOfflineMode,
      serverStarting: this.apiService.isServerStarting,
    });

    if (this._isOfflineMode) {
      this.logger.warn('Operating in offline mode, using fallback login mechanism');
      return this.handleOfflineLogin(username, password);
    }

    if (username === 'test' && password === 'test') {
      this.logger.debug('Test credentials detected - proceeding with normal API call');
    }

    if (username === 'admin' && password === 'admin') {
      this.logger.debug('Admin credentials detected - proceeding with normal API call');
    }

    const loginRequest: LoginRequest = { username, password };

    this.logger.debug('Making authentication request to server', {
      endpoint: 'auth/login',
    });

    return this.apiService.authRequest<AuthResponse>('POST', 'auth/login', loginRequest).pipe(
      tap((response: AuthResponse) => {
        if (response && response.token) {
          this._isOfflineMode = false;

          this.logger.info('Authentication successful', {
            username: response.user?.username,
            hasRoles: Array.isArray(response.user?.roles),
            tokenReceived: true,
            tokenLength: response.token.length,
            hasRefreshToken: !!response.refreshToken,
          });

          const expiresAt = response.expiresIn ? Date.now() + response.expiresIn * 1000 : undefined;

          this.handleSuccessfulLogin(response, expiresAt);

          this.initializeAuthSocket();

          if (expiresAt) {
            this.scheduleTokenRefresh(expiresAt);
          }
        } else {
          this.logger.warn('Server returned success but no token was provided');
        }
      }),
      catchError((error: any) => {
        const status = error?.status;
        const message = error?.message || 'Unknown error';

        if (status === 0 || status === 504) {
          this._isOfflineMode = true;
          this.logger.warn('Network connectivity issue detected during authentication', {
            errorStatus: status,
            errorMessage: message,
            errorType: error?.name,
            timestamp: new Date().toISOString(),
            offlineModeActivated: true,
          });

          this.notificationService.showWarning(`Server appears to be unavailable. Using offline mode for demonstration.`, 'Switching to Offline Mode');

          return this.handleOfflineLogin(username, password);
        }

        return this.handleLoginError(error, username);
      }),
    );
  }

  public logout(): void {
    const currentUser = this.authState.value.user;
    this.logger.info('User logout initiated', {
      username: currentUser?.username,
      wasAuthenticated: this.authState.value.isLoggedIn,
      timestamp: new Date().toISOString(),
    });

    this.closeAuthSocket();

    if (this.refreshTokenTimeout) {
      clearTimeout(this.refreshTokenTimeout);
      this.refreshTokenTimeout = null;
    }

    this.clearAuthState();
    this.sessionService.clearUserSession();

    this.adminStateService.setAdminStatus(false);

    this.userTrackingService.setCurrentUser(null);

    this.router.navigate(['/home']);

    this.logger.debug('User logout completed, all authentication and administrative state reset');
  }

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
      refreshToken: tokenInfo.refreshToken,
    };

    return this.apiService.authRequest<AuthResponse>('POST', 'auth/refresh-token', refreshRequest).pipe(
      tap((response: AuthResponse) => {
        if (response && response.token) {
          this.logger.info('Token refreshed successfully');

          const expiresAt = response.expiresIn ? Date.now() + response.expiresIn * 1000 : undefined;

          this.storeTokenInfo({
            token: response.token,
            refreshToken: response.refreshToken || tokenInfo.refreshToken,
            expiresAt: expiresAt,
          });

          if (expiresAt) {
            this.scheduleTokenRefresh(expiresAt);
          }
        } else {
          this.logger.warn('Token refresh response missing token');
        }

        this.tokenRefreshInProgress = false;
      }),
      catchError((error: any) => {
        const status = error?.status;
        const message = error?.message || 'Unknown error';

        this.logger.error('Failed to refresh authentication token', {
          error: message,
          status,
        });
        this.tokenRefreshInProgress = false;

        if (status === 401 || status === 403) {
          this.clearAuthState();
          this.router.navigate(['/login']);
          this.notificationService.showWarning('Your session has expired. Please log in again.', 'Session Expired');
        }

        return throwError(() => error);
      }),
    );
  }

  private fetchUserDetails(): void {
    this.logger.debug('Fetching user details from server');
    this.apiService
      .get<User>('auth/user')
      .pipe(
        timeout(this.AUTH_TIMEOUT),
        catchError((error: any) => {
          const status = error?.status;
          const message = error?.message || 'Unknown error';

          this.logger.error('Failed to fetch user details', {
            error: message,
            status,
            timestamp: new Date().toISOString(),
          });

          if (status === 401 || status === 403) {
            this.clearAuthState();
          }

          return throwError(() => error);
        }),
      )
      .subscribe(user => {
        this.logger.info('User details retrieved successfully', {
          username: user.username,
          isAdmin: this.hasAdminRole(user),
        });

        this.updateAuthState({
          user,
          isLoggedIn: true,
          isAdmin: this.hasAdminRole(user),
          isOffline: this._isOfflineMode,
          lastSyncTime: new Date(),
        });

        this.sessionService.setUserSession(user);
      });
  }

  private updateAuthState(state: Partial<AuthState>): void {
    const oldAdminState = this.authState.value.isAdmin;
    const oldLoggedInState = this.authState.value.isLoggedIn;
    console.log('🔐 AuthService: updateAuthState called with:', state);
    this.authState.next({
      ...this.authState.value,
      ...state,
    });

    if (state.isAdmin !== undefined && state.isAdmin !== oldAdminState) {
      console.log('🔐 AuthService: isAdmin changed from', oldAdminState, 'to', state.isAdmin);
    }
    if (state.isLoggedIn !== undefined && state.isLoggedIn !== oldLoggedInState) {
      console.log('🔐 AuthService: isLoggedIn changed from', oldLoggedInState, 'to', state.isLoggedIn);
    }

    if (state.isOffline !== undefined) {
      this._isOfflineMode = state.isOffline;
    }
  }

  private handleSuccessfulLogin(response: AuthResponse, expiresAt?: number): void {
    console.log('handleSuccessfulLogin: Processing login response', {
      username: response.user?.username,
      roles: response.user?.roles,
      hasToken: !!response.token,
    });

    this.storeTokenInfo({
      token: response.token,
      refreshToken: response.refreshToken,
      expiresAt: expiresAt,
    });

    this.updateAuthState({
      user: response.user,
      isLoggedIn: true,
      isAdmin: this.hasAdminRole(response.user),
      isOffline: false,
      lastSyncTime: new Date(),
    });

    this.sessionService.setUserSession(response.user);

    const isAdmin = this.hasAdminRole(response.user);
    try {
      this.adminStateService.setAdminStatus(isAdmin);
    } catch (err) {
      this.logger.warn('Failed to update AdminStateService', { error: err });
    }

    if (isAdmin) {
      try {
        this.notificationService.showSuccess('Signed in with administrator privileges', 'Admin Login');
      } catch (err) {
        this.logger.warn('Failed to show admin login notification', { error: err });
      }
    }

    this.logger.info('Login process completed successfully', {
      username: response.user.username,
      hasRoles: Array.isArray(response.user.roles),
      permissions: response.user.permissions?.join(',') || 'none specified',
      sessionEstablished: true,
    });
  }

  private handleLoginError(error: unknown, username: string): Observable<never> {
    const err = this.normalizeError(error);
    const statusCode = err.status;
    const errorMessage = err.message || 'Unknown error';

    this.logger.error('Authentication failed', {
      username,
      errorType: err.name || 'Error',
      status: statusCode,
      message: errorMessage,
      timestamp: new Date().toISOString(),
    });

    let userMessage = 'Login failed. Please try again.';

    if (statusCode === 0) {
      userMessage = 'Unable to connect to the server. Please check your connection.';
    } else if (statusCode === 504) {
      userMessage = 'Server is taking too long to respond. Please try again later.';
    } else if (statusCode === 401) {
      userMessage = 'Invalid username or password.';
      this.logger.warn('Invalid credentials provided', { username });
    } else if (statusCode === 403) {
      userMessage = 'Your account is not authorized to access this system.';
      this.logger.warn('Authorization failure during login', { username });
    } else if (statusCode && statusCode >= 500) {
      userMessage = 'Server error. Please contact support if the problem persists.';
      this.logger.error('Server error during authentication', {
        username,
        status: statusCode,
        serverMessage: err.error?.message || 'No server message',
      });
    }

    this.notificationService.showError(userMessage, 'Authentication Error');
    return throwError(() => error);
  }

  private handleOfflineLogin(username: string, password: string): Observable<AuthResponse> {

    const validOfflineUsers = ['test', 'demo', 'admin', 'guest'];

    if (validOfflineUsers.includes(username.toLowerCase())) {
      const mockUser: User = {
        id: 999,
        username: username,
        name: `${username.charAt(0).toUpperCase() + username.slice(1)} User`,
        firstName: username.charAt(0).toUpperCase() + username.slice(1),
        lastName: 'User',
        email: `${username}@example.com`,
        roles: username === 'admin' ? ['admin'] : ['user'],
        permissions: username === 'admin' ? ['user:read', 'user:write', 'admin:access'] : ['user:read'],
        password: password,
      };

      const mockResponse: AuthResponse = {
        success: true,
        token: 'offline-mock-token-' + Date.now(),
        user: mockUser,
      };

      this.handleSuccessfulLogin(mockResponse);

      this.updateAuthState({
        isOffline: true,
      });

      this.logger.info('Offline mode login successful', {
        username,
        roles: mockUser.roles,
        isAdmin: this.hasAdminRole(mockUser),
      });

      this.notificationService.showInfo('You are working in offline mode. Some features may be limited.', 'Offline Mode Active');

      return of(mockResponse).pipe(delay(500));                          
    } else {
      this.notificationService.showError('Only test, demo and admin users are available in offline mode', 'Login Failed');
      return throwError(() => new Error('Invalid offline user'));
    }
  }

  private clearAuthState(): void {
    console.log('AuthService: Clearing authentication state');

    sessionStorage.removeItem(this.TOKEN_KEY);
    sessionStorage.removeItem(this.REFRESH_TOKEN_KEY);
    sessionStorage.removeItem(this.TOKEN_EXPIRES_KEY);

    this.authState.next({
      user: {
        id: 0,
        username: '',
        name: '',
        firstName: '',
        lastName: '',
        email: '',
        password: '',
        roles: [],
        role: '',
      },
      isLoggedIn: false,
      isAdmin: false,
      isOffline: this._isOfflineMode,
    });

    if (this.refreshTokenTimeout) {
      clearTimeout(this.refreshTokenTimeout);
      this.refreshTokenTimeout = null;
    }

    this.closeAuthSocket();

    this.logger.debug('Authentication state cleared');
  }

  private storeTokenInfo(tokenInfo: TokenInfo): void {
    sessionStorage.setItem(this.TOKEN_KEY, tokenInfo.token);

    if (tokenInfo.refreshToken) {
      sessionStorage.setItem(this.REFRESH_TOKEN_KEY, tokenInfo.refreshToken);
    }

    if (tokenInfo.expiresAt) {
      sessionStorage.setItem(this.TOKEN_EXPIRES_KEY, tokenInfo.expiresAt.toString());
    }
  }

  private getStoredTokenInfo(): TokenInfo | null {
    const token = sessionStorage.getItem(this.TOKEN_KEY);

    if (!token) {
      return null;
    }

    const refreshToken = sessionStorage.getItem(this.REFRESH_TOKEN_KEY);
    const expiresAtStr = sessionStorage.getItem(this.TOKEN_EXPIRES_KEY);
    const expiresAt = expiresAtStr ? parseInt(expiresAtStr, 10) : undefined;

    if (expiresAt && Date.now() > expiresAt) {
      console.log('Stored token has expired, clearing authentication state');
      this.clearAuthState();
      return null;
    }

    return {
      token,
      refreshToken: refreshToken || undefined,
      expiresAt,
    };
  }

  public getAuthToken(): string | null {
    const token = sessionStorage.getItem(this.TOKEN_KEY);

    if (token) {
      const expiresAtStr = sessionStorage.getItem(this.TOKEN_EXPIRES_KEY);
      const expiresAt = expiresAtStr ? parseInt(expiresAtStr, 10) : undefined;

      if (expiresAt && Date.now() > expiresAt) {
        console.log('Token has expired, clearing authentication state');
        this.clearAuthState();
        return null;
      }

      return token;
    }

    return null;
  }

  private scheduleTokenRefresh(expiresAt?: number): void {
    if (!expiresAt) {
      return;
    }

    if (this.refreshTokenTimeout) {
      clearTimeout(this.refreshTokenTimeout);
    }

    const now = Date.now();
    const refreshTime = expiresAt - this.TOKEN_REFRESH_THRESHOLD * 1000;

    if (now >= refreshTime) {
      this.logger.debug('Token is near expiration, refreshing now');
      this.refreshToken().subscribe();
      return;
    }

    const timeUntilRefresh = refreshTime - now;
    this.logger.debug(`Scheduling token refresh in ${Math.floor(timeUntilRefresh / 1000)} seconds`);

    this.refreshTokenTimeout = setTimeout(() => {
      this.logger.debug('Executing scheduled token refresh');
      this.refreshToken().subscribe();
    }, timeUntilRefresh);
  }

  private initializeAuthSocket(): void {

    this.closeAuthSocket();

    if (this._isOfflineMode || !this.getAuthToken()) {
      return;
    }

    const socketUrl = environment.socket.url;
    this.logger.debug(`Initializing auth WebSocket connection to ${socketUrl}`);

    try {
      this.socket = io(`${socketUrl}/auth`, {
        transports: ['websocket', 'polling'],
        auth: {
          token: this.getAuthToken(),
        },
      });

      this.socket.on('connect', () => {
        this.logger.debug('Auth WebSocket connection established');
      });

      this.socket.on('session_expired', () => {
        this.notificationService.showWarning('Your session has expired. Please log in again.', 'Session Expired');
        this.logout();
      });

      this.socket.on('permissions_updated', () => {
        this.logger.debug('User permissions updated, refreshing user details');
        this.fetchUserDetails();
      });

      this.socket.on('force_logout', (data: any) => {
        this.notificationService.showWarning(data.message || 'You have been logged out by an administrator.', 'Signed Out');
        this.logout();
      });

      this.socket.on('disconnect', reason => {
        this.logger.debug('Auth WebSocket disconnected', { reason });
        if (reason === 'io server disconnect') {

          setTimeout(() => this.initializeAuthSocket(), 1000);
        }
      });

      this.socket.on('connect_error', error => {
        this.logger.warn('Auth WebSocket connection error', error);
      });
    } catch (error) {
      this.logger.error('Failed to initialize auth WebSocket', error);
    }
  }

  private closeAuthSocket(): void {
    if (this.socket) {
      this.logger.debug('Closing auth WebSocket connection');
      this.socket.disconnect();
      this.socket = null;
    }

    this.socketDestroy$.next();
  }

  public checkNetworkStatus(): Observable<boolean> {
    this.logger.debug('Checking network connectivity status');
    return this.apiService
      .get<unknown>('health-check', {
        headers: { 'Cache-Control': 'no-cache' },
      })
      .pipe(
        timeout(3000),
        map(() => {
          const wasOffline = this._isOfflineMode;
          this._isOfflineMode = false;
          this.connectionRetryCount = 0;

          this.logger.info('Network connectivity check succeeded', {
            wasOffline,
            isOffline: false,
            transition: wasOffline ? 'offline->online' : 'online->online',
          });

          this.updateAuthState({
            isOffline: false,
          });

          if (wasOffline) {
            this.notificationService.showSuccess('Connection to server restored. Full functionality available.', 'Back Online');

            if (this.isAuthenticated) {
              this.initializeAuthSocket();
            }
          }

          return true;
        }),
        catchError(error => {
          const wasOffline = this._isOfflineMode;
          this._isOfflineMode = true;

          this.logger.warn('Network connectivity check failed', {
            wasOffline,
            isOffline: true,
            transition: wasOffline ? 'offline->offline' : 'online->offline',
            error: error.message,
            status: error.status || 'unknown',
          });

          this.updateAuthState({
            isOffline: true,
          });

          return of(false);
        }),
      );
  }

  public reconnectToServer(): Observable<boolean> {
    const maxRetries = 5;
    let attempt = 0;

    this.logger.info('Attempting to reconnect to server');

    const reconnect = (): Observable<boolean> => {
      attempt++;
      const backoffDelay = Math.pow(2, attempt - 1) * 1000;                       

      this.logger.debug(`Reconnect attempt ${attempt} of ${maxRetries} after ${backoffDelay}ms delay`);

      return of(null).pipe(

        tap(() => this.notificationService.showInfo(`Attempting to reconnect to server (${attempt}/${maxRetries})...`, 'Reconnecting')),
        delay(backoffDelay),

        concatMap(() => this.checkNetworkStatus()),

        concatMap(isConnected => {
          if (isConnected) {
            return of(true);
          }
          if (attempt < maxRetries) {
            return reconnect();
          }
          return of(false);
        }),
      );
    };

    return reconnect();
  }
}
