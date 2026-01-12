import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { Observable, catchError, map, tap } from 'rxjs';
import { SocketService } from '../../socket/socket.service';

@Injectable()
export class AlphaVantageService {
  private readonly apiUrl = 'https://www.alphavantage.co/query';
  private readonly apiKey = process.env['ALPHA_VANTAGE_API_KEY'] || 'demo';

  constructor(
    private httpService: HttpService, 
    private socketService: SocketService
  ) {}

  /**
   * Get stock data for a specific symbol
   */
  getStockData(symbol: string): Observable<any> {
    const url = `${this.apiUrl}?function=TIME_SERIES_DAILY&symbol=${symbol}&apikey=${this.apiKey}`;

    return this.httpService.get(url).pipe(
      map(response => response.data),
      tap(data => {
        // After getting data, emit to all connected clients via the SocketService
        this.socketService.emitToAll('alpha-vantage:stock-update', { symbol, data });
      }),
      catchError(error => {
        throw new Error(`Error fetching stock data: ${error.message}`);
      })
    );
  }

  /**
   * Get forex data for a specific currency pair
   */
  getForexData(fromCurrency: string, toCurrency: string): Observable<any> {
    const url = `${this.apiUrl}?function=CURRENCY_EXCHANGE_RATE&from_currency=${fromCurrency}&to_currency=${toCurrency}&apikey=${this.apiKey}`;

    return this.httpService.get(url).pipe(
      map(response => response.data),
      tap(data => {
        // Emit forex update to clients
        this.socketService.emitToAll('alpha-vantage:forex-update', { fromCurrency, toCurrency, data });
      }),
      catchError(error => {
        throw new Error(`Error fetching forex data: ${error.message}`);
      })
    );
  }

  /**
   * Get cryptocurrency data for a specific symbol
   */
  getCryptoData(symbol: string, market: string = 'USD'): Observable<any> {
    const url = `${this.apiUrl}?function=DIGITAL_CURRENCY_DAILY&symbol=${symbol}&market=${market}&apikey=${this.apiKey}`;

    return this.httpService.get(url).pipe(
      map(response => response.data),
      tap(data => {
        // Emit crypto update to clients
        this.socketService.emitToAll('alpha-vantage:crypto-update', { symbol, market, data });
      }),
      catchError(error => {
        throw new Error(`Error fetching crypto data: ${error.message}`);
      })
    );
  }

  /**
   * Emit stock update to all connected clients
   */
  emitStockUpdate(symbol: string, data: any): void {
    this.socketService.emitToAll('alpha-vantage:update', { symbol, data });
  }
}
