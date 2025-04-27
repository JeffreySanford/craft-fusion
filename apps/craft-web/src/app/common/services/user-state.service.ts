import { Injectable, Inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, BehaviorSubject, Subject, throwError } from 'rxjs';
import { catchError, map, debounceTime } from 'rxjs/operators';
import { AuthenticationService } from './authentication.service';
import { LoggerService } from './logger.service';
import { io, Socket } from 'socket.io-client';
import { environment } from '../../../environments/environment';

// Define interfaces for type safety
export interface LoginDateTimeDTO {
  dateTime: string;
}

export interface ImportedUserState {
  loginDateTime?: Date | null;
  visitLength?: number | null;
  visitedPages?: string[];
  username?: string;
}

export interface Document {
  name: string;
  color: string;
}

/**
 * User State Service
 * 
 * Implements Ward Bell's state mechanism and Dan Wahlin's RXJS state methodology
 * for managing user authentication and profile data.
 * 
 * See docs/STATE-MANAGEMENT.md for more details on our state architecture.
 */
@Injectable({
  providedIn: 'root'
})
export class UserStateService {
  private socket: Socket | null = null;
  private isSocketConnected = false;
  private socketEnabled = environment.socket?.enabled || false;
  private socketUrl = environment.socket?.url || 'http://localhost:3000';
  private socketConfig = {
    reconnectionAttempts: environment.socket?.reconnectionAttempts || 3,
    timeout: environment.socket?.timeout || 5000,
    forceNew: true
  };
  
  // Add guestId property definition
  private guestId: string | null = null;
  
  private openedDocuments: Document[] = [];
  private loginDateTime: Date | null = null;
  private visitLength: number | null = null;
  private visitedPages: string[] = [];
  private documentColors: string[] = ['red', 'green', 'blue', 'yellow', 'purple'];
  private apiUrl = '/api/user';

  private pageNameMapping: { [key: string]: string } = {
    '/api/files/getOpenedDocuments': 'Opened Documents',
    '/api/files/upload': 'Upload File',
    '/api/files/saveOpenedDocuments': 'Save Opened Documents',
    '/api/user/saveLoginDateTime': 'Save Login Date/Time',
    '/api/user/saveVisitLength': 'Save Visit Length',
    '/api/user/saveVisitedPages': 'Save Visited Pages',
    '/home': 'Home',
    '/table': 'Material Table',
    '/data-visualizations': 'Data Visualizations',
    '/book': 'Book',
    '/space-video': 'Space Video',
    // Add more mappings as needed
  };

  private visitLengthSubject = new Subject<number>();
  private lastSavedTime = 0;
  private readonly DEBOUNCE_TIME = 5000; // 5 seconds

  constructor(
    private http: HttpClient,
    @Inject('ApiService') private api: any,
    private authService: AuthenticationService,
    private logger: LoggerService
  ) {
    // Initialize socket connection only if enabled
    if (this.socketEnabled) {
      this.connectSocket();
    } else {
      this.logger.info('Socket connections disabled - using HTTP for all state updates');
    }
    
    // Check authentication status
    this.authService.isLoggedIn$.subscribe(isLoggedIn => {
      if (isLoggedIn) {
        // User is authenticated
        this.guestId = null;
      } else if (!this.guestId && this.socketEnabled) {
        // User is a guest and doesn't have a guest ID yet - only if sockets enabled
        this.registerAsGuest();
      }
    });
    
    // Setup debounced visit length updates
    this.visitLengthSubject.pipe(
      debounceTime(this.DEBOUNCE_TIME)
    ).subscribe(length => {
      this.saveStateData('visitLength', length.toString());
    });
  }
  
  private connectSocket(): void {
    try {
      // Connect to the main Socket.IO endpoint without specifying a namespace
      this.logger.debug(`Attempting to connect to socket.io server at ${this.socketUrl}`);
      
      // Create a test connection first to check if Socket.IO is available
      const testSocket = io(`${this.socketUrl}`, {
        timeout: 3000,
        reconnectionAttempts: 1,
        forceNew: true,
        transports: ['websocket', 'polling'] // Try WebSocket first, then fall back to polling
      });
      
      testSocket.on('connect_error', (error) => {
        this.logger.warn('Socket.IO not available on server:', error);
        testSocket.disconnect();
        this.disableSocket();
        this.logger.info('Falling back to HTTP-only mode for state management');
      });
      
      testSocket.on('connect', () => {
        this.logger.info('Socket.IO is available on server');
        testSocket.disconnect();
        
        // Now create the real connection
        this.socket = io(this.socketUrl, {
          ...this.socketConfig,
          path: '/socket.io', // Explicitly set the Socket.IO path
          transports: ['websocket', 'polling'] // Try WebSocket first, then fall back to polling
        });
        
        this.socket.on('connect', () => {
          this.logger.info('Socket connected successfully');
          this.isSocketConnected = true;
          
          // Using the isAuthenticated$ Observable for real-time authentication state
          if (this.guestId && !this.authService.isAuthenticated$) {
            this.registerAsGuest();
          }
        });
        
        this.socket.on('guestRegistered', (data: { guestId: string }) => {
          this.guestId = data.guestId;
          this.logger.debug(`Registered as guest with ID: ${this.guestId}`);
          
          // Store guest ID in localStorage for persistence
          localStorage.setItem('guestId', this.guestId);
        });
        
        this.socket.on('disconnect', () => {
          this.logger.debug('Socket disconnected from server');
          this.isSocketConnected = false;
        });
        
        // Add error handler
        this.socket.on('connect_error', (error) => {
          this.logger.warn('Socket connection error:', error);
          this.isSocketConnected = false;
          
          // Check reconnection attempts in a safer way
          const attemptCount = this.getSocketAttempts(this.socket);
          if (this.socket && attemptCount >= 3) {
            this.logger.error(`Multiple socket connection failures (${attemptCount}) - disabling socket connection`);
            this.disableSocket();
          }
        });
        
        // Add connection timeout handler
        setTimeout(() => {
          if (this.socket && !this.isSocketConnected) {
            this.logger.warn('Socket connection timed out');
            this.disableSocket();
            this.logger.info('Falling back to HTTP-only mode for state management');
          }
        }, 5000);
      });
    } catch (err) {
      this.logger.error('Failed to connect socket', err);
      this.disableSocket();
    }
  }
  
  // Helper method to safely get socket attempts 
  private getSocketAttempts(socket: Socket | null): number {
    if (!socket) return 0;
    
    try {
      // Try to access internal properties safely
      const ioManager = (socket as any).io;
      
      if (!ioManager) return 0;
      
      // Try different properties that might contain the attempts count
      // The exact property name can vary between Socket.io versions
      return ioManager.attempts || 
             ioManager._reconnectionAttempts || 
             ioManager.reconnectionAttempts ||
             (ioManager.backoff && ioManager.backoff.attempts) ||
             0;
    } catch (err) {
      this.logger.warn('Error accessing socket reconnection attempts', err);
      return 0; // Default to 0 if we can't access the attempts property
    }
  }
  
  // Method to disable socket connections after failures
  private disableSocket(): void {
    this.socketEnabled = false;
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
    this.isSocketConnected = false;
  }
  
  // Update methods to work without socket
  
  private registerAsGuest(): void {
    if (!this.socketEnabled) {
      // Generate a local guest ID if socket is not available
      const localGuestId = `guest-${Math.random().toString(36).substring(2, 10)}`;
      this.guestId = localGuestId;
      localStorage.setItem('guestId', this.guestId);
      this.logger.debug(`Created local guest ID: ${this.guestId}`);
      return;
    }
    
    if (!this.socket || !this.isSocketConnected) {
      this.logger.warn('Cannot register as guest: socket not connected');
      return;
    }
    
    // Check for existing guest ID in localStorage
    const storedGuestId = localStorage.getItem('guestId');
    if (storedGuestId) {
      this.guestId = storedGuestId;
      this.logger.debug(`Using stored guest ID: ${this.guestId}`);
    } else {
      // Request a new guest ID
      this.socket.emit('registerGuest');
    }
  }

  // User state methods
  loadUserState(): Observable<ImportedUserState> {
    this.logger.debug('Loading user state');
    return this.http.get<ImportedUserState>(`${this.apiUrl}/loadUserState`).pipe(
      catchError(this.handleError.bind(this))
    );
  }
  
  setUserState(state: ImportedUserState): Observable<void> {
    this.logger.debug('Setting user state', { state });
    return this.http.post<void>(`${this.apiUrl}/setUserState`, state).pipe(
      catchError(this.handleError.bind(this))
    );
  }
  
  saveStateData(key: string, value: string): Observable<void> {
    this.logger.debug(`Saving state data - ${key}: ${value}`);
    return this.http.post<void>(`${this.apiUrl}/saveStateData`, { key, value }).pipe(
      catchError(this.handleError.bind(this))
    );
  }
  
  loadStateData(key: string): Observable<string> {
    this.logger.debug(`Loading state data - ${key}`);
    return this.http.get<string>(`${this.apiUrl}/loadStateData/${key}`).pipe(
      catchError(this.handleError.bind(this))
    );
  }
  
  // Document management
  setOpenedDocument(document: string): Observable<Document[]> {
    this.logger.debug(`Setting opened document: ${document}`);
    if (!this.openedDocuments.some(doc => doc.name === document)) {
      const color = this.documentColors[this.openedDocuments.length % this.documentColors.length];
      this.openedDocuments.push({ name: document, color });
      return this.saveOpenedDocuments().pipe(
        map(() => this.openedDocuments),
        catchError(this.handleError.bind(this))
      );
    }
    return of(this.openedDocuments);
  }

  setOpenedDocuments(documents: string[]): Observable<Document[]> {
    documents.forEach(document => {
      if (!this.openedDocuments.some(doc => doc.name === document)) {
        const color = this.documentColors[this.openedDocuments.length % this.documentColors.length];
        this.openedDocuments.push({ name: document, color });
      }
    });
    return this.saveOpenedDocuments().pipe(
      map(() => this.openedDocuments),
      catchError(this.handleError)
    );
  }

  getOpenedDocuments(): Document[] {
    if (this.openedDocuments.length === 0) {
      this.loadOpenedDocuments().subscribe(docs => {
        this.openedDocuments = docs.map((doc, index) => ({
          name: doc,
          color: this.documentColors[index % this.documentColors.length]
        }));
        console.log('STATE: Loaded opened documents:', this.openedDocuments);
      });
    }
    return this.openedDocuments;
  }

  // User session tracking
  setLoginDateTime(dateTime: Date): Observable<void> {
    const dto: LoginDateTimeDTO = { dateTime: dateTime.toISOString() };
    
    // Send via socket if connected and enabled
    if (this.socketEnabled && this.isSocketConnected && this.socket) {
      this.socket.emit('updateLoginTime', dto);
    }
    
    // Always send via HTTP API
    return this.http.post<void>(`/api/user/saveLoginDateTime`, dto).pipe(
      catchError(error => {
        this.logger.error('Failed to save login date/time via HTTP', error);
        return of(void 0); // Continue even if HTTP fails
      })
    );
  }

  getLoginDateTime(): Date | null {
    this.loadLoginDateTime().subscribe(dateTime => {
      this.loginDateTime = dateTime;
      console.log('STATE: Loaded login date/time:', this.loginDateTime);
    });
    return this.loginDateTime;
  }

  setVisitLength(length: number): void {
    // Only update if the difference is significant (e.g., more than 1 second)
    if (Math.abs(length - (this.lastSavedTime || 0)) >= 1000) {
      this.lastSavedTime = length;
      this.visitLengthSubject.next(length);
      
      // Send via socket if connected and enabled
      if (this.socketEnabled && this.isSocketConnected && this.socket) {
        this.socket.emit('updateVisitLength', { length });
      }
      
      // Always send via HTTP for persistence
      this.http.post(`/api/user/saveVisitLength`, { length })
        .pipe(catchError(error => {
          this.logger.error('Failed to save visit length', error);
          return of(void 0);
        }))
        .subscribe();
    }
  }

  getVisitLength(): number | null {
    this.loadVisitLength().subscribe(length => {
      this.visitLength = length;
      console.log('STATE: Loaded visit length:', this.visitLength);
    });
    return this.visitLength;
  }

  setVisitedPage(pageName: string): Observable<void> {
    // Send via socket if connected and enabled
    if (this.socketEnabled && this.isSocketConnected && this.socket) {
      this.socket.emit('updateVisitedPage', { page: pageName });
    }
    
    // Always send via HTTP API
    return this.http.post<void>(`/api/user/saveVisitedPage/${encodeURIComponent(pageName)}`, {}).pipe(
      catchError(this.handleError)
    );
  }

  getVisitedPages(): string[] {
    this.loadVisitedPages().subscribe(pages => {
      this.visitedPages = pages;
      console.log('STATE: Loaded visited pages:', this.visitedPages);
    });
    return this.visitedPages;
  }

  // Private methods for data handling
  private saveOpenedDocuments(): Observable<void> {
    this.logger.debug('Saving opened documents', { count: this.openedDocuments.length });
    const callId = this.logger.startServiceCall('UserStateService', 'POST', '/api/files/saveOpenedDocuments');
    
    return this.api.post('/api/files/saveOpenedDocuments', this.openedDocuments).pipe(
      map(response => {
        this.logger.endServiceCall(callId, 200);
        return response;
      }),
      catchError(error => {
        this.logger.endServiceCall(callId, error.status || 500);
        return this.handleError(error);
      })
    );
  }

  private loadOpenedDocuments(): Observable<string[]> {
    console.log('STATE: Loading opened documents');
    return this.api.get('/api/files/getOpenedDocuments').pipe(
      catchError(error => {
        if (error.status === 404) {
          console.log('STATE: No opened documents found, returning empty array.');
          return of([]);
        } else {
          return this.handleError(error);
        }
      })
    );
  }

  private saveLoginDateTime(): Observable<void> {
    console.log('STATE: Saving login date/time:', this.loginDateTime);
    return this.api.post('/api/user/saveLoginDateTime', { dateTime: this.loginDateTime?.toISOString() }).pipe(
      catchError(this.handleError)
    );
  }

  private loadLoginDateTime(): Observable<Date> {
    console.log('STATE: Loading login date/time');
    return this.api.get('/api/user/getLoginDateTime').pipe(
      catchError(this.handleError)
    );
  }

  private saveVisitLength(): Observable<void> {
    console.log('STATE: Saving visit length:', this.visitLength);
    return this.api.post('/api/user/saveVisitLength', { length: this.visitLength }).pipe(
      catchError(this.handleError)
    );
  }

  private loadVisitLength(): Observable<number> {
    console.log('STATE: Loading visit length');
    return this.api.get('/api/user/getVisitLength').pipe(
      catchError(this.handleError)
    );
  }

  private saveVisitedPages(): Observable<void> {
    console.log('STATE: Saving visited pages:', this.visitedPages);
    return this.api.post('/api/user/saveVisitedPages', this.visitedPages).pipe(
      catchError(this.handleError)
    );
  }

  private loadVisitedPages(): Observable<string[]> {
    console.log('STATE: Loading visited pages');
    return this.api.get('/api/user/getVisitedPages').pipe(
      catchError(this.handleError)
    );
  }

  private handleError(error: any): Observable<never> {
    this.logger.error('User state service error', error);
    return throwError(() => error);
  }

  getCurrentUser(): Observable<ImportedUserState> {
    console.log('STATE: Getting current user');
    return this.api.get('/api/user/getCurrentUser').pipe(
      catchError(this.handleError)
    );
  }

  /**
   * Fetches all users from the system
   * @returns Observable<User[]> - Array of users
   */
  getAllUsers(): Observable<any[]> {
    console.log('STATE: Getting all users');
    return this.api.get('/api/user/getAllUsers').pipe(
      catchError(this.handleError)
    );
  }
}
