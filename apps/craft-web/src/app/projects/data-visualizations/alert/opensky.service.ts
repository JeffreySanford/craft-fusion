import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

import { Observable } from 'rxjs';

export interface OpenSkyFlight {
  icao24: string;
  callsign: string;
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
  sensors: any;
  geo_altitude: number;
  squawk: string;
  spi: boolean;
  position_source: number;
}

@Injectable({ providedIn: 'root' })
export class OpenSkyService {
  private apiUrl = '/api/opensky';
  // Username/password not used in demo mode

  constructor(private http: HttpClient) {}

  /**
   * Fetch flights in a bounding box (lat/lon)
   */
  /**
   * Fetch flights in a bounding box (lat/lon) via backend proxy
   */
  getNearbyFlights(lamin: number, lomin: number, lamax: number, lomax: number): Observable<any> {
    // The backend proxy should expose a bounding box endpoint, e.g. /api/opensky/nearby?lamin=...&lomin=...&lamax=...&lomax=...
    const url = `${this.apiUrl}/nearby?lamin=${lamin}&lomin=${lomin}&lamax=${lamax}&lomax=${lomax}`;
    return this.http.get(url);
  }
}
