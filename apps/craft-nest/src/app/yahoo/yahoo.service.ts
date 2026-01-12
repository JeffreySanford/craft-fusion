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
      return of(this.createEmptyResult(symbols));
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
  private generateMockData(symbol: string, count: number): StockDataPoint[] {
    const points = Math.max(1, Math.min(count, 10));
    const basePrice = this.getBasePrice(symbol);
    const data: StockDataPoint[] = [];

    for (let i = 0; i < points; i++) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const price = basePrice + (i * 0.25) + Math.sin(i / 2);
      data.push({
        date: date.toISOString(),
        open: price,
        high: price + 1.5,
        low: Math.max(price - 1.5, 0),
        close: price + 0.5,
        volume: 1000 + i * 50,
      });
    }

    return data;
  }

  private createEmptyResult(symbols: string[]): StockData[] {
    const emptyResult: StockData[] = [];
    symbols.forEach(symbol => {
      emptyResult.push({
        symbol,
        data: []
      });
    });
    return emptyResult;
  }

  private getBasePrice(symbol: string): number {
    if (!symbol) {
      return 42;
    }
    const normalized = symbol.toUpperCase();
    const sum = normalized.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return 100 + (sum % 50);
  }
}
