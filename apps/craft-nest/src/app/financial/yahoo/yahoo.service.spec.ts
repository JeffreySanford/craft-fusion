import { Test, TestingModule } from '@nestjs/testing';
import { YahooService } from './yahoo.service';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { LoggingService } from '../../logging/logging.service';
import { of, throwError } from 'rxjs';

describe('YahooService', () => {
  let service: YahooService;
  const httpService = { get: jest.fn() };
  const configService = {
    get: jest.fn((key: string) => {
      if (key === 'YAHOO_FINANCE_URL') return 'https://yfapi.net';
      if (key === 'YAHOO_FINANCE_API_KEY') return 'test-key';
      return undefined;
    }),
  };
  const logger = { info: jest.fn(), error: jest.fn(), warn: jest.fn() };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        YahooService,
        { provide: HttpService, useValue: httpService },
        { provide: ConfigService, useValue: configService },
        { provide: LoggingService, useValue: logger },
      ],
    }).compile();

    service = module.get<YahooService>(YahooService);
  });

  it('logs historical data responses', async () => {
    httpService.get.mockReturnValue(of({ data: { chart: { result: [] } } }));

    await service.getHistoricalData(['AAPL'], '1d', '1mo', 10);

    expect(logger.info).toHaveBeenCalledWith(
      'External API request success',
      expect.objectContaining({
        service: 'yahoo-finance',
        operation: 'getHistoricalData',
        payload: {
          symbols: ['AAPL'],
          interval: '1d',
          range: '1mo',
          limit: 10,
        },
        result: expect.anything(),
        durationMs: expect.any(Number),
      })
    );
  });

  it('logs historical data errors', async () => {
    httpService.get.mockReturnValue(throwError(() => new Error('boom')));

    const result = await service.getHistoricalData(['AAPL'], '1d', '1mo', 10);

    expect(result).toEqual({});
    expect(logger.error).toHaveBeenCalledWith(
      'External API request error',
      expect.objectContaining({
        service: 'yahoo-finance',
        operation: 'getHistoricalData',
        payload: {
          symbols: ['AAPL'],
          interval: '1d',
          range: '1mo',
          limit: 10,
        },
        error: expect.anything(),
        durationMs: expect.any(Number),
      })
    );
  });

  it('logs stock quote responses', async () => {
    httpService.get.mockReturnValue(of({ data: { quoteSummary: { result: [{ ok: true }] } } }));

    await service.getStockQuote('AAPL');

    expect(logger.info).toHaveBeenCalledWith(
      'External API request success',
      expect.objectContaining({
        service: 'yahoo-finance',
        operation: 'getStockQuote',
        payload: expect.objectContaining({
          path: '/quoteSummary/AAPL',
        }),
        result: expect.anything(),
        durationMs: expect.any(Number),
      })
    );
  });

  it('logs market summary responses', async () => {
    httpService.get.mockReturnValue(of({ data: { marketSummaryResponse: { result: [{ ok: true }] } } }));

    await service.getMarketSummary();

    expect(logger.info).toHaveBeenCalledWith(
      'External API request success',
      expect.objectContaining({
        service: 'yahoo-finance',
        operation: 'getMarketSummary',
        payload: expect.objectContaining({
          path: '/market/get-summary',
        }),
        result: expect.anything(),
        durationMs: expect.any(Number),
      })
    );
  });

  it('logs trending symbol responses', async () => {
    httpService.get.mockReturnValue(of({ data: { finance: { result: [{ quotes: [{ ok: true }] }] } } }));

    await service.getTrendingSymbols('US');

    expect(logger.info).toHaveBeenCalledWith(
      'External API request success',
      expect.objectContaining({
        service: 'yahoo-finance',
        operation: 'getTrendingSymbols',
        payload: expect.objectContaining({
          path: '/trending',
        }),
        result: expect.anything(),
        durationMs: expect.any(Number),
      })
    );
  });

  it('logs company detail responses', async () => {
    httpService.get.mockReturnValue(of({ data: { quoteSummary: { result: [{ ok: true }] } } }));

    await service.getCompanyDetails('AAPL');

    expect(logger.info).toHaveBeenCalledWith(
      'External API request success',
      expect.objectContaining({
        service: 'yahoo-finance',
        operation: 'getCompanyDetails',
        payload: expect.objectContaining({
          path: '/quoteSummary/AAPL',
        }),
        result: expect.anything(),
        durationMs: expect.any(Number),
      })
    );
  });
});
