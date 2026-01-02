import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom, catchError, timeout, throwError } from 'rxjs';
import { map } from 'rxjs/operators';
import { LoggingService } from '../../logging/logging.service';
import { summarizeForLog } from '../../logging/logging.utils';

@Injectable()
export class YahooService {
  private readonly apiUrl: string;
  private readonly apiKey: string;
  private readonly requestTimeout = 10000; // 10 seconds timeout

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
    private readonly logger: LoggingService,
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
    const payload = { symbols, interval, range, limit };
    const startTime = Date.now();
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
            // Convert to more specific error for better handling
            return throwError(() => new Error(`Yahoo Finance API error: ${this.getErrorMessage(error)}`));
          }),
        ),
      );
      this.logSuccess('getHistoricalData', payload, response, startTime);
      return response;
    } catch (error) {
      this.logError('getHistoricalData', payload, error, startTime);
      
      // Generate fallback mock data when the API is unavailable
      return this.generateMockFinancialData(symbols, limit);
    }
  }

  async getStockQuote(symbol: string) {
    try {
      const response = await this.fetchYahoo<{ quoteSummary?: { result?: unknown[] } }>(
        `/quoteSummary/${symbol}`,
        { modules: 'defaultKeyStatistics,assetProfile' },
        'getStockQuote',
      );
      return response?.quoteSummary?.result?.[0] ?? null;
    } catch (error) {
      this.logger.warn('Yahoo Finance fallback response', {
        service: 'yahoo-finance',
        operation: 'getStockQuote',
        payload: { symbol },
        reason: this.getErrorMessage(error),
      });
      return null;
    }
  }

  async getMarketSummary() {
    try {
      const response = await this.fetchYahoo<{ marketSummaryResponse?: { result?: unknown[] } }>(
        '/market/get-summary',
        {},
        'getMarketSummary',
      );
      return response?.marketSummaryResponse?.result ?? [];
    } catch (error) {
      this.logger.warn('Yahoo Finance fallback response', {
        service: 'yahoo-finance',
        operation: 'getMarketSummary',
        reason: this.getErrorMessage(error),
      });
      return [];
    }
  }

  async getTrendingSymbols(region: string) {
    try {
      const response = await this.fetchYahoo<{ finance?: { result?: Array<{ quotes?: unknown[] }> } }>(
        '/trending',
        { region },
        'getTrendingSymbols',
      );
      return response?.finance?.result?.[0]?.quotes ?? [];
    } catch (error) {
      this.logger.warn('Yahoo Finance fallback response', {
        service: 'yahoo-finance',
        operation: 'getTrendingSymbols',
        payload: { region },
        reason: this.getErrorMessage(error),
      });
      return [];
    }
  }

  async getCompanyDetails(symbol: string) {
    try {
      const response = await this.fetchYahoo<{ quoteSummary?: { result?: unknown[] } }>(
        `/quoteSummary/${symbol}`,
        { modules: 'assetProfile,defaultKeyStatistics' },
        'getCompanyDetails',
      );
      return response?.quoteSummary?.result?.[0] ?? null;
    } catch (error) {
      this.logger.warn('Yahoo Finance fallback response', {
        service: 'yahoo-finance',
        operation: 'getCompanyDetails',
        payload: { symbol },
        reason: this.getErrorMessage(error),
      });
      return null;
    }
  }

  /**
   * Generates mock financial data for development and fallback scenarios
   */
  private generateMockFinancialData(_symbols: string[], _limit: number): Record<string, any> {
    // Instead of generating mock data, return null or empty object
    return {};
  }

  private async fetchYahoo<T>(
    path: string,
    params: Record<string, string> = {},
    operation: string = 'fetchYahoo',
  ): Promise<T> {
    const payload = { path, params };
    const startTime = Date.now();
    try {
      const response = await firstValueFrom(
        this.httpService
          .get(`${this.apiUrl}${path}`, {
            headers: {
              'X-API-KEY': this.apiKey,
              'Content-Type': 'application/json',
            },
            params,
            timeout: this.requestTimeout,
          })
          .pipe(
            timeout(this.requestTimeout),
            map(res => res.data as T),
            catchError(error => {
              return throwError(() => new Error(`Yahoo Finance API error: ${this.getErrorMessage(error)}`));
            }),
          ),
      );
      this.logSuccess(operation, payload, response, startTime);
      return response;
    } catch (error) {
      this.logError(operation, payload, error, startTime);
      throw error;
    }
  }

  private logSuccess(
    operation: string,
    payload: Record<string, unknown>,
    result: unknown,
    startTime: number
  ): void {
    this.logger.info('External API request success', {
      service: 'yahoo-finance',
      operation,
      payload,
      result: summarizeForLog(result),
      durationMs: Date.now() - startTime,
    });
  }

  private logError(
    operation: string,
    payload: Record<string, unknown>,
    error: unknown,
    startTime: number
  ): void {
    this.logger.error('External API request error', {
      service: 'yahoo-finance',
      operation,
      payload,
      error,
      durationMs: Date.now() - startTime,
    });
  }

  private getErrorMessage(error: unknown): string {
    return error instanceof Error ? error.message : String(error);
  }
}
