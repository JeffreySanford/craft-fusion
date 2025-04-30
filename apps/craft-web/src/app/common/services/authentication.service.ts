import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { BehaviorSubject, Observable, of, throwError } from 'rxjs';
import { catchError, map, tap, timeout, delay, retryWhen, concatMap } from 'rxjs/operators';
import { SessionService } from './session.service';
import { LoggerService } from './logger.service';
import { NotificationService } from './notification.service';
import { ApiService } from './api.service';
import { User, AuthResponse, LoginRequest } from '../interfaces/user.interface';

@Injectable({
  providedIn: 'root'
})
export class AuthenticationService {
  // CONSTANTS
  private readonly TOKEN_KEY = 'auth_token';
  private readonly AUTH_TIMEOUT = 15000; // 15 seconds timeout for auth requests
  private readonly MAX_RETRIES = 3; // Maximum number of retries for connection issues
  
  // SUBJECTS FOR REACTIVE STATE
  private currentUserSubject = new BehaviorSubject<User | null>(null);
  public currentUser$ = this.currentUserSubject.asObservable();
  
  private isLoggedInSubject = new BehaviorSubject<boolean>(false);
  public isLoggedIn$ = this.isLoggedInSubject.asObservable();
  
  private isAdminSubject = new BehaviorSubject<boolean>(false);
  public isAdmin$ = this.isAdminSubject.asObservable();
  
  // Network state
  private isOfflineMode = false;
  private connectionRetryCount = 0;

  constructor(
    private apiService: ApiService,
    private router: Router,
    private sessionService: SessionService,
    private logger: LoggerService,
    private notificationService: NotificationService
  ) {
    this.logger.registerService('AuthService');
    this.logger.info('Authentication Service initialized');
    this.initializeAuthentication();
  }

  public get isAuthenticated(): boolean {
    return this.isLoggedInSubject.value;
  }

  public get currentUser(): User | null {
    return this.currentUserSubject.value;
  }

  // Make isOfflineMode available as a public getter
  public get isOffline(): boolean {
    return this.isOfflineMode;
  }

  public initializeAuthentication(): void {
    this.logger.debug('Initializing authentication process', { tokenExists: !!this.getAuthToken() });
    // Check for existing auth token
    const token = this.getAuthToken();
    
    if (token) {
      this.logger.debug('Found existing auth token, validating token integrity', {
        tokenLength: token.length,
        tokenPrefix: token.substring(0, 10) + '...'
      });
      // Attempt to validate token
      this.sessionService.validateToken(token).pipe(
        catchError((error) => {
          this.logger.warn('Token validation failed, clearing session', { 
            error: error.message || 'Unknown error',
            errorType: error.constructor.name,
            stack: error.stack?.split('\n')[0] || 'No stack trace'
          });
          this.clearAuthToken();
          return of(false);
        })
      ).subscribe(isValid => {
        this.logger.debug('Token validation completed', { isValid });
        if (isValid) {
          this.logger.info('Token validated successfully, fetching user details');
          this.fetchUserDetails();
        } else {
          this.logger.warn('Token validation returned invalid, clearing authentication');
          this.clearAuthToken();
        }
      });
    } else {
      this.logger.debug('No auth token found, user is not authenticated');
    }
  }

  public login(username: string, password: string): Observable<AuthResponse> {
    // Clear any existing token before attempting login
    this.clearAuthToken();
    
    console.log('💡 Authentication attempt starting', { username, isOffline: this.isOfflineMode });
    // Add debugger statement here for browser debugging
    // debugger;
    
    this.logger.info('Login attempt initiated', { 
      username,
      timestamp: new Date().toISOString(),
      isOffline: this.isOfflineMode,
      serverStarting: this.apiService.isServerStarting
    });

    // Check if we appear to be offline based on previous errors
    if (this.isOfflineMode) {
      this.logger.warn('Operating in offline mode, using fallback login mechanism', {
        username,
        offlineLoginAvailable: true
      });
      return this.handleOfflineLogin(username, password);
    }

    // Development mode fallback for testing
    if (username === 'test' && password === 'test') {
      this.logger.debug('Using development mode login for test credentials', { username });
      return this.handleDevLogin(username);
    }

    const loginRequest: LoginRequest = { 
      username, 
      password 
    };

    console.log('💡 Making auth request to server', { endpoint: 'auth/login', apiUrl: this.apiService.getApiUrl() });
    
    this.logger.debug('Making authentication request to server', {
      endpoint: 'auth/login'
    });

    // Use special auth request method with enhanced retry logic
    return this.apiService.authRequest<AuthResponse>('POST', 'auth/login', loginRequest)
      .pipe(
        tap((response: AuthResponse) => {
          console.log('✅ Authentication response received', { 
            success: true, 
            hasToken: !!response?.token,
            user: response?.user?.username 
          });
          
          if (response && response.token) {
            this.isOfflineMode = false;
            
            this.logger.info('Authentication successful', {
              username: response.user?.username,
              role: response.user?.role,
              tokenReceived: true,
              tokenLength: response.token.length
            });
            this.handleSuccessfulLogin(response);
          } else {
            this.logger.warn('Server returned success but no token was provided', {
              responseKeys: Object.keys(response)
            });
          }
        }),
        catchError((error) => {
          console.error('❌ Authentication error', { 
            status: error.status, 
            message: error.message,
            name: error.name,
            statusText: error.statusText,
            url: error.url
          });
          
          // Check if this is a connection issue
          if (error.status === 0 || error.status === 504) {
            this.isOfflineMode = true;
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

  public logout(): void {
    const currentUser = this.currentUserSubject.value;
    this.logger.info('User logout initiated', {
      username: currentUser?.username,
      role: currentUser?.role,
      wasAuthenticated: this.isLoggedInSubject.value,
      timestamp: new Date().toISOString()
    });
    
    this.clearAuthToken();
    this.resetAuthState();
    this.sessionService.clearUserSession();
    this.router.navigate(['/login']);
    
    this.logger.debug('User logout completed, authentication state reset');
  }

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
          this.clearAuthToken();
          return throwError(() => error);
        })
      )
      .subscribe(user => {
        this.logger.info('User details retrieved successfully', {
          username: user.username,
          role: user.role,
          isAdmin: user.role === 'admin' || user.isAdmin === true
        });
        
        this.currentUserSubject.next(user);
        this.isLoggedInSubject.next(true);
        this.isAdminSubject.next(user.role === 'admin' || user.isAdmin === true);
        this.sessionService.setUserSession(user);
      });
  }

  private handleSuccessfulLogin(response: AuthResponse): void {
    this.setAuthToken(response.token);
    this.currentUserSubject.next(response.user);
    this.isLoggedInSubject.next(true);
    this.isAdminSubject.next(response.user.role === 'admin' || response.user.isAdmin === true);
    this.sessionService.setUserSession(response.user);
    
    this.logger.info('Login process completed successfully', { 
      username: response.user.username,
      role: response.user.role,
      permissions: response.user.permissions?.join(',') || 'none specified',
      sessionEstablished: true
    });
  }

  private handleLoginError(error: any, username: string): Observable<never> {
    const statusCode = error.status;
    const errorMessage = error.message || 'Unknown error';
    
    this.logger.error('Authentication failed', { 
      username,
      errorType: error.constructor.name,
      status: statusCode, 
      message: errorMessage,
      timestamp: new Date().toISOString(),
      stack: error.stack?.split('\n')[0] || 'No stack trace'
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

  private handleDevLogin(username: string): Observable<any> {
    const mockUser: User = { 
      id: 1, 
      username: username, 
      name: 'Test User', 
      firstName: 'Test',
      lastName: 'User',
      email: 'test@example.com',
      role: 'admin',
      password: 'test', // Add password to match SessionService's User interface
      isAdmin: true
    };
    
    this.setAuthToken('mock-token-for-development-only');
    this.currentUserSubject.next(mockUser);
    this.isLoggedInSubject.next(true);
    this.isAdminSubject.next(true);
    this.sessionService.setUserSession(mockUser);
    
    this.notificationService.showInfo(
      'Logged in using development mode credentials',
      'Development Mode'
    );
    
    return of({ success: true, user: mockUser });
  }

  private handleOfflineLogin(username: string, password: string): Observable<any> {
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
        role: username === 'admin' ? 'admin' : 'user',
        password: password,
        isAdmin: username === 'admin'
      };
      
      this.setAuthToken('offline-mock-token');
      this.currentUserSubject.next(mockUser);
      this.isLoggedInSubject.next(true);
      this.isAdminSubject.next(username === 'admin');
      this.sessionService.setUserSession(mockUser);
      
      this.logger.info('Offline mode login successful', {
        username,
        role: mockUser.role,
        isAdmin: mockUser.isAdmin
      });
      
      // Notify user they are in offline mode
      this.notificationService.showInfo(
        'You are working in offline mode. Some features may be limited.', 
        'Offline Mode Active'
      );
      
      return of({ success: true, user: mockUser }).pipe(delay(500)); // Simulate network delay
    } else {
      this.notificationService.showError(
        'Only test, demo and admin users are available in offline mode', 
        'Login Failed'
      );
      return throwError(() => new Error('Invalid offline user'));
    }
  }

  private resetAuthState(): void {
    this.currentUserSubject.next({ 
      id: 0, 
      username: '', 
      name: '',
      firstName: '',
      lastName: '',
      email: '',
      role: '',
      password: ''
    });
    this.isLoggedInSubject.next(false);
    this.isAdminSubject.next(false);
  }

  // TOKEN MANAGEMENT
  private setAuthToken(token: string): void {
    localStorage.setItem(this.TOKEN_KEY, token);
  }

  public getAuthToken(): string | null {
    return localStorage.getItem(this.TOKEN_KEY);
  }

  private clearAuthToken(): void {
    localStorage.removeItem(this.TOKEN_KEY);
  }
  
  // Network status management
  public checkNetworkStatus(): Observable<boolean> {
    this.logger.debug('Checking network connectivity status');
    return this.apiService.get<any>('health-check', { 
      headers: { 'Cache-Control': 'no-cache' },
      // Add shorter timeout for health checks
      timeout: 3000
    }).pipe(
      timeout(3000),
      map(() => {
        const wasOffline = this.isOfflineMode;
        this.isOfflineMode = false;
        this.connectionRetryCount = 0;
        
        this.logger.info('Network connectivity check succeeded', {
          wasOffline,
          isOffline: false,
          transition: wasOffline ? 'offline->online' : 'online->online'
        });
        
        // If we were offline but now online, notify the user
        if (wasOffline) {
          this.notificationService.showSuccess(
            'Connection to server restored. Full functionality available.', 
            'Back Online'
          );
        }
        
        return true;
      }),
      catchError((error) => {
        const wasOffline = this.isOfflineMode;
        this.isOfflineMode = true;
        
        this.logger.warn('Network connectivity check failed', {
          wasOffline,
          isOffline: true,
          transition: wasOffline ? 'offline->offline' : 'online->offline',
          error: error.message,
          status: error.status || 'unknown'
        });
        
        return of(false);
      })
    );
  }
  
  /**
   * Attempt to reconnect to the server with exponential backoff
   * @returns Observable<boolean> - true if reconnect was successful
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
