import { Test, TestingModule } from '@nestjs/testing';
import { FirmsService } from './firms.service';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { LoggingService } from '../logging/logging.service';
import { of } from 'rxjs';

describe('FirmsService', () => {
  let service: FirmsService;
  const httpService = { get: jest.fn() };
  const configService = {
    get: jest.fn((key: string) => {
      if (key === 'NASA_FIRMS_API_KEY') return 'test-key';
      if (key === 'NASA_FIRMS_BASE_URL') return 'https://firms.modaps.eosdis.nasa.gov/api/area';
      if (key === 'NASA_FIRMS_SOURCE') return 'VIIRS_SNPP_NRT';
      return undefined;
    }),
  };
  const logger = { info: jest.fn(), error: jest.fn(), warn: jest.fn() };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FirmsService,
        { provide: HttpService, useValue: httpService },
        { provide: ConfigService, useValue: configService },
        { provide: LoggingService, useValue: logger },
      ],
    }).compile();

    service = module.get<FirmsService>(FirmsService);
  });

  it('logs FIRMS responses', async () => {
    const csv = 'latitude,longitude,acq_date,acq_time,confidence,frp\n34.1,-118.2,2024-01-01,1230,75,12.3';
    httpService.get.mockReturnValue(of({ data: csv }));

    const result = await service.getActiveFires({
      lat: 34.05,
      lng: -118.25,
      radiusKm: 120,
      days: 2,
    });

    expect(result.length).toBe(1);
    expect(logger.info).toHaveBeenCalledWith(
      'External API request success',
      expect.objectContaining({
        service: 'nasa-firms',
        operation: 'getActiveFires',
        payload: expect.objectContaining({
          lat: 34.05,
          lng: -118.25,
        }),
        result: expect.anything(),
        durationMs: expect.any(Number),
      })
    );
  });
});
