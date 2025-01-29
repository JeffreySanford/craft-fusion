import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { map, catchError, retry } from 'rxjs/operators';
import { environment } from 'apps/craft-web/src/environments/environment';

@Injectable({
  providedIn: 'root',
})
export class YahooService {
  private apiUrl = environment.yahooFinance.url;

  private options = {
    headers: new HttpHeaders({
      'x-api-key': environment.yahooFinance.apiKey,
      'Content-Type': 'application/json',
      Accept: 'application/json',
    }),
  };

  constructor(private http: HttpClient) {}

  getStockQuote(symbol: string): Observable<any> {
    const url = `${this.apiUrl}/quoteSummary/${symbol}`;
    const params = new HttpParams().set('modules', 'defaultKeyStatistics,assetProfile');

    return this.http.get(url, { ...this.options, params }).pipe(
      map((response: any) => response.quoteSummary.result[0]),
      catchError(error => {
        console.error(`Error fetching stock quote for ${symbol}:`, error);
        console.error(`Error details:`, {
          headers: error.headers,
          status: error.status,
          statusText: error.statusText,
          url: error.url,
          message: error.message,
          error: error.error,
        });
        return of(null); // Return null as a fallback
      }),
    );
  }

  getHistoricalData(symbols: string[], interval: string = '1d', range: string = '1y'): Observable<any> {
    const url = `${this.apiUrl}v8/finance/spark/?interval=${interval}&range=${range}&symbols=${symbols.join(',')}`;
  
    return this.http.get(url, this.options).pipe(
      retry(3), // Retry the request up to 3 times
      map((response: any) => {
        const parsedData = symbols.map(symbol => {
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
        console.error(`Error fetching historical data for ${symbols}:`, error);
        return of([]); // Return an empty array as a fallback
      }),
    );
  }

  getMarketSummary(): Observable<any> {
    const url = `${this.apiUrl}/market/get-summary`;

    return this.http.get(url, this.options).pipe(
      map((response: any) => response.marketSummaryResponse.result),
      catchError(error => {
        console.error(`Error fetching market summary:`, error);
        console.error(`Error details:`, {
          headers: error.headers,
          status: error.status,
          statusText: error.statusText,
          url: error.url,
          message: error.message,
          error: error.error,
        });
        return of([]); // Return an empty array as a fallback
      }),
    );
  }

  getTrendingSymbols(region: string): Observable<any> {
    const url = `${this.apiUrl}/trending`;
    const params = new HttpParams().set('region', region);

    return this.http.get(url, { ...this.options, params }).pipe(
      map((response: any) => response.finance.result[0].quotes),
      catchError(error => {
        console.error(`Error fetching trending symbols for region ${region}:`, error);
        console.error(`Error details:`, {
          headers: error.headers,
          status: error.status,
          statusText: error.statusText,
          url: error.url,
          message: error.message,
          error: error.error,
        });
        return of([]); // Return an empty array as a fallback
      }),
    );
  }

  getCompanyDetails(symbol: string): Observable<any> {
    const url = `${this.apiUrl}/quoteSummary/${symbol}`;
    const params = new HttpParams().set('modules', 'assetProfile,defaultKeyStatistics');

    return this.http.get(url, { ...this.options, params }).pipe(
      map((response: any) => response.quoteSummary.result[0]),
      catchError(error => {
        console.error(`Error fetching company details for ${symbol}:`, error);
        console.error(`Error details:`, {
          headers: error.headers,
          status: error.status,
          statusText: error.statusText,
          url: error.url,
          message: error.message,
          error: error.error,
        });
        return of(null); // Return null as a fallback
      }),
    );
  }
}
