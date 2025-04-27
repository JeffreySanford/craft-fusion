import { Injectable } from '@angular/core';
import { io, Socket } from 'socket.io-client';
import { environment } from '../../../environments/environment';
import { BehaviorSubject, Observable } from 'rxjs';
import { LoggerService } from './logger.service';

@Injectable({ providedIn: 'root' })
export class SocketClientService {
  private socket: Socket;
  private connectionStatus = new BehaviorSubject<boolean>(false);

  constructor(private logger: LoggerService) {
    // Use the backend API server for socket connection
    const socketUrl = environment.production
      ? 'https://jeffreysanford.us' // or your prod backend
      : 'http://localhost:3000';

    this.logger.info('Initializing socket connection to', { socketUrl });
    
    this.socket = io(socketUrl, {
      path: '/socket.io',
      transports: ['websocket'],
      autoConnect: true,
      withCredentials: true
    });

    this.socket.on('connect', () => {
      this.connectionStatus.next(true);
      this.logger.info('Socket connected successfully', { 
        id: this.socket.id,
        // Extract namespace from socketUrl path if present
        namespace: socketUrl.includes('/') && socketUrl.split('/').length > 3 ? 
          socketUrl.split('/')[3] : 'default'
      });
    });

    this.socket.on('connect_error', (error) => {
      this.logger.error('Socket connection error', { error: error.message });
      this.connectionStatus.next(false);
    });

    this.socket.on('disconnect', (reason) => {
      this.connectionStatus.next(false);
      this.logger.warn('Socket disconnected', { reason });
    });
  }

  on<T>(event: string): Observable<T> {
    return new Observable<T>(observer => {
      this.socket.on(event, (data: T) => observer.next(data));
      return () => this.socket.off(event);
    });
  }

  emit(event: string, data?: any): void {
    this.socket.emit(event, data);
  }

  get isConnected$(): Observable<boolean> {
    return this.connectionStatus.asObservable();
  }
}
