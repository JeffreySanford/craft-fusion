import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface OpenSkyFlight {
  icao24?: string;
  callsign?: string;
  origin_country?: string;
  time_position?: number;
  last_contact?: number;
  longitude?: number;
  latitude?: number;
  baro_altitude?: number;
  on_ground?: boolean;
  velocity?: number;
  true_track?: number;
  vertical_rate?: number;
  sensors?: number[];
  geo_altitude?: number;
  squawk?: string;
  spi?: boolean;
  position_source?: number;
}

@Injectable({
  providedIn: 'root',
})
export class OpenSkiesService {
  private apiUrl = `${environment.apiUrl}/api/opensky`;                                        

  constructor(private http: HttpClient) {}

  fetchFlightData(): Observable<OpenSkyFlight[]> {
    return this.http.get<OpenSkyFlight[]>(`${this.apiUrl}/fetchflightdata`);
  }

  fetchAirportData(): Observable<unknown> {
    return this.http.get<unknown>(`${this.apiUrl}/airports`);
  }

  fetchFlightDataByAirline(airline: string): Observable<OpenSkyFlight[]> {
    return this.http.get<OpenSkyFlight[]>(`${this.apiUrl}/flights/airline/${airline}`);
  }

  fetchFlightDataByAircraft(aircraft: string): Observable<OpenSkyFlight[]> {
    return this.http.get<OpenSkyFlight[]>(`${this.apiUrl}/flights/aircraft/${aircraft}`);
  }
}
