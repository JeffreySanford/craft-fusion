import { Injectable, Injector, OnDestroy, forwardRef } from '@angular/core';
import { BehaviorSubject, Observable, Subject, timer } from 'rxjs';
import { takeUntil, retry, filter } from 'rxjs/operators';
import { io, Socket } from 'socket.io-client';
import { environment } from '../../../environments/environment';
import { ILogger, NullLogger } from '../models/logger.interface';
import { LoggerService } from './logger.service';

@Injectable({ providedIn: 'root' })
export class SocketClientService implements OnDestroy {
  private socket: Socket | null = null;
  private connectionStatus = new BehaviorSubject<boolean>(false);
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 3;
  private backoffDelay = 2000; // Start with 2 seconds
  private reconnecting = false;
  private destroy$ = new Subject<void>();
  
  // Use a private logger accessor to break the circular dependency
  private _logger: ILogger = new NullLogger();
  private loggerInitialized = false;

  constructor(private injector: Injector) {
    // Defer logger initialization to break circular dependency
    setTimeout(() => this.initLogger(), 0);
    this.initializeSocket();
  }    private initLogger(): void {
    try {
      // Get LoggerService from injector after initialization to break circular dependency
      this._logger = this.injector.get(forwardRef(() => LoggerService));
      this.loggerInitialized = true;
    } catch (e) {
      console.warn('Could not inject LoggerService, using NullLogger instead');
    }
  }
  private initializeSocket(): void {
    try {
      // Use the proper socket URL from environment config or fallback to a direct connection to the Nest server
      const socketUrl = environment.socket?.url || 'ws://localhost:3000';
  
      // Use safe logging to avoid circular dependency
      this.log('info', 'Initializing socket connection to', { 
        socketUrl: socketUrl
      });
      
      // Close any existing connection
      this.closeSocket();
      
      // Create new socket connection with better options
      this.socket = io(socketUrl, {
        path: '/socket',
        transports: ['websocket', 'polling'], // Try websocket first, then fallback to polling
        reconnectionAttempts: this.maxReconnectAttempts,
        reconnectionDelay: this.backoffDelay,
        timeout: 10000, // 10 second connection timeout
        autoConnect: true,
        withCredentials: true
      });      // Set up event listeners
      this.socket.on('connect', () => {
        this.reconnectAttempts = 0;
        this.reconnecting = false;
        this.connectionStatus.next(true);
        this.log('info', 'Socket connected successfully', { 
          id: this.socket?.id,
          namespace: this.extractNamespace(socketUrl)
        });
      });      this.socket.on('connect_error', (error) => {
        this.connectionStatus.next(false);
        this.log('error', 'Socket connection error', { error: error.message });
        
        if (!this.reconnecting && this.reconnectAttempts < this.maxReconnectAttempts) {
          this.attemptReconnection();
        }
      });      this.socket.on('disconnect', (reason) => {
        this.connectionStatus.next(false);
        this.log('warn', 'Socket disconnected', { reason });
        
        // If the disconnect was unintentional, try to reconnect
        if (reason === 'io server disconnect' || reason === 'transport close') {
          if (!this.reconnecting && this.reconnectAttempts < this.maxReconnectAttempts) {
            this.attemptReconnection();
          }
        }
      });    } catch (error) {
      this.log('error', 'Error initializing socket', { error });
    }
  }
    private attemptReconnection(): void {
    this.reconnecting = true;
    this.reconnectAttempts++;
    
    const delay = Math.min(30000, this.backoffDelay * Math.pow(1.5, this.reconnectAttempts - 1));
    
    this.log('info', 'Attempting socket reconnection', {
      attempt: this.reconnectAttempts,
      maxAttempts: this.maxReconnectAttempts,
      delayMs: delay
    });
    
    timer(delay)
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        if (this.reconnectAttempts < this.maxReconnectAttempts) {
          this.initializeSocket();        } else {
          this.log('error', 'Maximum socket reconnection attempts reached', {
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
      // Use the log method which safely handles logging
      this.log('warn', 'Cannot emit event, socket not connected', {
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

  /**
   * Explicitly start or restart the socket connection
   */
  connect(): void {
    this.initializeSocket();
  }
  
  // Define our own logger method to use the injected logger when available
  private log(level: 'debug' | 'info' | 'warn' | 'error', message: string, details?: any): void {
    if (this.loggerInitialized && this._logger) {
      this._logger[level](message, details, 'SocketClientService');
    } else {
      // Fallback to console if logger isn't available
      console[level](message, details);
    }
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
