import { TestBed } from '@angular/core/testing';
import { describe, it, expect, beforeEach } from 'vitest';
import { FlightRadarService } from './flightradar.service';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { firstValueFrom } from 'rxjs';

describe('FlightRadarService', () => {
  let service: FlightRadarService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [FlightRadarService],
    });
    service = TestBed.inject(FlightRadarService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('getFlightsByBoundingBox returns 100 mock flights', async () => {
    const flights = await firstValueFrom(service.getFlightsByBoundingBox(0, 0, 1, 1));
    expect(flights.length).toBe(100);
    expect(flights[0].id).toBeDefined();
  });

  it('getFlightById returns object containing flight', async () => {
    const result = await firstValueFrom(service.getFlightById('ABC123'));
    expect(result.flight).toBeDefined();
  });
});
