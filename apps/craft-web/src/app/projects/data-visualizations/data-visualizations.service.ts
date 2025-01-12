import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class DataVisualizationService {
  private readonly baseUrl = environment.finnHubAPI;
  private readonly apiKey = environment.finnhubApiKey;
  constructor(private http: HttpClient) {}

  /**
   * Fetch historical stock data from Finnhub.
   * @param symbol Stock symbol (e.g., "AAPL").
   * @param resolution Resolution of the data (e.g., "D" for daily).
   * @param from Start timestamp for historical data.
   * @param to End timestamp for historical data.
   */
  getStockData(symbol: string, resolution: string, from: number, to: number): Observable<any> {
    // this should be using the finnhub.io api
    const url = `http://finnhub.io/api/v1`;
    
    const params = {
      symbol,
      resolution,
      from: from.toString(),
      to: to.toString(),
      token: this.apiKey,
    };
    debugger

    return this.http.get(`${url}/stock/candle`, { params });
  }
}
