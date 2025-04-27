import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { AlphaVantageController } from './alpha-vantage.controller';
import { AlphaVantageService } from './alpha-vantage.service';
import { SocketGatewayModule } from '../../socket/socket.module'; // Changed from SocketModule to SocketGatewayModule

@Module({
  imports: [
    HttpModule,
    SocketGatewayModule  // This imports the correct module
  ],
  controllers: [AlphaVantageController],
  providers: [AlphaVantageService],
})
export class AlphaVantageModule {}
