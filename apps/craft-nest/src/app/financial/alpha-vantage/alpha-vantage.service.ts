import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { Observable, throwError, forkJoin, interval } from 'rxjs';
import { catchError, map, switchMap, tap } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { SocketGateway } from '../../socket/socket.gateway';

@Injectable()
export class AlphaVantageService {
  private readonly apiKey: string;
  private readonly baseUrl: string = 'https://www.alphavantage.co/query';
  private readonly refreshInterval = 60000; // 1 minute refresh rate for socket updates

  constructor(
    private readonly httpService: HttpService,
    private readonly socketGateway: SocketGateway
  ) {
    this.apiKey = environment.alphaVantageApiKey || 'demo'; // Add fallback to demo key
    this.initializeFinancialDataStream();
  }

  getStockData(symbol: string): Observable<any> {
    const url = `${this.baseUrl}?function=TIME_SERIES_DAILY&symbol=${symbol}&apikey=${this.apiKey}`;

    return this.httpService.get(url).pipe(
      map(response => response.data),
      tap(data => {
        // Emit the fresh data via socket when received
        this.socketGateway.server.emit('financial:stock-update', { 
          symbol,
          data,
          timestamp: Date.now()
        });
      }),
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
    return this.httpService.get(url).pipe(
      map(response => response.data),
      tap(data => {
        // Emit the crypto data via socket
        this.socketGateway.server.emit('financial:crypto-update', {
          symbol,
          data,
          timestamp: Date.now()
        });
      })
    );
  }

  /**
   * Initialize socket-driven metrics for financial data
   * Periodically fetches data and emits via socket
   */
  private initializeFinancialDataStream(): void {
    // List of default symbols to monitor
    const defaultSymbols = ['AAPL', 'MSFT', 'GOOGL', 'AMZN'];
    
    // Set up periodic polling and broadcasting via socket
    interval(this.refreshInterval).pipe(
      switchMap(() => this.getMultipleStocksData(defaultSymbols)),
      catchError(error => {
        console.error('Error in financial data stream:', error);
        return interval(this.refreshInterval * 2); // Retry with longer interval on error
      })
    ).subscribe({
      next: (data) => {
        // Broadcast financial metrics to all connected clients
        this.socketGateway.server.emit('financial:metrics-update', {
          data,
          timestamp: Date.now()
        });
      },
      error: (err) => console.error('Financial data stream error:', err)
    });
  }

  /**
   * Provides a live resource that combines initial REST data with WebSocket updates
   * @param symbol Stock symbol to monitor
   * @returns Observable that emits both initial data and live updates
   */
  getLiveStockData(symbol: string): Observable<any> {
    // Initial fetch via REST API, socket updates handled client-side
    return this.getStockData(symbol);
  }
}
