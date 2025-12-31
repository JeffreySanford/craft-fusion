import { Injectable, Injector, OnDestroy } from '@angular/core';
import { BehaviorSubject, Observable, Subject, timer, throwError } from 'rxjs';
import { takeUntil, catchError } from 'rxjs/operators';
import { io, Socket } from 'socket.io-client';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class SocketClientService implements OnDestroy {
  private socket: Socket | null = null;
  private connectionStatus = new BehaviorSubject<boolean>(false);
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 3;
  private backoffDelay = 2000; // Start with 2 seconds
  private reconnecting = false;
  private destroy$ = new Subject<void>();
  user$ = new BehaviorSubject<unknown>(null);

  constructor(private injector: Injector) {
    this.initializeSocket();
  }

  initializeSocket(): void {
    const socketUrl = environment.socket?.url || 'ws://localhost:3000';
    console.info('Initializing socket connection to', { socketUrl });
    this.closeSocket();
    this.socket = io(socketUrl, {
      path: '/socket.io',
      transports: ['websocket', 'polling'],
      reconnectionAttempts: this.maxReconnectAttempts,
      reconnectionDelay: this.backoffDelay,
      timeout: 10000,
      autoConnect: true,
      withCredentials: true,
    });
    if (!this.socket) {
      this.handleSocketError(new Error('Socket initialization failed'));
      return;
    }
    this.socket.on('connect', () => {
      this.reconnectAttempts = 0;
      this.reconnecting = false;
      this.connectionStatus.next(true);
      console.info('Socket connected successfully', {
        id: this.socket?.id,
        namespace: this.extractNamespace(socketUrl),
      });
    });
    this.socket.on('connect_error', error => {
      this.connectionStatus.next(false);
      this.handleSocketError(error);
      if (!this.reconnecting && this.reconnectAttempts < this.maxReconnectAttempts) {
        this.attemptReconnection();
      }
    });
    this.socket.on('disconnect', reason => {
      this.connectionStatus.next(false);
      console.warn('Socket disconnected', { reason });
      if (reason === 'io server disconnect' || reason === 'transport close') {
        if (!this.reconnecting && this.reconnectAttempts < this.maxReconnectAttempts) {
          this.attemptReconnection();
        }
      }
    });
  }

  private handleSocketError(error: unknown): void {
    this.connectionStatus.next(false);
    const message = error && typeof error === 'object' && 'message' in error && typeof (error as any).message === 'string' ? (error as any).message : String(error);
    console.error('Socket error', { error: message });
  }

  private attemptReconnection(): void {
    this.reconnecting = true;
    this.reconnectAttempts++;
    const delay = Math.min(30000, this.backoffDelay * Math.pow(1.5, this.reconnectAttempts - 1));
    console.info('Attempting socket reconnection', {
      attempt: this.reconnectAttempts,
      maxAttempts: this.maxReconnectAttempts,
      delayMs: delay,
    });
    timer(delay)
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        if (this.reconnectAttempts < this.maxReconnectAttempts) {
          this.initializeSocket();
        } else {
          this.handleSocketError(new Error('Maximum socket reconnection attempts reached'));
          this.reconnecting = false;
        }
      });
  }

  private extractNamespace(url: string): string {
    const parts = url.split('/');
    return parts.length > 3 ? (parts[3] ?? 'default') : 'default';
  }

  private closeSocket(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  on<T>(event: string): Observable<T> {
    return new Observable<T>(observer => {
      if (!this.socket) {
        observer.error('Socket connection not established');
        return;
      }
      const handler = (data: T) => observer.next(data);
      const errorHandler = (error: unknown) => observer.error(error);
      this.socket.on(event, handler);
      this.socket.on('connect_error', errorHandler);
      // Teardown logic
      return () => {
        if (this.socket) {
          this.socket.off(event, handler);
          this.socket.off('connect_error', errorHandler);
        }
      };
    }).pipe(
      catchError(err => {
        this.handleSocketError(err);
        return throwError(() => err);
      }),
    );
  }

  emit(event: string, data?: unknown): void {
    if (this.socket && this.connectionStatus.value) {
      this.socket.emit(event, data);
    } else {
      console.warn('Cannot emit event, socket not connected', {
        event,
        connected: this.connectionStatus.value,
      });
    }
  }

  get isConnected$(): Observable<boolean> {
    return this.connectionStatus.asObservable();
  }

  reconnect(): void {
    if (!this.reconnecting) {
      this.reconnectAttempts = 0;
      this.initializeSocket();
    }
  }

  connect(): void {
    this.initializeSocket();
  }

  ngOnDestroy(): void {
    this.destroy();
  }

  destroy(): void {
    this.closeSocket();
    this.destroy$.next();
    this.destroy$.complete();
  }
}
