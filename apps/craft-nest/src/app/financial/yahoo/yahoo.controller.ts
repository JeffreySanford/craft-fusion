import { Controller, Get, Param, Query } from '@nestjs/common';
import { YahooService } from './yahoo.service';
import { ApiOperation, ApiTags } from '@nestjs/swagger';

@ApiTags('Yahoo Finance')
@Controller('financial/yahoo')
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

  @Get('quote/:symbol')
  @ApiOperation({ summary: 'Get stock quote summary' })
  getStockQuote(@Param('symbol') symbol: string) {
    return this.yahooService.getStockQuote(symbol);
  }

  @Get('market-summary')
  @ApiOperation({ summary: 'Get market summary' })
  getMarketSummary() {
    return this.yahooService.getMarketSummary();
  }

  @Get('trending')
  @ApiOperation({ summary: 'Get trending symbols by region' })
  getTrendingSymbols(@Query('region') region: string) {
    return this.yahooService.getTrendingSymbols(region);
  }

  @Get('company/:symbol')
  @ApiOperation({ summary: 'Get company details' })
  getCompanyDetails(@Param('symbol') symbol: string) {
    return this.yahooService.getCompanyDetails(symbol);
  }
}
