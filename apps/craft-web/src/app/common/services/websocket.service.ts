import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, timer } from 'rxjs';
import { LoggerService } from './logger.service';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class WebsocketService {
  private socket: WebSocket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private baseReconnectDelay = 1000;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;

  private connectionStatusSubject = new BehaviorSubject<boolean>(false);
  public connectionStatus$ = this.connectionStatusSubject.asObservable();

  private messageSubject = new BehaviorSubject<unknown>(null);
  public messages$ = this.messageSubject.asObservable();

  constructor(private logger: LoggerService) {}

  connect(): void {
    // If already connected or attempting connection, do nothing
    if (this.socket && (this.socket.readyState === WebSocket.CONNECTING || this.socket.readyState === WebSocket.OPEN)) {
      return;
    }

    // Clean up any existing socket
    this.disconnect();

    try {
      const wsUrl = environment.production
        ? `wss://${window.location.host}/socket/?EIO=4&transport=websocket`
        : `ws://${window.location.hostname}:4200/socket/?EIO=4&transport=websocket`;

      this.logger.debug(`Connecting to WebSocket: ${wsUrl}`);
      this.socket = new WebSocket(wsUrl);

      this.socket.onopen = () => {
        this.logger.info('WebSocket connection established');
        this.connectionStatusSubject.next(true);
        this.reconnectAttempts = 0;
      };

      this.socket.onmessage = event => {
        try {
          const data = JSON.parse(event.data);
          this.messageSubject.next(data);
        } catch (error) {
          this.logger.warn('Unable to parse WebSocket message', error);
        }
      };

      this.socket.onclose = event => {
        this.logger.warn(`WebSocket connection closed: ${event.code} - ${event.reason}`);
        this.connectionStatusSubject.next(false);
        this.attemptReconnect();
      };

      this.socket.onerror = error => {
        this.logger.error('WebSocket connection error', error);
        // Don't attempt to reconnect here - onclose will be called after an error
      };
    } catch (error) {
      this.logger.error('Error creating WebSocket connection', error);
      this.attemptReconnect();
    }
  }

  disconnect(): void {
    if (this.socket) {
      // Only log if the socket was actually connected
      if (this.socket.readyState === WebSocket.OPEN) {
        this.logger.debug('Disconnecting WebSocket');
      }

      this.socket.close();
      this.socket = null;
    }

    // Clear any pending reconnect
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }

    this.connectionStatusSubject.next(false);
  }

  send(data: unknown): boolean {
    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      try {
        this.socket.send(JSON.stringify(data));
        return true;
      } catch (error) {
        this.logger.error('Error sending WebSocket message', error);
        return false;
      }
    }
    return false;
  }

  private attemptReconnect(): void {
    // Clear any existing timer
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }

    // Check if we should try to reconnect
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      this.logger.warn(`Maximum reconnect attempts (${this.maxReconnectAttempts}) reached. Giving up.`);
      return;
    }

    // Calculate backoff delay with jitter
    const delay = this.baseReconnectDelay * Math.pow(1.5, this.reconnectAttempts) * (0.9 + Math.random() * 0.2);
    this.reconnectAttempts++;

    this.logger.debug(`Attempting to reconnect in ${Math.round(delay)}ms (attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts})`);

    this.reconnectTimer = setTimeout(() => {
      this.connect();
    }, delay);
  }
}
