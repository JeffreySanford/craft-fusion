import { WebSocketGateway, WebSocketServer, OnGatewayConnection, OnGatewayDisconnect } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { LoggingService } from '../logging/logging.service';

@WebSocketGateway({
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  },
  transports: ['websocket', 'polling'],
})
export class SocketGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer() server: Server = new Server();
  
  // Add these methods as they're required by the interfaces
  handleConnection(client: Socket): void {
    console.log(`Client connected: ${client.id}`);
  }
  
  handleDisconnect(client: Socket): void {
    console.log(`Client disconnected: ${client.id}`);
  }
  
  // Add the missing method
  broadcastStateChange(data: any): void {
    this.server.emit('state-change', data);
  }
}
