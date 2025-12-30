import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { webSocket, WebSocketSubject } from 'rxjs/webSocket';
import { BehaviorSubject, Observable, of, EMPTY } from 'rxjs';
import { catchError, tap, switchMap, scan, shareReplay } from 'rxjs/operators';
import { TimelineEvent } from '../models/timeline-event.model';
import { AuthService } from '../../../../common/services/auth/auth.service';
import { LoggerService } from '../../../../common/services/logger.service';
import { environment } from '../../../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class TimelineService {
  private readonly API_URL = `${environment.apiUrl}/family/timeline`;
  private readonly WS_URL = `${environment.socket.url}/family-timeline`;
  
  private eventsSubject = new BehaviorSubject<TimelineEvent[]>([]);
  public events$ = this.eventsSubject.asObservable().pipe(shareReplay(1));
  
  private socket$?: WebSocketSubject<unknown>;
  private messagesSubject = new BehaviorSubject<TimelineEvent[]>([]);
  
  constructor(
    private http: HttpClient,
    private authService: AuthService,
    private logger: LoggerService
  ) { }
  
  /**
   * Establishes a WebSocket connection for real-time timeline updates
   */
  connect(): void {
    if (!this.socket$ || this.socket$.closed) {
      this.socket$ = this.getNewWebSocket();
      
      this.socket$.pipe(
        tap(message => this.logger.info('Received timeline event', message)),
        catchError(error => {
          this.logger.error('Socket error:', error);
          return EMPTY;
        }),
        // Use scan to accumulate events
        scan((acc: TimelineEvent[], event: TimelineEvent) => [...acc, event], [])
      ).subscribe(events => {
        // Update the messages subject with accumulated WebSocket events
        this.messagesSubject.next(events);
        
        // Combine initial events with WebSocket events and update the main subject
        const currentEvents = this.eventsSubject.value;
        const newEvents = [...currentEvents, ...events.filter(
          event => !currentEvents.some(e => e.id === event.id)
        )];
        
        this.eventsSubject.next(newEvents);
      });
    }
  }
  
  /**
   * Disconnects from the WebSocket
   */
  disconnect(): void {
    if (this.socket$) {
      this.socket$.complete();
    }
  }
  
  /**
   * Loads initial timeline events from REST API
   * Returns an Observable of timeline events
   */
  loadInitialEvents(): Observable<TimelineEvent[]> {
    return this.http.get<TimelineEvent[]>(this.API_URL).pipe(
      tap(events => this.eventsSubject.next(events)),
      catchError(error => {
        this.logger.error('Error loading timeline events', error);
        return of([]);
      })
    );
  }
  
  /**
   * Creates a new WebSocket subject with error handling
   */
  private getNewWebSocket(): WebSocketSubject<unknown> {
    return webSocket({
      url: this.WS_URL,
      openObserver: {
        next: () => this.logger.info('Timeline WebSocket connection opened')
      },
      closeObserver: {
        next: () => this.logger.info('Timeline WebSocket connection closed')
      }
    });
  }
}
