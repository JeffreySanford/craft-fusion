import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  ConnectedSocket,
  MessageBody,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger, UseGuards } from '@nestjs/common';
import { RbacGuard, Roles } from '../auth/rbac.guard';

@WebSocketGateway({
  cors: {
    origin: '*',
    credentials: true
  }
})
export class SocketGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server!: Server;

  private readonly logger = new Logger(SocketGateway.name);
  private activeSessions = new Map<string, { userId: number | string, role: string }>();

  constructor() {
    this.logger.log('Socket Gateway initialized');
    console.log('WebSocket gateway ready for connections');
  }

  handleConnection(client: Socket): void {
    this.logger.debug(`Client connected: ${client.id}`);
    console.log(`Socket connection established: ${client.id}`);
    
    // Get auth token from handshake
    const token = client.handshake.auth?.token;
    
    if (token) {
      // In a real app, verify token here and get user info
      this.activeSessions.set(client.id, { userId: 0, role: 'guest' });
    } else {
      // No token, treat as guest
      this.activeSessions.set(client.id, { userId: `guest-${client.id.substring(0, 8)}`, role: 'guest' });
    }
  }

  handleDisconnect(client: Socket): void {
    this.logger.debug(`Client disconnected: ${client.id}`);
    console.log(`Socket connection closed: ${client.id}`);
    this.activeSessions.delete(client.id);
  }

  @SubscribeMessage('registerGuest')
  handleRegisterGuest(@ConnectedSocket() client: Socket): void {
    const guestId = `guest-${Math.random().toString(36).substring(2, 10)}`;
    
    this.logger.debug(`Registering guest: ${guestId}`);
    console.log(`New guest registered: ${guestId}`);
    
    // Update session info
    this.activeSessions.set(client.id, { userId: guestId, role: 'guest' });
    
    // Emit guestRegistered event back to the client
    client.emit('guestRegistered', { guestId });
  }

  @SubscribeMessage('updateLoginTime')
  handleUpdateLoginTime(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: { dateTime: string }
  ): void {
    const session = this.activeSessions.get(client.id);
    this.logger.debug(`Login time update received: ${payload.dateTime} for ${session?.userId || 'unknown'}`);
    console.log(`Login time update: ${session?.userId}, Time: ${payload.dateTime}`);
  }

  @SubscribeMessage('updateVisitLength')
  handleUpdateVisitLength(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: { length: number }
  ): void {
    const session = this.activeSessions.get(client.id);
    this.logger.debug(`Visit length update received: ${payload.length}ms for ${session?.userId || 'unknown'}`);
    console.log(`Visit length update: ${session?.userId}, Length: ${payload.length}ms`);
  }

  // Method to broadcast state changes to relevant clients
  broadcastStateChange(change: { userId: number | string, type: string, data: any }): void {
    this.logger.debug(`Broadcasting ${change.type} change for user ${change.userId}`);
    
    // Find all client IDs associated with this user
    const clientIds = Array.from(this.activeSessions.entries())
      .filter(([_, session]) => session.userId === change.userId)
      .map(([clientId]) => clientId);
    
    // Broadcast to those clients
    clientIds.forEach(clientId => {
      const client = this.server.sockets.sockets.get(clientId);
      if (client) {
        client.emit(change.type, change.data);
        console.log(`Emitted ${change.type} to client ${clientId}`);
      }
    });
  }

  // Broadcast to all clients with a specific role
  broadcastToRole(role: string, event: string, data: any): void {
    this.logger.debug(`Broadcasting ${event} to all ${role} users`);
    console.log(`Role broadcast: ${event}, Role: ${role}`);
    
    // Find all client IDs with the specified role
    const clientIds = Array.from(this.activeSessions.entries())
      .filter(([_, session]) => session.role === role)
      .map(([clientId]) => clientId);
    
    // Broadcast to those clients
    clientIds.forEach(clientId => {
      const client = this.server.sockets.sockets.get(clientId);
      if (client) {
        client.emit(event, data);
      }
    });
  }
}
