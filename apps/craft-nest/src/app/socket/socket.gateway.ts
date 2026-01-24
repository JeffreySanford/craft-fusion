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

  afterInit(_server: Server) {
    this.logger.verbose('Socket.IO initialized');
  }

  handleConnection(client: Socket) {
    this.logger.verbose(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    this.logger.verbose(`Client disconnected: ${client.id}`);
  }

  @SubscribeMessage('registerGuest')
  handleRegisterGuest(client: Socket): void {
    const guestId = `guest-${Math.random().toString(36).substring(2, 10)}`;
    client.emit('guestRegistered', { guestId });
    this.logger.verbose(`Guest registered with ID: ${guestId}`);
  }

  @SubscribeMessage('updateLoginTime')
  handleUpdateLoginTime(_client: Socket, payload: { dateTime: string }): void {
    this.logger.verbose(`Login time updated: ${payload.dateTime}`);
    // Store in database if needed
  }

  @SubscribeMessage('updateVisitLength')
  handleUpdateVisitLength(_client: Socket, payload: { length: number }): void {
    this.logger.debug(`Visit length updated: ${payload.length}`);
    // Store in database if needed
  }

  @SubscribeMessage('updateVisitedPage')
  handleUpdateVisitedPage(_client: Socket, payload: { page: string }): void {
    this.logger.debug(`Visited page updated: ${payload.page}`);
    // Store in database if needed
  }
}
