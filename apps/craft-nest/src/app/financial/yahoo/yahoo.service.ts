import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom, catchError, timeout, throwError } from 'rxjs';
import { map } from 'rxjs/operators';

@Injectable()
export class YahooService {
  private readonly apiUrl: string;
  private readonly apiKey: string;
  private readonly requestTimeout = 10000; // 10 seconds timeout

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {
    this.apiUrl = this.configService.get<string>('YAHOO_FINANCE_URL') || 'https://yfapi.net';
    this.apiKey = this.configService.get<string>('YAHOO_FINANCE_API_KEY') || '';
  }

  async getHistoricalData(
    symbols: string[],
    interval: string,
    range: string,
    limit: number,
  ) {
    try {
      const response = await firstValueFrom(
        this.httpService.get(`${this.apiUrl}/v8/finance/spark`, {
          headers: {
            'X-API-KEY': this.apiKey,
            'Content-Type': 'application/json',
          },
          params: {
            symbols: symbols.join(','),
            interval,
            range,
            limit: limit.toString(),
          },
          // Add timeout to request config to prevent hanging requests
          timeout: this.requestTimeout,
        }).pipe(
          // Add RxJS timeout operator as additional protection
          timeout(this.requestTimeout),
          map(response => response.data),
          catchError(error => {
            Logger.error(`Yahoo Finance API error: ${error.message}`, error.stack);
            // Convert to more specific error for better handling
            return throwError(() => new Error(`Yahoo Finance API error: ${error.message}`));
          }),
        ),
      );
      return response;
    } catch (error) {
      Logger.error(`Failed to fetch data from Yahoo Finance: ${(error as Error)?.message || 'Unknown error'}`);
      
      // Generate fallback mock data when the API is unavailable
      return this.generateMockFinancialData(symbols, limit);
    }
  }

  /**
   * Generates mock financial data for development and fallback scenarios
   */
  private generateMockFinancialData(symbols: string[], limit: number): Record<string, any> {
    // Instead of generating mock data, return null or empty object
    Logger.log('Backend connection failed - returning empty dataset');
    return {};
  }
}
