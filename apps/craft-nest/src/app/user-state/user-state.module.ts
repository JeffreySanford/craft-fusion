import { Module } from '@nestjs/common';
import { UserStateService } from './user-state.service';
import { UserStateController } from './user-state.controller';
import { SocketGateway } from './socket.gateway';
import { AuthModule } from '../auth/auth.module'; // Import AuthModule to use authentication features

@Module({
  imports: [AuthModule],
  controllers: [UserStateController],
  providers: [UserStateService, SocketGateway],
  exports: [UserStateService, SocketGateway]
})
export class UserStateModule {}
