import { Injectable } from '@angular/core';
import { Observable, Subject } from 'rxjs';
import { io, Socket } from 'socket.io-client';

export interface ScanProgress {
  scanId: string;
  type: 'oscal' | 'realtime' | 'sbom';
  status: 'started' | 'in-progress' | 'completed' | 'failed';
  progress: number;
  eta?: string;
  message?: string;
  data?: any;
}

@Injectable({
  providedIn: 'root'
})
export class SecurityScanService {
  private socket: Socket | null = null;
  private scanProgress$ = new Subject<ScanProgress>();

  connect(): void {
    if (this.socket?.connected) return;

    // Use localhost:3000 for development
    const socketUrl = 'http://localhost:3000';
    this.socket = io(`${socketUrl}/security-scans`, {
      transports: ['websocket', 'polling'],
      withCredentials: true
    });

    this.socket.on('scan-progress', (progress: ScanProgress) => {
      this.scanProgress$.next(progress);
    });

    this.socket.on('connect', () => {
      console.log('Connected to security scan WebSocket');
    });

    this.socket.on('disconnect', () => {
      console.log('Disconnected from security scan WebSocket');
    });
  }

  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  subscribeScan(scanId: string): void {
    if (!this.socket?.connected) {
      this.connect();
    }
    this.socket?.emit('subscribe-scan', scanId);
  }

  unsubscribeScan(scanId: string): void {
    this.socket?.emit('unsubscribe-scan', scanId);
  }

  getScanProgress(): Observable<ScanProgress> {
    return this.scanProgress$.asObservable();
  }
}
