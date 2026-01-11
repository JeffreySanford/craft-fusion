import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';                   
import { catchError, map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { LoggerService } from './logger.service';

export interface HistoricalPoint {
  date: Date;
  close: number;
}
export interface HistoricalData {
  symbol: string;
  data: HistoricalPoint[];
}

@Injectable({
  providedIn: 'root',
})
export class YahooService {
  private apiUrl = environment.yahooFinance.url;

  private options = {
    headers: {
      'x-api-key': environment.yahooFinance.apiKey,
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
  };

  constructor(
    private http: HttpClient,
    private logger: LoggerService,
  ) {
    this.logger.registerService('YahooService');
    this.logger.info('YahooService initialized');
  }

  getStockQuote(symbol: string): Observable<unknown> {
    const url = `${this.apiUrl}/quoteSummary/${symbol}`;
    const params = { modules: 'defaultKeyStatistics,assetProfile' };

    this.logger.debug(`Fetching stock quote for ${symbol}`, { url });
    const callId = this.logger.startServiceCall('YahooService', 'GET', url);

    return this.http.get(url, { ...this.options, params }).pipe(
      map((response: any) => {
        this.logger.endServiceCall(callId, 200);
        return response.quoteSummary.result[0];
      }),
      catchError(error => {
        this.logger.error(`Error fetching stock quote for ${symbol}:`, {
          status: error.status,
          statusText: error.statusText,
          message: error.message,
        });
        this.logger.endServiceCall(callId, error.status || 500);
        return of(null);                                
      }),
    );
  }

  getHistoricalData(symbols: string[], interval: string = '1d', range: string = '1y'): Observable<HistoricalData[]> {
    const url = `${this.apiUrl}v8/finance/spark/?interval=${interval}&range=${range}&symbols=${symbols.join(',')}`;

    this.logger.debug(`Fetching historical data for ${symbols}`, { url });
    const callId = this.logger.startServiceCall('YahooService', 'GET', url);

    return this.http.get(url, this.options).pipe(
      map((response: any) => {
        this.logger.endServiceCall(callId, 200);
        const parsedData: HistoricalData[] = symbols.map(symbol => {
          const data = response[symbol];
          return {
            symbol,
            data: data.timestamp.map((timestamp: number, index: number) => ({
              date: new Date(timestamp * 1000),
              close: data.close[index],
            })),
          };
        });
        return parsedData;
      }),
      catchError(error => {
        this.logger.error(`Error fetching historical data for ${symbols}:`, {
          status: error.status,
          statusText: error.statusText,
          message: error.message,
        });
        this.logger.endServiceCall(callId, error.status || 500);
        return of([] as HistoricalData[]);                                       
      }),
    );
  }

  getMarketSummary(): Observable<unknown> {
    const url = `${this.apiUrl}/market/get-summary`;

    this.logger.debug(`Fetching market summary`, { url });
    const callId = this.logger.startServiceCall('YahooService', 'GET', url);

    return this.http.get(url, this.options).pipe(
      map((response: any) => {
        this.logger.endServiceCall(callId, 200);
        return response?.marketSummaryResponse?.result;
      }),
      catchError(error => {
        this.logger.error(`Error fetching market summary:`, {
          status: error.status,
          statusText: error.statusText,
          message: error.message,
        });
        this.logger.endServiceCall(callId, error.status || 500);
        return of([]);                                       
      }),
    );
  }

  getTrendingSymbols(region: string): Observable<unknown> {
    const url = `${this.apiUrl}/trending`;
    const params = { region };

    this.logger.debug(`Fetching trending symbols for region ${region}`, { url });
    const callId = this.logger.startServiceCall('YahooService', 'GET', url);

    return this.http.get(url, { ...this.options, params }).pipe(
      map((response: any) => {
        this.logger.endServiceCall(callId, 200);
        return response?.finance?.result?.[0]?.quotes || [];
      }),
      catchError(error => {
        this.logger.error(`Error fetching trending symbols for region ${region}:`, {
          status: error.status,
          statusText: error.statusText,
          message: error.message,
        });
        this.logger.endServiceCall(callId, error.status || 500);
        return of([]);                                       
      }),
    );
  }

  getCompanyDetails(symbol: string): Observable<unknown> {
    const url = `${this.apiUrl}/quoteSummary/${symbol}`;
    const params = { modules: 'assetProfile,defaultKeyStatistics' };

    this.logger.debug(`Fetching company details for ${symbol}`, { url });
    const callId = this.logger.startServiceCall('YahooService', 'GET', url);

    return this.http.get(url, { ...this.options, params }).pipe(
      map((response: any) => {
        this.logger.endServiceCall(callId, 200);
        return response.quoteSummary.result[0];
      }),
      catchError(error => {
        this.logger.error(`Error fetching company details for ${symbol}:`, {
          status: error.status,
          statusText: error.statusText,
          message: error.message,
        });
        this.logger.endServiceCall(callId, error.status || 500);
        return of(null);                                
      }),
    );
  }
}
