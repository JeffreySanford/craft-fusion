import { Injectable, OnDestroy } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, of, Subject } from 'rxjs';
import { catchError, takeUntil, tap } from 'rxjs/operators';
import { LoggerService } from './logger.service';
import { Document } from '../../projects/book/book.component';
import { SocketClientService } from './socket-client.service';
import { ApiService } from './api.service';

@Injectable({
  providedIn: 'root'
})
export class UserStateService implements OnDestroy {
  private openedDocumentsSubject = new BehaviorSubject<Document[]>([]);
  private loginDateTimeSubject = new BehaviorSubject<Date | null>(null);
  private visitLengthSubject = new BehaviorSubject<number | null>(null);
  private visitedPagesSubject = new BehaviorSubject<string[]>([]);
  private destroy$ = new Subject<void>();

  // Expose observables for components to subscribe
  readonly openedDocuments$ = this.openedDocumentsSubject.asObservable();
  readonly loginDateTime$ = this.loginDateTimeSubject.asObservable();
  readonly visitLength$ = this.visitLengthSubject.asObservable();
  readonly visitedPages$ = this.visitedPagesSubject.asObservable();

  constructor(
    private socketClient: SocketClientService,
    private logger: LoggerService,
    private api: ApiService
  ) {
    // Initialize login time if not set
    if (!this.loginDateTimeSubject.value) {
      this.setLoginDateTime(new Date());
    }
    
    // Connect to the user-state namespace
    this.initializeSocketConnection();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private initializeSocketConnection(): void {
    // Create a connection to the user-state namespace
    const userStateSocket = this.socketClient;
    
    // Subscribe to socket events to update state
    userStateSocket.on<{ dateTime: string }>('loginDateTimeUpdated')
      .pipe(takeUntil(this.destroy$))
      .subscribe(data => {
        this.loginDateTimeSubject.next(new Date(data.dateTime));
        this.logger.debug('Received login time update via socket', { dateTime: data.dateTime });
      });
    
    userStateSocket.on<{ length: number }>('visitLengthUpdated')
      .pipe(takeUntil(this.destroy$))
      .subscribe(data => {
        this.visitLengthSubject.next(data.length);
        this.logger.debug('Received visit length update via socket', { length: data.length });
      });
    
    userStateSocket.on<{ pages: string[] }>('visitedPagesUpdated')
      .pipe(takeUntil(this.destroy$))
      .subscribe(data => {
        this.visitedPagesSubject.next(data.pages);
        this.logger.debug('Received visited pages update via socket', { pages: data.pages });
      });
    
    userStateSocket.on<{ documents: Document[] }>('openedDocumentsUpdated')
      .pipe(takeUntil(this.destroy$))
      .subscribe(data => {
        this.openedDocumentsSubject.next(data.documents);
        this.logger.debug('Received opened documents update via socket', { documents: data.documents });
      });

    // Handle state change events
    userStateSocket.on<any>('state-change')
      .pipe(takeUntil(this.destroy$))
      .subscribe(change => {
        this.processStateChange(change);
      });
  }

  private processStateChange(change: any): void {
    switch (change.type) {
      case 'loginDateTimeUpdated':
        if (change.data?.dateTime) {
          this.loginDateTimeSubject.next(new Date(change.data.dateTime));
        }
        break;
      case 'visitLengthUpdated':
        if (change.data?.length !== undefined) {
          this.visitLengthSubject.next(change.data.length);
        }
        break;
      case 'visitedPagesUpdated':
        if (change.data?.pages) {
          this.visitedPagesSubject.next(change.data.pages);
        }
        break;
      case 'openedDocumentsUpdated':
        if (change.data?.documents) {
          this.openedDocumentsSubject.next(change.data.documents);
        }
        break;
      default:
        this.logger.debug('Received unknown state change event', { change });
    }
  }

  // Document management methods
  getOpenedDocuments(): Document[] {
    return this.openedDocumentsSubject.value;
  }

  setOpenedDocument(documentName: string): Observable<Document[]> {
    // Check if document is already open
    const currentDocs = this.openedDocumentsSubject.value;
    if (!currentDocs.some(doc => doc.name === documentName)) {
      // Add new document with default color
      const newDoc: Document = {
        name: documentName,
        color: 'Patriotic Red' // Default color
        ,
        contrast: ''
      };
      const updatedDocs = [...currentDocs, newDoc];
      this.openedDocumentsSubject.next(updatedDocs);

      // Emit via socket instead of HTTP call
      this.socketClient.emit('updateOpenedDocuments', { documents: updatedDocs });
      
      return of(updatedDocs);
    }
    
    return of(currentDocs);
  }

  setOpenedDocuments(documents: Document[]): Observable<Document[]> {
    this.openedDocumentsSubject.next(documents);
    
    // Emit via socket instead of HTTP call
    this.socketClient.emit('updateOpenedDocuments', { documents });
    
    return of(documents);
  }

  // Login time management
  getLoginDateTime(): Date | null {
    return this.loginDateTimeSubject.value;
  }

  setLoginDateTime(dateTime: Date): Observable<void> {
    this.loginDateTimeSubject.next(dateTime);
    
    // Emit via socket instead of HTTP call
    this.socketClient.emit('updateLoginTime', { dateTime: dateTime.toISOString() });
    
    return of(void 0);
  }

  // Visit length management
  getVisitLength(): number | null {
    return this.visitLengthSubject.value;
  }

  setVisitLength(length: number): Observable<void> {
    this.visitLengthSubject.next(length);
    
    // Emit via socket instead of HTTP call
    this.socketClient.emit('updateVisitLength', { length });
    
    return of(void 0);
  }

  // Visited pages management
  getVisitedPages(): string[] {
    return this.visitedPagesSubject.value;
  }

  setVisitedPage(page: string): Observable<void> {
    const currentPages = this.visitedPagesSubject.value;
    if (!currentPages.includes(page)) {
      const updatedPages = [...currentPages, page];
      this.visitedPagesSubject.next(updatedPages);
      
      // Emit via socket instead of HTTP call
      this.socketClient.emit('updateVisitedPage', { page });
      
      return of(void 0);
    }
    
    return of(void 0);
  }

  // Fallback methods for when socket is not available
  private saveOpenedDocuments(documents: Document[]): Observable<void> {
    return this.api.post<{documents: Document[]}, void>('/api/files/saveOpenedDocuments', { documents })
      .pipe(
        catchError(error => {
          this.logger.error('Error saving documents to backend', { error });
          return of(void 0);
        })
      );
  }
}
