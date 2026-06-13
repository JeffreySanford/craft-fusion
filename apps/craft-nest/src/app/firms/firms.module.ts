import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';

import { FirmsService } from './firms.service';
import { FirmsController } from './firms.controller';

@Module({
  imports: [HttpModule],
  controllers: [FirmsController],
  providers: [FirmsService],
  exports: [FirmsService],
})
export class FirmsModule {}
