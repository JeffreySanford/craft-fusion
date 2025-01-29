import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { AlphaVantageController } from './alpha-vantage.controller';
import { AlphaVantageService } from './alpha-vantage.service';

@Module({
  imports: [HttpModule],
  controllers: [AlphaVantageController],
  providers: [AlphaVantageService],
})
export class AlphaVantageModule{}
