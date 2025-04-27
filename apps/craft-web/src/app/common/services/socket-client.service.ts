import { Injectable } from '@angular/core';
import { io, Socket } from 'socket.io-client';
import { environment } from '../../../environments/environment';
import { BehaviorSubject, Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class SocketClientService {
  private socket: Socket;
  private connectionStatus = new BehaviorSubject<boolean>(false);

  constructor() {
    // Use the backend API server for socket connection
    // For dev: ws://localhost:3000, for prod: use your prod backend URL
    const socketUrl =
      environment.production
        ? 'https://jeffreysanford.us' // or your prod backend
        : 'http://localhost:3000';

    this.socket = io(socketUrl, {
      path: '/socket.io',
      transports: ['websocket'],
      autoConnect: true,
      withCredentials: true
    });

    this.socket.on('connect', () => this.connectionStatus.next(true));
    this.socket.on('disconnect', () => this.connectionStatus.next(false));
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
