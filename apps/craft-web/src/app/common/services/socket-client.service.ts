import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, Subject, timer } from 'rxjs';
import { LoggerService } from './logger.service';
import { takeUntil, retry, filter } from 'rxjs/operators';
import { io, Socket } from 'socket.io-client';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class SocketClientService {
  private socket: Socket | null = null;
  private connectionStatus = new BehaviorSubject<boolean>(false);
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 3;
  private backoffDelay = 2000; // Start with 2 seconds
  private reconnecting = false;
  private destroy$ = new Subject<void>();

  constructor(private logger: LoggerService) {
    this.initializeSocket();
  }

  private initializeSocket(): void {
    try {
      // Use the proper socket URL from environment config or fallback to a direct connection to the Nest server
      const socketUrl = environment.socket?.url || 'ws://localhost:3000';
  
      this.logger.info('Initializing socket connection to', { 
        socketUrl: socketUrl
      });
      
      // Close any existing connection
      this.closeSocket();
      
      // Create new socket connection with better options
      this.socket = io(socketUrl, {
        path: '/socket.io',
        transports: ['websocket', 'polling'], // Try websocket first, then fallback to polling
        reconnectionAttempts: this.maxReconnectAttempts,
        reconnectionDelay: this.backoffDelay,
        timeout: 10000, // 10 second connection timeout
        autoConnect: true,
        withCredentials: true
      });
  
      // Set up event listeners
      this.socket.on('connect', () => {
        this.reconnectAttempts = 0;
        this.reconnecting = false;
        this.connectionStatus.next(true);
        this.logger.info('Socket connected successfully', { 
          id: this.socket?.id,
          namespace: this.extractNamespace(socketUrl)
        });
      });
  
      this.socket.on('connect_error', (error) => {
        this.connectionStatus.next(false);
        this.logger.error('Socket connection error', { error: error.message });
        
        if (!this.reconnecting && this.reconnectAttempts < this.maxReconnectAttempts) {
          this.attemptReconnection();
        }
      });
  
      this.socket.on('disconnect', (reason) => {
        this.connectionStatus.next(false);
        this.logger.warn('Socket disconnected', { reason });
        
        // If the disconnect was unintentional, try to reconnect
        if (reason === 'io server disconnect' || reason === 'transport close') {
          if (!this.reconnecting && this.reconnectAttempts < this.maxReconnectAttempts) {
            this.attemptReconnection();
          }
        }
      });
    } catch (error) {
      this.logger.error('Error initializing socket', { error });
    }
  }
  
  private attemptReconnection(): void {
    this.reconnecting = true;
    this.reconnectAttempts++;
    
    const delay = Math.min(30000, this.backoffDelay * Math.pow(1.5, this.reconnectAttempts - 1));
    
    this.logger.info('Attempting socket reconnection', {
      attempt: this.reconnectAttempts,
      maxAttempts: this.maxReconnectAttempts,
      delayMs: delay
    });
    
    timer(delay)
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        if (this.reconnectAttempts < this.maxReconnectAttempts) {
          this.initializeSocket();
        } else {
          this.logger.error('Maximum socket reconnection attempts reached', {
            attempts: this.reconnectAttempts
          });
          this.reconnecting = false;
        }
      });
  }
  
  private extractNamespace(url: string): string {
    return url.includes('/') && url.split('/').length > 3 ? 
      url.split('/')[3] : 'default';
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
      
      this.socket.on(event, (data: T) => {
        observer.next(data);
      });
      
      return () => {
        if (this.socket) {
          this.socket.off(event);
        }
      };
    });
  }

  emit(event: string, data?: any): void {
    if (this.socket && this.connectionStatus.value) {
      this.socket.emit(event, data);
    } else {
      this.logger.warn('Cannot emit event, socket not connected', {
        event,
        connected: this.connectionStatus.value
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
  
  destroy(): void {
    this.closeSocket();
    this.destroy$.next();
    this.destroy$.complete();
  }
}
