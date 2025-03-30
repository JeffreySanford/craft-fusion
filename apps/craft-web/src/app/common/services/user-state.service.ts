import { Injectable, Inject, forwardRef } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError, of, Subject, BehaviorSubject, debounceTime } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { UserState as IUserState, LoginDateTimeDTO, UserState } from '../interfaces/user-state.interface';
import { LoggerService } from './logger.service';
import { environment } from '../../../environments/environment';
import { HttpClientWrapperService } from './http-client-wrapper.service';
import { HttpClient } from '@angular/common/http';

interface Document {
  name: string;
  color: string;
}

export interface User {
  // Define any existing properties here
}

// UserStateModel implementing the UserState interface
export class UserStateModel implements UserState {
  // Required properties from UserState
  id: string = '';
  username: string = '';
  isAdmin: boolean = false;
  roles: string[] = [];
  isAuthenticated: boolean = false;
  
  // Optional properties
  email?: string;
  preferences?: any;
  name?: string;
  displayName?: string;
  isGuest?: boolean;
  permissions?: string[];
  avatarUrl?: string;

  constructor(data: Partial<UserState> = {}) {
    this.id = data.id || '';
    this.username = data.username || '';
    this.email = data.email || '';
    this.isAdmin = data.isAdmin || false;
    this.name = data.name || '';
    this.displayName = data.displayName || '';
    this.isAuthenticated = data.isAuthenticated || false;
    this.roles = data.roles || [];
    this.isGuest = data.isGuest;
    this.preferences = data.preferences || {};
    this.permissions = data.permissions || [];
    this.avatarUrl = data.avatarUrl || '';
  }
}

@Injectable({
  providedIn: 'root'
})
export class UserStateService {
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
  private readonly DEBOUNCE_TIME = 1000; // 1 second debounce

  // Internal subject for user state
  private userStateSubject = new BehaviorSubject<UserState | null>(null);

  // Observable stream of user state
  public userState$ = this.userStateSubject.asObservable();

  constructor(
    private httpClient: HttpClientWrapperService,
    private logger: LoggerService,
    private http: HttpClient
  ) {
    this.logger.registerService('UserStateService');
    this.logger.info('UserStateService initialized');
    
    // Setup debounced visit length updates
    this.visitLengthSubject.pipe(
      debounceTime(this.DEBOUNCE_TIME)
    ).subscribe(length => {
      this.saveStateData('visitLength', length.toString());
    });
  }

  saveStateData(key: string, value: string): Observable<void> {
    this.logger.debug(`Saving state data - ${key}: ${value}`);
    return this.httpClient.post<void>(`${this.apiUrl}/saveStateData`, { key, value }).pipe(
      catchError(this.handleError.bind(this))
    );
  }

  loadStateData(key: string): Observable<string> {
    this.logger.debug(`Loading state data - ${key}`);
    return this.httpClient.get<string>(`${this.apiUrl}/loadStateData/${key}`).pipe(
      catchError(this.handleError.bind(this))
    );
  }
  loadUserState(): Observable<UserState> {
    this.logger.debug('Loading user state');
    return this.httpClient.get<UserState>(`${this.apiUrl}/loadUserState`).pipe(
      catchError(this.handleError.bind(this))
    );
  }
  setUserState(state: UserState): Observable<void> {
    this.logger.debug('Setting user state', { state });
    return this.httpClient.post<void>(`${this.apiUrl}/setUserState`, state).pipe(
      catchError(this.handleError.bind(this))
    );
  }
  
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

  setLoginDateTime(dateTime: Date): Observable<void> {
    const dto: LoginDateTimeDTO = { 
      timestamp: dateTime.toISOString(),
      formatted: dateTime.toLocaleString(),
      timeAgo: 'Just now'
    };
    return this.httpClient.post<void>(`${this.apiUrl}/saveLoginDateTime`, dto);
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
    if (Math.abs(length - this.lastSavedTime) >= 1) {
      this.lastSavedTime = length;
      this.visitLengthSubject.next(length);
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
    return this.httpClient.post<void>(`${this.apiUrl}/saveVisitedPage/${pageName}`, null);
  }

  getVisitedPages(): string[] {
    this.loadVisitedPages().subscribe(pages => {
      this.visitedPages = pages;
      console.log('STATE: Loaded visited pages:', this.visitedPages);
    });
    return this.visitedPages;
  }

  private saveOpenedDocuments(): Observable<void> {
    this.logger.debug('Saving opened documents', { count: this.openedDocuments.length });
    const callId = this.logger.startServiceCall('UserStateService', 'POST', '/api/files/saveOpenedDocuments');
    
    return this.httpClient.post<void>('/api/files/saveOpenedDocuments', this.openedDocuments).pipe(
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
    return this.httpClient.get<string[]>('/api/files/getOpenedDocuments').pipe(
      catchError(error => {
      if (error.status === 404) {
        console.log('STATE: No opened documents found, returning empty array.');
        return new Observable<string[]>(observer => {
        observer.next([]);
        observer.complete();
        });
      } else {
        return this.handleError(error);
      }
      })
    );
  }

  private saveLoginDateTime(): Observable<void> {
    console.log('STATE: Saving login date/time:', this.loginDateTime);
    return this.httpClient.post<void>('/api/user/saveLoginDateTime', { dateTime: this.loginDateTime?.toISOString() }).pipe(
      catchError(this.handleError)
    );
  }

  private loadLoginDateTime(): Observable<Date> {
    console.log('STATE: Loading login date/time');
    return this.httpClient.get<Date>('/api/user/getLoginDateTime').pipe(
      catchError(this.handleError)
    );
  }

  private saveVisitLength(): Observable<void> {
    console.log('STATE: Saving visit length:', this.visitLength);
    return this.httpClient.post<void>('/api/user/saveVisitLength', { length: this.visitLength }).pipe(
      catchError(this.handleError)
    );
  }

  private loadVisitLength(): Observable<number> {
    console.log('STATE: Loading visit length');
    return this.httpClient.get<number>('/api/user/getVisitLength').pipe(
      catchError(this.handleError)
    );
  }

  private saveVisitedPages(): Observable<void> {
    console.log('STATE: Saving visited pages:', this.visitedPages);
    return this.httpClient.post<void>('/api/user/saveVisitedPages', this.visitedPages).pipe(
      catchError(this.handleError)
    );
  }

  private loadVisitedPages(): Observable<string[]> {
    console.log('STATE: Loading visited pages');
    return this.httpClient.get<string[]>('/api/user/getVisitedPages').pipe(
      catchError(this.handleError)
    );
  }

  private handleError(error: HttpErrorResponse): Observable<never> {
    this.logger.error('An error occurred:', {
      status: error.status,
      message: error.message,
      url: error.url
    });
    return throwError('Something bad happened; please try again later.');
  }

  getCurrentUser(): Observable<UserState> {
    return this.httpClient.get<UserState>('/api/users/getCurrentUser').pipe(
      catchError(this.handleError.bind(this))
    );
  }

  /**
   * Fetches all users from the system
   * @returns Observable<User[]> - Array of users
   */
  getAllUsers(): Observable<User[]> {
    return this.httpClient.get<User[]>('/api/users').pipe(
      catchError(this.handleError.bind(this))
    );
  }
}
