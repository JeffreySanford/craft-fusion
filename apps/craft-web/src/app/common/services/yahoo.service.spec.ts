import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { YahooService, HistoricalData } from './yahoo.service';
import { environment } from '../../../environments/environment';

// vitest globals
import { describe, it, expect, beforeEach, afterEach } from 'vitest';

describe('YahooService', () => {
  let service: YahooService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [YahooService],
    });
    service = TestBed.inject(YahooService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('builds correct request URL and returns the response', () => {
    const apiResponse = { AAPL: { timestamp: [1, 2], close: [10, 20] } };
    const expected: HistoricalData[] = [
      {
        symbol: 'AAPL',
        data: [
          { date: new Date(1 * 1000), close: 10 },
          { date: new Date(2 * 1000), close: 20 },
        ],
      },
    ];

    const symbols = ['AAPL'];
    service.getHistoricalData(symbols, '1d', '1y', 100).subscribe(res => {
      expect(res).toEqual(expected);
    });

    const req = httpMock.expectOne(r =>
      r.url.includes(environment.yahooFinance.url) &&
      r.params.get('symbols') === 'AAPL'
    );
    expect(req.request.method).toBe('GET');
    req.flush(apiResponse);
  });

  it('falls back to mock data on error', () => {
    const symbols = ['TEST'];
    service.getHistoricalData(symbols).subscribe(res => {
      // should return an array (empty) when the HTTP call fails
      expect(res).toBeDefined();
      expect(Array.isArray(res)).toBe(true);
      expect(res.length).toBe(0);
    });

    const req = httpMock.expectOne(r => r.url.includes(environment.yahooFinance.url));
    req.error(new ErrorEvent('Network error'));
  });
});
