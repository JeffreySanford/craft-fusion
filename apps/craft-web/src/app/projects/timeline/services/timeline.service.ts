import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { catchError, tap, map, shareReplay } from 'rxjs/operators';
import { io, Socket } from 'socket.io-client';
import { TimelineEvent } from '../models/timeline-event.model';
import { LoggerService } from '../../../common/services/logger.service';
import { environment } from '../../../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class TimelineService {
  private readonly API_URL = `${environment.apiUrl}/api/timeline`;

  private readonly WS_URL = `${environment.socket.url}/timeline`;

  private eventsSubject = new BehaviorSubject<TimelineEvent[]>([]);
  public events$ = this.eventsSubject.asObservable().pipe(shareReplay(1));

  private socket?: Socket;

  constructor(private http: HttpClient, private logger: LoggerService) {}

  ngOnInit?(): void {
    console.log('[TimelineService] initialized', { apiUrl: this.API_URL, wsUrl: this.WS_URL });
  }

  connect(): void {
    if (!this.socket || !this.socket.connected) {
      console.log('[TimelineService] connect() called — creating WebSocket');
      this.socket = this.getNewWebSocket();

      this.socket.on('newEvent', (event: any) => {
        this.logger.info('Received new timeline event', event);
        console.log(`[TimelineService] Received new event from WebSocket: ${event.title}`);

        const mappedEvent = this.mapApiEventToTimelineEvent(event);
        const currentEvents = this.eventsSubject.value;
        const newEvents = [...currentEvents, mappedEvent];

        this.eventsSubject.next(newEvents);
        console.log(`[TimelineService] eventsSubject updated — total events: ${newEvents.length}`);
      });

      this.socket.on('updatedEvent', (event: any) => {
        this.logger.info('Received updated timeline event', event);
        console.log(`[TimelineService] Received updated event from WebSocket: ${event.title}`);

        const mappedEvent = this.mapApiEventToTimelineEvent(event);
        const currentEvents = this.eventsSubject.value;
        const updatedEvents = currentEvents.map(e => (e.id === mappedEvent.id ? mappedEvent : e));

        this.eventsSubject.next(updatedEvents);
      });

      this.socket.on('deletedEvent', (eventId: string) => {
        this.logger.info('Received deleted timeline event', eventId);
        console.log(`[TimelineService] Received deleted event from WebSocket: ${eventId}`);

        const currentEvents = this.eventsSubject.value;
        const filteredEvents = currentEvents.filter(e => e.id !== eventId);

        this.eventsSubject.next(filteredEvents);
      });
    }
  }

  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
    }
  }

  loadInitialEvents(person?: string, type?: string): Observable<TimelineEvent[]> {
    let url = this.API_URL;
    const params: string[] = [];
    if (person && person !== 'all') {
      params.push(`person=${encodeURIComponent(person)}`);
    }
    if (type && type !== 'all') {
      params.push(`type=${encodeURIComponent(type)}`);
    }
    if (params.length) {
      url = `${url}?${params.join('&')}`;
    }

    const personLabel = person ?? 'all people';
    const typeLabel = type ?? 'any type';

    console.log(`[TimelineService] Requesting timeline events for ${personLabel} (${typeLabel}) from ${url}`);

    return this.http.get<any[]>(url).pipe(
      map((events: any[]) => events.map((event: any) => this.mapApiEventToTimelineEvent(event))),
      tap((events: TimelineEvent[]) => {
        console.log(
          `[TimelineService] Loaded initial events for ${personLabel} (${typeLabel}) from ${url}: ${Array.isArray(events) ? events.length : 0}`,
        );
        this.eventsSubject.next(events);
      }),
      catchError(error => {
        this.logger.error('Error loading timeline events', error);
        return of([]);
      }),
    );
  }

  private mapApiEventToTimelineEvent(apiEvent: any): TimelineEvent {
    return {
      id: apiEvent._id || apiEvent.id,
      title: apiEvent.title,
      date: new Date(apiEvent.date),
      description: apiEvent.description,
      imageUrl: apiEvent.imageUrl,
      actionLink: apiEvent.actionLink,
      type: apiEvent.type,
      person: apiEvent.person,
    };
  }

  private getNewWebSocket(): Socket {
    return io(this.WS_URL, {
      transports: ['websocket', 'polling'],
      withCredentials: true,
    });
  }
}
