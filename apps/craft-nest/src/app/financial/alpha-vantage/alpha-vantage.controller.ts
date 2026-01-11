import { Controller, Get, Param, Query } from '@nestjs/common';
import { AlphaVantageService } from './alpha-vantage.service';

@Controller('financial/alpha-vantage')
export class AlphaVantageController {
  constructor(private readonly alphaVantageService: AlphaVantageService) {}

  @Get('stock/:symbol')
  getStockData(@Param('symbol') symbol: string) {
    return this.alphaVantageService.getStockData(symbol);
  }

  @Get('forex')
  getForexData(
    @Query('from') fromCurrency: string,
    @Query('to') toCurrency: string,
  ) {
    return this.alphaVantageService.getForexData(fromCurrency, toCurrency);
  }

  @Get('crypto/:symbol')
  getCryptoData(
    @Param('symbol') symbol: string,
    @Query('market') market: string = 'USD',
  ) {
    return this.alphaVantageService.getCryptoData(symbol, market);
  }
}