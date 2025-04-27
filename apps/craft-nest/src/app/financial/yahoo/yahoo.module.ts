import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { YahooController } from './yahoo.controller';
import { YahooService } from './yahoo.service';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [
    HttpModule,
    ConfigModule,
  ],
  controllers: [YahooController],
  providers: [YahooService],
  exports: [YahooService],
})
export class YahooModule {}
