import { Module } from '@nestjs/common';
import { SocketGateway } from './socket.gateway';
import { SocketService } from './socket.service';
import { LoggingModule } from '../logging/logging.module';

@Module({
  imports: [LoggingModule],
  providers: [SocketGateway, SocketService],
  exports: [SocketService],
})
export class SocketModule {}
