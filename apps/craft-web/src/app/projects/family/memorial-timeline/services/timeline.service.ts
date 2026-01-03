import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { webSocket, WebSocketSubject } from 'rxjs/webSocket';
import { BehaviorSubject, Observable, of, EMPTY } from 'rxjs';
import { catchError, tap, scan, shareReplay } from 'rxjs/operators';
import { TimelineEvent } from '../models/timeline-event.model';
import { AuthService } from '../../../../common/services/auth/auth.service';
import { LoggerService } from '../../../../common/services/logger.service';
import { environment } from '../../../../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class TimelineService {

  private readonly API_URL = `${environment.apiUrl}/api/timeline`;

  private readonly WS_URL = `${environment.socket.url}/timeline`;

  private eventsSubject = new BehaviorSubject<TimelineEvent[]>([]);
  public events$ = this.eventsSubject.asObservable().pipe(shareReplay(1));

  private socket$?: WebSocketSubject<TimelineEvent>;
  private messagesSubject = new BehaviorSubject<TimelineEvent[]>([]);

  constructor(
    private http: HttpClient,
    private authService: AuthService,
    private logger: LoggerService,
  ) {}

  ngOnInit?(): void {

    console.log('[TimelineService] initialized', { apiUrl: this.API_URL, wsUrl: this.WS_URL });
  }

  connect(): void {
    if (!this.socket$ || this.socket$.closed) {
      console.log('[TimelineService] connect() called — creating WebSocket');
      this.socket$ = this.getNewWebSocket();

      this.socket$
        .pipe(
          tap(message => this.logger.info('Received timeline event', message)),
          catchError((error): Observable<TimelineEvent> => {
            this.logger.error('Socket error:', error);
            return EMPTY as unknown as Observable<TimelineEvent>;
          }),

          scan((acc: TimelineEvent[], event: TimelineEvent) => [...acc, event], []),
        )
        .subscribe(events => {
          console.log(`[TimelineService] Received ${events.length} events from WebSocket`);

          this.messagesSubject.next(events);

          const currentEvents = this.eventsSubject.value;
          const newEvents = [...currentEvents, ...events.filter(event => !currentEvents.some(e => e.id === event.id))];

          this.eventsSubject.next(newEvents);
          console.log(`[TimelineService] eventsSubject updated — total events: ${newEvents.length}`);
        });
    }
  }

  disconnect(): void {
    if (this.socket$) {
      this.socket$.complete();
    }
  }

  loadInitialEvents(): Observable<TimelineEvent[]> {
    return this.http.get<TimelineEvent[]>(this.API_URL).pipe(
      tap(events => {
        console.log(`[TimelineService] Loaded initial events from ${this.API_URL}: ${Array.isArray(events) ? events.length : 0}`);
        this.eventsSubject.next(events);
      }),
      catchError(error => {
        this.logger.error('Error loading timeline events', error);
        return of([]);
      }),
    );
  }

  private getNewWebSocket(): WebSocketSubject<TimelineEvent> {
    return webSocket<TimelineEvent>({
      url: this.WS_URL,
      openObserver: {
        next: () => {
          this.logger.info('Timeline WebSocket connection opened');
          console.log('[TimelineService] WebSocket opened', { url: this.WS_URL });
        },
      },
      closeObserver: {
        next: () => {
          this.logger.info('Timeline WebSocket connection closed');
          console.log('[TimelineService] WebSocket closed', { url: this.WS_URL });
        },
      },
    });
  }
}
