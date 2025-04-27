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
  },
})
export class SocketGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server!: Server; // Added ! for definite assignment assertion
  
  private logger = new Logger('SocketGateway');

  afterInit(server: Server) {
    this.logger.log('Socket.IO initialized');
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
  handleUpdateLoginTime(client: Socket, payload: { dateTime: string }): void {
    this.logger.log(`Login time updated: ${payload.dateTime}`);
    // Store in database if needed
  }

  @SubscribeMessage('updateVisitLength')
  handleUpdateVisitLength(client: Socket, payload: { length: number }): void {
    this.logger.log(`Visit length updated: ${payload.length}`);
    // Store in database if needed
  }

  @SubscribeMessage('updateVisitedPage')
  handleUpdateVisitedPage(client: Socket, payload: { page: string }): void {
    this.logger.log(`Visited page updated: ${payload.page}`);
    // Store in database if needed
  }
}
