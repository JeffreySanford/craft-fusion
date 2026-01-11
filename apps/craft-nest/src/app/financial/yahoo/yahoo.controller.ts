import { Controller, Get, Query } from '@nestjs/common';
import { YahooService } from './yahoo.service';
import { ApiOperation, ApiTags } from '@nestjs/swagger';

@ApiTags('Yahoo Finance')
@Controller('yahoo')
export class YahooController {
  constructor(private readonly yahooService: YahooService) {}

  @Get('historical')
  @ApiOperation({ summary: 'Get historical stock data' })
  async getHistoricalData(
    @Query('symbols') symbols: string,
    @Query('interval') interval: string,
    @Query('range') range: string,
    @Query('limit') limit: string,
  ) {
    const symbolsArray = symbols.split(',');
    return this.yahooService.getHistoricalData(
      symbolsArray,
      interval,
      range,
      parseInt(limit, 10) || 1000,
    );
  }
}
