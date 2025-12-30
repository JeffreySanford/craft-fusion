import { Injectable, Logger } from '@nestjs/common';
import { Observable, of } from 'rxjs';

// Add export to the interface declarations
export interface StockDataPoint {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface StockData {
  symbol: string;
  data: StockDataPoint[];
}

@Injectable()
export class YahooService {
  private readonly logger = new Logger(YahooService.name);
  
  constructor() {}

  /**
   * Get historical stock data from Yahoo Finance
   * @param symbols Array of stock symbols
   * @param interval Time interval (e.g., '1d', '1h', '1m')
   * @param range Time range (e.g., '1d', '5d', '1mo', '3mo', '6mo', '1y', '5y', 'max')
   * @param maxPoints Maximum number of data points to return
   * @returns Observable<StockDataMap> containing historical stock data
   */
  getHistoricalData(
    symbols: string[],
    interval: string = '1d',
    range: string = '1y',
    maxPoints: number = 1000
  ): Observable<StockData[]> {
    this.logger.log(`Fetching historical data for ${symbols.join(',')} with interval ${interval} and range ${range}`);
    
    try {
      // Mock implementation that returns an Observable<StockDataMap>
      const result: StockData[] = [];
      
      // Creating mock data for each symbol
      symbols.forEach(symbol => {
        const stockData: StockData = {
          symbol,
          data: this.generateMockData(symbol, maxPoints)
        };
        result.push(stockData);
      });
      
      // Return as Observable instead of direct object
      return of(result);
    } catch (error) {
      this.logger.error(`Failed to fetch historical data: ${this.getErrorMessage(error)}`);
      
      // Create empty result and return as Observable
      const emptyResult: StockData[] = [];
      symbols.forEach(symbol => {
        const stockData: StockData = {
          symbol,
          data: []
        };
        emptyResult.push(stockData);
      });
      
      return of(emptyResult);
    }
  }

  // Helper method to extract error message safely
  private getErrorMessage(error: unknown): string {
    if (error instanceof Error) {
      return error.message;
    }
    return String(error);
  }

  // Helper method to generate mock data for testing
  private generateMockData(_symbol: string, _count: number): StockDataPoint[] {
    // Instead of generating mock data, return empty array
    return [];
  }


}
