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
}