import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { Observable, throwError, forkJoin } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';

@Injectable()
export class AlphaVantageService {
  private readonly apiKey: string;
  private readonly baseUrl: string = 'https://www.alphavantage.co/query';

  constructor(private readonly httpService: HttpService) {
    this.apiKey = environment.alphaVantageApiKey; // Replace with your actual API key
  }

  getStockData(symbol: string): Observable<any> {
    const url = `${this.baseUrl}?function=TIME_SERIES_DAILY&symbol=${symbol}&apikey=${this.apiKey}`;

    return this.httpService.get(url).pipe(
      map(response => response.data),
      catchError(error => {
        console.error('Error fetching stock data:', error);
        return throwError(() => new Error(`Server-side error: ${error.response?.status} ${error.response?.statusText}`));
      })
    );
  }

  getMultipleStocksData(symbols: string[]): Observable<any[]> {
    const observables = symbols.map(symbol => this.getStockData(symbol));
    return forkJoin(observables);
  }

  getCryptoData(symbol: string): Observable<any> {
    const url = `${this.baseUrl}/crypto/candle?symbol=${symbol}&resolution=D&from=1622505600&to=1625097600&token=${this.apiKey}`;
    return this.httpService.get(url).pipe(map(response => response.data));
  }
}
