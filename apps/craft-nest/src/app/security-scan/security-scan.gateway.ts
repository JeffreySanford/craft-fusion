import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Injectable } from '@nestjs/common';

export interface ScanProgress {
  scanId: string;
  type: 'oscal' | 'realtime' | 'sbom';
  status: 'started' | 'in-progress' | 'completed' | 'failed';
  progress: number; // 0-100
  eta?: string;
  message?: string;
  data?: any;
}

@Injectable()
@WebSocketGateway({
  cors: {
    origin: '*',
    credentials: true,
  },
  namespace: '/security-scans',
})
export class SecurityScanGateway {
  @WebSocketServer()
  server!: Server;

  private activeScans = new Map<string, ScanProgress>();

  /**
   * Client subscribes to scan updates
   */
  @SubscribeMessage('subscribe-scan')
  handleSubscribeScan(
    @MessageBody() scanId: string,
    @ConnectedSocket() client: Socket,
  ): void {
    client.join(`scan-${scanId}`);
    
    // Send current status if scan exists
    const scan = this.activeScans.get(scanId);
    if (scan) {
      client.emit('scan-progress', scan);
    }
  }

  /**
   * Client unsubscribes from scan updates
   */
  @SubscribeMessage('unsubscribe-scan')
  handleUnsubscribeScan(
    @MessageBody() scanId: string,
    @ConnectedSocket() client: Socket,
  ): void {
    client.leave(`scan-${scanId}`);
  }

  /**
   * Emit progress update to all subscribers
   */
  emitProgress(progress: ScanProgress): void {
    this.activeScans.set(progress.scanId, progress);
    this.server.to(`scan-${progress.scanId}`).emit('scan-progress', progress);
  }

  /**
   * Mark scan as completed and emit final results
   */
  completeScan(scanId: string, data?: any): void {
    const scan = this.activeScans.get(scanId);
    if (scan) {
      scan.status = 'completed';
      scan.progress = 100;
      scan.data = data;
      this.emitProgress(scan);
      
      // Clean up after 5 minutes
      setTimeout(() => {
        this.activeScans.delete(scanId);
      }, 5 * 60 * 1000);
    }
  }

  /**
   * Mark scan as failed
   */
  failScan(scanId: string, error: string): void {
    const scan = this.activeScans.get(scanId);
    if (scan) {
      scan.status = 'failed';
      scan.message = error;
      this.emitProgress(scan);
      
      // Clean up after 5 minutes
      setTimeout(() => {
        this.activeScans.delete(scanId);
      }, 5 * 60 * 1000);
    }
  }

  /**
   * Get scan status
   */
  getScanStatus(scanId: string): ScanProgress | undefined {
    return this.activeScans.get(scanId);
  }

  /**
   * Create a new scan tracker
   */
  createScan(scanId: string, type: ScanProgress['type']): void {
    const scan: ScanProgress = {
      scanId,
      type,
      status: 'started',
      progress: 0,
      message: 'Initializing scan...',
    };
    this.activeScans.set(scanId, scan);
    this.emitProgress(scan);
  }
}
