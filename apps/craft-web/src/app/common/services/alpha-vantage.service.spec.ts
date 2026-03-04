import { TestBed } from '@angular/core/testing';
import { describe, it, expect, beforeEach } from 'vitest';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { AlphaVantageService } from './alpha-vantage.service';

describe('AlphaVantageService', () => {
  let service: AlphaVantageService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [AlphaVantageService],
    });
    service = TestBed.inject(AlphaVantageService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('getStockData should hit the correct URL', () => {
    const symbol = 'AAPL';
    service.getStockData(symbol).subscribe();
    const req = httpMock.expectOne(
      `https://www.alphavantage.co/query?function=TIME_SERIES_DAILY&symbol=${symbol}&apikey=${service['apiKey']}`
    );
    expect(req.request.method).toBe('GET');
    req.flush({});
  });

  it('getForexData should hit the correct URL', () => {
    const symbol = 'EUR';
    service.getForexData(symbol).subscribe();
    const req = httpMock.expectOne(
      `https://www.alphavantage.co/query?function=CURRENCY_EXCHANGE_RATE&from_currency=${symbol}&to_currency=USD&apikey=${service['apiKey']}`
    );
    expect(req.request.method).toBe('GET');
    req.flush({});
  });
});
