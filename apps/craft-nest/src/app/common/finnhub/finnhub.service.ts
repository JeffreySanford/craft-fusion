import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { Observable, forkJoin } from 'rxjs';
import { map } from 'rxjs/operators';

@Injectable()
export class FinnhubService {
    private readonly apiKey: string;
    private readonly baseUrl: string = 'https://finnhub.io/api/v1';

    constructor(
        private readonly httpService: HttpService,
        private readonly configService: ConfigService,
    ) {
        const apiKey = this.configService.get<string>('FINNHUB_API_KEY');
        if (!apiKey) {
            throw new Error('FINNHUB_API_KEY is not defined in the configuration');
        }
        this.apiKey = apiKey;
    }

    getStockData(symbol: string): Observable<any> {
        const currentDate = Math.floor(Date.now() / 1000);
        const threeYearsAgo = currentDate - 3 * 365 * 24 * 60 * 60;

        const url = `${this.baseUrl}/stock/candle?symbol=${symbol}&resolution=D&from=${threeYearsAgo}&to=${currentDate}&token=${this.apiKey}`;

        return this.httpService.get(url).pipe(
            map(response => response.data)
        );
    }

    getMultipleStocksData(symbols: string[]): Observable<any[]> {
        const observables = symbols.map(symbol => this.getStockData(symbol));
        return forkJoin(observables);
    }

    getCryptoData(symbol: string): Observable<any> {
        const url = `${this.baseUrl}/crypto/candle?symbol=${symbol}&resolution=D&from=1622505600&to=1625097600&token=${this.apiKey}`;
        return this.httpService.get(url).pipe(
            map(response => response.data)
        );
    }
}