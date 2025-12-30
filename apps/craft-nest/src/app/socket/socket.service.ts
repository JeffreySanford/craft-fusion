import { Injectable } from '@nestjs/common';
import { Server } from 'socket.io';
import { LoggingService } from '../logging/logging.service';

@Injectable()
export class SocketService {
  private server!: Server; // Added ! to fix initialization error
  private metrics: Record<string, any> = {};

  constructor(private logger: LoggingService) {}

  setServer(server: Server): void {
    this.server = server;
  }

  /**
   * Emit an event to all connected clients
   */
  emitToAll(event: string, data: any): void {
    if (!this.server) {
      this.logger.warn('Socket server not initialized');
      return;
    }
    this.server.emit(event, data);
    this.logger.debug(`Socket broadcast: ${event}`, { event, recipientCount: this.getClientCount() });
  }

  /**
   * Emit an event to a specific client
   */
  emitToClient(clientId: string, event: string, data: any): void {
    if (!this.server) {
      this.logger.warn('Socket server not initialized');
      return;
    }
    this.server.to(clientId).emit(event, data);
    this.logger.debug(`Socket message: ${event}`, { event, recipient: clientId });
  }

  /**
   * Get the number of connected clients
   */
  getClientCount(): number {
    if (!this.server) return 0;
    return this.server.engine.clientsCount;
  }

  /**
   * Emit an event to a specific room
   */
  emitToRoom(room: string, event: string, data: any): void {
    if (!this.server) {
      this.logger.warn('Socket server not initialized');
      return;
    }
    this.server.to(room).emit(event, data);
    this.logger.debug(`Socket room broadcast: ${event}`, { event, room });
  }

  /**
   * Add a client to a room
   */
  addToRoom(clientId: string, room: string): void {
    if (!this.server) {
      this.logger.warn('Socket server not initialized');
      return;
    }
    const socket = this.server.sockets.sockets.get(clientId);
    if (socket) {
      void socket.join(room);
      this.logger.debug(`Added client to room`, { clientId, room });
    } else {
      this.logger.warn(`Unable to add client to room: client not found`, { clientId, room });
    }
  }

  /**
   * Remove a client from a room
   */
  removeFromRoom(clientId: string, room: string): void {
    if (!this.server) {
      this.logger.warn('Socket server not initialized');
      return;
    }
    const socket = this.server.sockets.sockets.get(clientId);
    if (socket) {
      void socket.leave(room);
      this.logger.debug(`Removed client from room`, { clientId, room });
    } else {
      this.logger.warn(`Unable to remove client from room: client not found`, { clientId, room });
    }
  }

  /**
   * Store metrics for health monitoring
   */
  updateMetrics(key: string, value: any): void {
    this.metrics[key] = value;
    this.emitToAll('metrics:update', { key, value });
  }

  /**
   * Get all current metrics
   */
  getMetrics(): Record<string, any> {
    return this.metrics;
  }
}
