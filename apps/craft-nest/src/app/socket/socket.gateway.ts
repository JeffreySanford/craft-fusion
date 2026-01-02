import { 
  WebSocketGateway, 
  WebSocketServer, 
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
  SubscribeMessage 
} from '@nestjs/websockets';
import { Logger } from '@nestjs/common';
import { Server, Socket } from 'socket.io';
import { SocketService } from './socket.service';

@WebSocketGateway({
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  },
  transports: ['websocket', 'polling'],
})
export class SocketGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server!: Server; // Added ! for definite assignment assertion
  
  private logger = new Logger('SocketGateway');

  constructor(private socketService: SocketService) {}

  afterInit() {
    this.logger.log('Socket.IO initialized');
    this.socketService.setServer(this.server);
  }

  handleConnection(client: Socket) {
    this.logger.log(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);
  }

  @SubscribeMessage('registerGuest')
  handleRegisterGuest(client: Socket): void {
    const guestId = `guest-${Math.random().toString(36).substring(2, 10)}`;
    client.emit('guestRegistered', { guestId });
    this.logger.log(`Guest registered with ID: ${guestId}`);
  }

  @SubscribeMessage('updateLoginTime')
  handleUpdateLoginTime(_client: Socket, payload: { dateTime: string }): void {
    this.logger.log(`Login time updated: ${payload.dateTime}`);
    // Store in database if needed
  }

  @SubscribeMessage('updateVisitLength')
  handleUpdateVisitLength(_client: Socket, payload: { length: number }): void {
    this.logger.log(`Visit length updated: ${payload.length}`);
    // Store in database if needed
  }

  @SubscribeMessage('updateVisitedPage')
  handleUpdateVisitedPage(_client: Socket, payload: { page: string }): void {
    this.logger.log(`Visited page updated: ${payload.page}`);
    // Store in database if needed
  }
}
