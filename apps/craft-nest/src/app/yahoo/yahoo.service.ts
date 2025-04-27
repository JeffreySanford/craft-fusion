import { Injectable, Logger } from '@nestjs/common';
import { Observable, throwError, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { HttpService } from '@nestjs/axios';

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
  
  constructor(private readonly httpService: HttpService) {}

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
  private generateMockData(symbol: string, count: number): StockDataPoint[] {
    const data: StockDataPoint[] = [];
    const basePrice = this.getBasePrice(symbol);
    const today = new Date();
    
    for (let i = 0; i < count; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() - i);
      
      const randomFactor = 1 + (Math.random() - 0.5) * 0.05;
      const open = basePrice * randomFactor;
      const high = open * (1 + Math.random() * 0.02);
      const low = open * (1 - Math.random() * 0.02);
      const close = (open + high + low) / 3;
      const volume = Math.floor(Math.random() * 10000000);
      
      data.push({
        date: date.toISOString().split('T')[0], // format date as YYYY-MM-DD
        open,
        high,
        low,
        close,
        volume
      });
    }
    
    return data;
  }

  private getBasePrice(symbol: string): number {
    // Simple way to generate different base prices for different symbols
    const priceMap: Record<string, number> = {
      'AAPL': 180,
      'GOOGL': 140,
      'MSFT': 350,
      'AMZN': 170
    };
    
    return priceMap[symbol] || 100;
  }
}
