import {
  WebSocketGateway,
  OnGatewayInit,
  OnGatewayConnection,
  OnGatewayDisconnect,
  WebSocketServer,
  SubscribeMessage,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { instrument } from '@socket.io/admin-ui';
import { LoggingService } from '../logging/logging.service';
import { SocketService } from './socket.service';
import { UseGuards } from '@nestjs/common';
import { AuthGuard } from '../auth/auth.guard';

@WebSocketGateway({
  cors: {
    origin: ['https://admin.socket.io', 'http://localhost:4200'],
    credentials: true,
  },
})
@UseGuards(AuthGuard)
export class SocketGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer() server!: Server; // Added ! to fix initialization error
  private clientCount = 0;

  constructor(
    private logger: LoggingService,
    private socketService: SocketService
  ) {}

  afterInit(server: Server) {
    // Set up Socket.IO Admin UI
    instrument(server, {
      auth: {
        type: 'basic',
        username: 'admin',
        password: '$2b$10$heqvAkYMez.Va6Et2uXInOnkCT6/uQj1brkrbyG3LpopDklcq7ZOS', // "password" hashed
      },
      mode: process.env.NODE_ENV === 'production' ? 'production' : 'development',
    });

    // Pass server instance to socket service
    this.socketService.setServer(this.server);

    this.logger.info('WebSocket Gateway initialized', { port: process.env.PORT || 3000 });
  }

  handleConnection(client: Socket) {
    this.clientCount++;
    this.logger.info('Client connected', {
      clientId: client.id,
      totalClients: this.clientCount,
    });

    // Broadcast updated client count
    this.server.emit('clientCount', { count: this.clientCount });
    
    // Send initial metrics to new client
    client.emit('metrics:snapshot', this.socketService.getMetrics());
  }

  handleDisconnect(client: Socket) {
    this.clientCount--;
    this.logger.info('Client disconnected', {
      clientId: client.id,
      totalClients: this.clientCount,
    });

    // Broadcast updated client count
    this.server.emit('clientCount', { count: this.clientCount });
  }

  @SubscribeMessage('ping')
  handlePing(client: Socket): { event: string; data: any } {
    this.logger.debug('Received ping from client', { clientId: client.id });
    return { event: 'pong', data: { timestamp: Date.now() } };
  }
}
