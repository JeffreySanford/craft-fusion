import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { YahooController } from './yahoo.controller';
import { YahooService } from './yahoo.service';
import { YahooGateway } from './yahoo.gateway';

@Module({
  imports: [HttpModule],
  controllers: [YahooController],
  providers: [YahooService, YahooGateway],
})
export class YahooModule {}
