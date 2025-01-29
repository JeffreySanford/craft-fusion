import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

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

  constructor(private readonly httpService: HttpService) {}

  fetchFlightData(): Observable<Flight[]> {
    return this.httpService.get<OpenSkyResponse>(this.API_URL).pipe(
      map(response => response.data.states || [])
    );
  }

  fetchAirportData(): Observable<any> {
    return this.httpService.get('https://api.opensky-network.org/airports')
      .pipe(map(response => response.data));
  }

  fetchFlightDataByAirline(airline: string): Observable<Flight[]> {
    return this.httpService.get(`https://api.opensky-network.org/flights/airline?icao=${airline}`)
      .pipe(map(response => response.data));
  }

  fetchFlightDataByAircraft(aircraft: string): Observable<Flight[]> {
    return this.httpService.get(`https://api.opensky-network.org/flights/aircraft?icao24=${aircraft}`)
      .pipe(map(response => response.data));
  }
}