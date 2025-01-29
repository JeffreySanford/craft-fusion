import { Controller, Get, Param } from '@nestjs/common';
import { AlphaVantageService } from './alpha-vantage.service';
import { Observable } from 'rxjs';

@Controller('alphaVantage')
export class AlphaVantageController {
    constructor(private readonly alphaVantage: AlphaVantageService) {}

    @Get('stock/:symbol')
    getStockData(@Param('symbol') symbol: string): Observable<any> {
        return this.alphaVantage.getStockData(symbol);
    }

    @Get('crypto/:symbol')
    getCryptoData(@Param('symbol') symbol: string): Observable<any> {
        return this.alphaVantage.getCryptoData(symbol);
    }
}