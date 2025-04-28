import { 
  WebSocketGateway, 
  WebSocketServer, 
  OnGatewayConnection, 
  OnGatewayDisconnect,
  SubscribeMessage,
  WsException
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger, UseGuards } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { TimelineEvent } from './schemas/timeline-event.schema';
import { WsJwtGuard } from '../../../auth/guards/ws-jwt.guard';

@WebSocketGateway({
  namespace: 'family-timeline',
  cors: {
    origin: '*',
  },
})
export class TimelineGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;
  
  private readonly logger = new Logger(TimelineGateway.name);
  
  constructor(private readonly jwtService: JwtService) {}
  
  async handleConnection(client: Socket): Promise<void> {
    try {
      // Get token from query params or headers
      const token = 
        client.handshake.query.token as string || 
        client.handshake.headers.authorization?.split(' ')[1];
      
      if (!token) {
        this.disconnect(client, 'Unauthorized: No token provided');
        return;
      }
      
      // Verify JWT
      const payload = this.jwtService.verify(token);
      
      // Check if user has family role
      if (!payload.roles || !payload.roles.includes('family')) {
        this.disconnect(client, 'Forbidden: Missing required role');
        return;
      }
      
      // Store user data in socket
      client.data.user = payload;
      
      this.logger.log(`Client connected: ${client.id} (User: ${payload.username})`);
    } catch (error) {
      this.disconnect(client, `Authentication error: ${error.message}`);
    }
  }
  
  handleDisconnect(client: Socket): void {
    this.logger.log(`Client disconnected: ${client.id}`);
  }
  
  @UseGuards(WsJwtGuard)
  @SubscribeMessage('subscribeToTimeline')
  handleSubscribeToTimeline(client: Socket): void {
    this.logger.log(`Client ${client.id} subscribed to timeline events`);
  }
  
  // Method called by the controller to notify clients about new events
  notifyNewEvent(event: TimelineEvent): void {
    this.logger.log(`Broadcasting new timeline event: ${event.title}`);
    this.server.emit('timelineEvent', { event });
  }
  
  // Method called by the controller to notify clients about updated events
  notifyUpdatedEvent(event: TimelineEvent): void {
    this.logger.log(`Broadcasting updated timeline event: ${event.title}`);
    this.server.emit('timelineEvent', { event });
  }
  
  // Method called by the controller to notify clients about removed events
  notifyRemovedEvent(eventId: string): void {
    this.logger.log(`Broadcasting removed timeline event: ${eventId}`);
    this.server.emit('timelineEventRemoved', { eventId });
  }
  
  private disconnect(client: Socket, reason: string): void {
    this.logger.warn(`Disconnecting client ${client.id}: ${reason}`);
    client.emit('error', { message: reason });
    client.disconnect();
  }
}
