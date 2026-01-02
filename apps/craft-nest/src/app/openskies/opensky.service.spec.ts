import { Test, TestingModule } from '@nestjs/testing';
import { OpenSkyService } from './opensky.service';
import { HttpService } from '@nestjs/axios';
import { LoggingService } from '../logging/logging.service';
import { firstValueFrom, of, throwError } from 'rxjs';

describe('OpenSkyService', () => {
  let service: OpenSkyService;
  const httpService = { get: jest.fn() };
  const logger = { info: jest.fn(), error: jest.fn() };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OpenSkyService,
        { provide: HttpService, useValue: httpService },
        { provide: LoggingService, useValue: logger },
      ],
    }).compile();

    service = module.get<OpenSkyService>(OpenSkyService);
  });

  it('logs flight data responses', async () => {
    httpService.get.mockReturnValue(of({ data: { states: [] } }));

    await firstValueFrom(service.fetchFlightData());

    expect(logger.info).toHaveBeenCalledWith(
      'External API request success',
      expect.objectContaining({
        service: 'opensky',
        operation: 'fetchFlightData',
        payload: { endpoint: 'https://opensky-network.org/api/states/all' },
        result: expect.anything(),
        durationMs: expect.any(Number),
      })
    );
  });

  it('logs airport data responses', async () => {
    httpService.get.mockReturnValue(of({ data: [] }));

    await firstValueFrom(service.fetchAirportData());

    expect(logger.info).toHaveBeenCalledWith(
      'External API request success',
      expect.objectContaining({
        service: 'opensky',
        operation: 'fetchAirportData',
        payload: { endpoint: 'https://api.opensky-network.org/airports' },
        result: expect.anything(),
        durationMs: expect.any(Number),
      })
    );
  });

  it('logs airline flight responses', async () => {
    httpService.get.mockReturnValue(of({ data: [] }));

    await firstValueFrom(service.fetchFlightDataByAirline('UAL'));

    expect(logger.info).toHaveBeenCalledWith(
      'External API request success',
      expect.objectContaining({
        service: 'opensky',
        operation: 'fetchFlightDataByAirline',
        payload: {
          endpoint: 'https://api.opensky-network.org/flights/airline',
          airline: 'UAL',
        },
        result: expect.anything(),
        durationMs: expect.any(Number),
      })
    );
  });

  it('logs aircraft flight responses', async () => {
    httpService.get.mockReturnValue(of({ data: [] }));

    await firstValueFrom(service.fetchFlightDataByAircraft('abc123'));

    expect(logger.info).toHaveBeenCalledWith(
      'External API request success',
      expect.objectContaining({
        service: 'opensky',
        operation: 'fetchFlightDataByAircraft',
        payload: {
          endpoint: 'https://api.opensky-network.org/flights/aircraft',
          aircraft: 'abc123',
        },
        result: expect.anything(),
        durationMs: expect.any(Number),
      })
    );
  });

  it('logs errors for flight data requests', async () => {
    httpService.get.mockReturnValue(throwError(() => new Error('boom')));

    await expect(firstValueFrom(service.fetchFlightData())).rejects.toThrow('boom');

    expect(logger.error).toHaveBeenCalledWith(
      'External API request error',
      expect.objectContaining({
        service: 'opensky',
        operation: 'fetchFlightData',
        payload: { endpoint: 'https://opensky-network.org/api/states/all' },
        error: expect.anything(),
        durationMs: expect.any(Number),
      })
    );
  });
});
