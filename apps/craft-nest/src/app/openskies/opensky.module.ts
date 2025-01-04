import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { OpenSkyController } from './opensky.controller';
import { OpenSkyService } from './opensky.service';

@Module({
  imports: [HttpModule],
  controllers: [OpenSkyController],
  providers: [OpenSkyService],
})
export class OpenSkyModule {}