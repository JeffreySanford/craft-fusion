import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { FinnhubService } from '../../common/services/finnhub.service';

@Injectable({
  providedIn: 'root',
})
export class DataVisualizationService {
  constructor(private finnhubService: FinnhubService) {}

  /**
   * Fetch historical stock data from Finnhub.
   * @param symbol Stock symbol (e.g., "AAPL").
   * @param resolution Resolution of the data (e.g., "D" for daily).
   * @param from Start timestamp for historical data.
   * @param to End timestamp for historical data.
   */
  getStockData(symbol: string, resolution: string, from: number, to: number): Observable<any> {
    return this.finnhubService.getStockData(symbol);
  }
}
