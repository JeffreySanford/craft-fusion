import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { AlphaVantageController } from './alpha-vantage.controller';
import { AlphaVantageService } from './alpha-vantage.service';
import { SocketModule } from '../../socket/socket.module';

@Module({
  imports: [
    HttpModule,
    SocketModule
  ],
  controllers: [AlphaVantageController],
  providers: [AlphaVantageService],
})
export class AlphaVantageModule{}
