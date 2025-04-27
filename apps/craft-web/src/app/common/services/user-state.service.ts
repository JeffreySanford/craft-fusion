import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError, of, Subject, debounceTime } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { ApiService } from './api.service';
import { UserState as IUserState, LoginDateTimeDTO, UserState as ImportedUserState } from '../interfaces/user-state.interface';
import { LoggerService } from './logger.service';
import { environment } from '../../../environments/environment';
import { SocketClientService } from './socket-client.service';

interface Document {
  name: string;
  color: string;
}

export class User {
  username = '';
}

export class UserStateModel extends User implements IUserState {
  loginDateTime: Date | null = null;
  visitLength: number | null = 0;
  visitedPages: string[] = [];
  username = '';
}

export class AppUserState extends UserStateModel { }

export class LoginDateTime implements LoginDateTimeDTO {
  dateTime: string = '';
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

  constructor(
    private api: ApiService, 
    private http: HttpClient,
    private logger: LoggerService,
    private socketClient: SocketClientService // Inject socket client
  ) {
    this.logger.registerService('UserStateService');
    this.logger.info('UserStateService initialized');
    
    // Setup debounced visit length updates
    this.visitLengthSubject.pipe(
      debounceTime(this.DEBOUNCE_TIME)
    ).subscribe(length => {
      this.saveStateData('visitLength', length.toString());
    });

    // Listen for real-time updates
    this.socketClient.on<any>('user:state:update').subscribe(state => {
      this.logger.info('Received real-time user state update', state);
      // Update local state as needed
    });
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
    const dto: LoginDateTimeDTO = { dateTime: dateTime.toISOString() };
    return this.http.post<void>(`${this.apiUrl}/saveLoginDateTime`, dto);
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
    return this.http.post<void>(`${this.apiUrl}/saveVisitedPage/${pageName}`, null);
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
    
    return this.api.post<Document[], void>('/api/files/saveOpenedDocuments', this.openedDocuments).pipe(
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
    return this.api.get<string[]>('/api/files/getOpenedDocuments').pipe(
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
    return this.api.post<{ dateTime: string | undefined }, void>('/api/user/saveLoginDateTime', { dateTime: this.loginDateTime?.toISOString() }).pipe(
      catchError(this.handleError)
    );
  }

  private loadLoginDateTime(): Observable<Date> {
    console.log('STATE: Loading login date/time');
    return this.api.get<Date>('/api/user/getLoginDateTime').pipe(
      catchError(this.handleError)
    );
  }

  private saveVisitLength(): Observable<void> {
    console.log('STATE: Saving visit length:', this.visitLength);
    return this.api.post<{ length: number | null }, void>('/api/user/saveVisitLength', { length: this.visitLength }).pipe(
      catchError(this.handleError)
    );
  }

  private loadVisitLength(): Observable<number> {
    console.log('STATE: Loading visit length');
    return this.api.get<number>('/api/user/getVisitLength').pipe(
      catchError(this.handleError)
    );
  }

  private saveVisitedPages(): Observable<void> {
    console.log('STATE: Saving visited pages:', this.visitedPages);
    return this.api.post<string[], void>('/api/user/saveVisitedPages', this.visitedPages).pipe(
      catchError(this.handleError)
    );
  }

  private loadVisitedPages(): Observable<string[]> {
    console.log('STATE: Loading visited pages');
    return this.api.get<string[]>('/api/user/getVisitedPages').pipe(
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

  getCurrentUser(): Observable<ImportedUserState> {
    return this.api.get<ImportedUserState>('/users/getCurrentUser').pipe(
      catchError(this.handleError.bind(this))
    );
  }

  /**
   * Fetches all users from the system
   * @returns Observable<User[]> - Array of users
   */
  getAllUsers(): Observable<User[]> {
    // Remove the 'api/' prefix since ApiService already adds '/api/'
    return this.api.get<User[]>('users').pipe(
      catchError(this.handleError.bind(this))
    );
  }
}
