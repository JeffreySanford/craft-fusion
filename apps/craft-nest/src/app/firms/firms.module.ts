import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { ConfigModule } from '@nestjs/config';
import { FirmsController } from './firms.controller';
import { FirmsService } from './firms.service';

@Module({
  imports: [HttpModule, ConfigModule],
  controllers: [FirmsController],
  providers: [FirmsService],
  exports: [FirmsService],
})
export class FirmsModule {}
