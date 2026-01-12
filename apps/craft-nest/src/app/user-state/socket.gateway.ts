import { WebSocketGateway, WebSocketServer, OnGatewayConnection, OnGatewayDisconnect } from '@nestjs/websockets';
import { Logger } from '@nestjs/common';
import { Server, Socket } from 'socket.io';

@WebSocketGateway({
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  },
  transports: ['websocket', 'polling'],
})
export class SocketGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer() server: Server = new Server();
  private readonly logger = new Logger('UserStateSocketGateway');
  
  // Add these methods as they're required by the interfaces
  handleConnection(client: Socket): void {
    this.logger.verbose(`Client connected: ${client.id}`);
  }
  
  handleDisconnect(client: Socket): void {
    this.logger.verbose(`Client disconnected: ${client.id}`);
  }
  
  // Add the missing method
  broadcastStateChange(data: any): void {
    this.server.emit('state-change', data);
  }
}
