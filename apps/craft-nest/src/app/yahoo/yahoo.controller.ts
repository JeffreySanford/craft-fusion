import { Controller, Get, Param, Query } from '@nestjs/common';
import { YahooService, StockData } from './yahoo.service';

@Controller('yahoo')
export class YahooController {
  constructor(private readonly yahooService: YahooService) {}

  @Get('historical/:symbols')
  getHistoricalData(
    @Param('symbols') symbols: string,
    @Query('interval') interval: string = '1d',
    @Query('range') range: string = '1mo'
  ) {
    const symbolsList = symbols.split(',');
    return this.yahooService.getHistoricalData(symbolsList, interval, range);
  }
}
