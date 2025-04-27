import { WebSocketGateway, WebSocketServer, SubscribeMessage, MessageBody, ConnectedSocket } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { UserStateService } from '../user/user-state.service';

@WebSocketGateway({
  cors: {
    origin: '*',
  },
  namespace: 'user-state',
})
export class UserStateGateway {
  @WebSocketServer()
  server!: Server;

  constructor(private readonly userStateService: UserStateService) {}

  @SubscribeMessage('registerGuest')
  handleRegisterGuest(@ConnectedSocket() client: Socket): void {
    const guestId = `guest-${Date.now()}`;
    client.data.isGuest = true;
    client.data.userId = guestId;
    
    // Associate socket with a guest ID
    client.join(`guest:${guestId}`);
    
    // Send back the guest ID to the client
    client.emit('guestRegistered', { guestId });
    
    console.log(`Socket: Guest registered with ID ${guestId}`);
  }
  
  @SubscribeMessage('updateLoginTime')
  handleUpdateLoginTime(
    @MessageBody() data: { dateTime: string },
    @ConnectedSocket() client: Socket,
  ): void {
    const isGuest = client.data.isGuest;
    const userId = client.data.userId || 'unknown';
    
    const dateTime = new Date(data.dateTime);
    this.userStateService.setLoginDateTime(dateTime, userId, isGuest).subscribe();
    
    console.log(`Socket: Updated login time for ${isGuest ? 'guest' : 'user'} ${userId}: ${dateTime}`);
  }
  
  @SubscribeMessage('updateVisitLength')
  handleUpdateVisitLength(
    @MessageBody() data: { length: number },
    @ConnectedSocket() client: Socket,
  ): void {
    const isGuest = client.data.isGuest;
    const userId = client.data.userId || 'unknown';
    
    this.userStateService.setVisitLength(data.length, userId, isGuest).subscribe();
    
    console.log(`Socket: Updated visit length for ${isGuest ? 'guest' : 'user'} ${userId}: ${data.length}`);
  }
  
  @SubscribeMessage('updateVisitedPage')
  handleUpdateVisitedPage(
    @MessageBody() data: { page: string },
    @ConnectedSocket() client: Socket,
  ): void {
    const isGuest = client.data.isGuest;
    const userId = client.data.userId || 'unknown';
    
    this.userStateService.setVisitedPage(data.page, userId, isGuest).subscribe();
    
    console.log(`Socket: Updated visited page for ${isGuest ? 'guest' : 'user'} ${userId}: ${data.page}`);
  }
}
