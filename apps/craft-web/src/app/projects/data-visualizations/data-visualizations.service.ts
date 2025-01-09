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
   * Fetch historical stock data from Alpha Vantage.
   * @param symbol Stock symbol (e.g., "AAPL").
   * @param startDate Start date for historical data (YYYY-MM-DD).
   * @param endDate End date for historical data (YYYY-MM-DD).
   */
  getStockData(symbol: string, resolution: string, from: number, to: number): Observable<any> {
    const params = {
      symbol,
      resolution,
      from: from.toString(),
      to: to.toString(),
      token: this.apiKey,
    };

    return this.http.get(`${this.baseUrl}/stock/candle`, { params });
  }
}
