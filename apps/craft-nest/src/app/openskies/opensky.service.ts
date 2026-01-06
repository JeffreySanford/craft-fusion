import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { Observable, catchError, tap, throwError } from 'rxjs';
import { map } from 'rxjs/operators';
import { LoggingService } from '../logging/logging.service';
import { summarizeForLog } from '../logging/logging.utils';

export interface Flight {
  icao24?: string;
  callsign?: string;
  origin_country: string;
  time_position: number;
  last_contact: number;
  longitude: number;
  latitude: number;
  baro_altitude: number;
  on_ground: boolean;
  velocity: number;
  true_track: number;
  vertical_rate: number;
  sensors: number[];
  geo_altitude: number;
  squawk: string;
  spi: boolean;
  position_source: number;
}

export interface OpenSkyResponse {
  time: number;
  states: Flight[];
}

@Injectable()
export class OpenSkyService {
  private readonly API_URL = 'https://opensky-network.org/api/states/all';

  constructor(private readonly httpService: HttpService, private readonly logger: LoggingService) {}

  fetchFlightData(): Observable<Flight[]> {
    const payload = { endpoint: this.API_URL };
    const startTime = Date.now();
    return this.httpService.get<OpenSkyResponse>(this.API_URL).pipe(
      map(response => response.data.states || []),
      tap(data => {
        this.logSuccess('fetchFlightData', payload, data, startTime);
      }),
      catchError(error => {
        this.logError('fetchFlightData', payload, error, startTime);
        return throwError(() => error);
      }),
    );
  }

  fetchAirportData(): Observable<any> {
    const endpoint = 'https://api.opensky-network.org/airports';
    const payload = { endpoint };
    const startTime = Date.now();
    return this.httpService.get(endpoint).pipe(
      map(response => response.data),
      tap(data => {
        this.logSuccess('fetchAirportData', payload, data, startTime);
      }),
      catchError(error => {
        this.logError('fetchAirportData', payload, error, startTime);
        return throwError(() => error);
      }),
    );
  }

  fetchFlightDataByAirline(airline: string): Observable<Flight[]> {
    const endpoint = 'https://api.opensky-network.org/flights/airline';
    const payload = { endpoint, airline };
    const startTime = Date.now();
    return this.httpService.get(`${endpoint}?icao=${airline}`).pipe(
      map(response => response.data),
      tap(data => {
        this.logSuccess('fetchFlightDataByAirline', payload, data, startTime);
      }),
      catchError(error => {
        this.logError('fetchFlightDataByAirline', payload, error, startTime);
        return throwError(() => error);
      }),
    );
  }

  fetchFlightDataByAircraft(aircraft: string): Observable<Flight[]> {
    const endpoint = 'https://api.opensky-network.org/flights/aircraft';
    const payload = { endpoint, aircraft };
    const startTime = Date.now();
    return this.httpService.get(`${endpoint}?icao24=${aircraft}`).pipe(
      map(response => response.data),
      tap(data => {
        this.logSuccess('fetchFlightDataByAircraft', payload, data, startTime);
      }),
      catchError(error => {
        this.logError('fetchFlightDataByAircraft', payload, error, startTime);
        return throwError(() => error);
      }),
    );
  }

  private logSuccess(operation: string, payload: Record<string, unknown>, result: unknown, startTime: number): void {
    this.logger.info('External API request success', {
      service: 'opensky',
      operation,
      payload,
      result: summarizeForLog(result),
      durationMs: Date.now() - startTime,
      suppressConsole: true,
    });
  }

  private logError(operation: string, payload: Record<string, unknown>, error: unknown, startTime: number): void {
    this.logger.error('External API request error', {
      service: 'opensky',
      operation,
      payload,
      error,
      durationMs: Date.now() - startTime,
      suppressConsole: true,
    });
  }
}
