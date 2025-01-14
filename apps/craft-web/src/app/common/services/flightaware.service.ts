import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class FlightAwareService {
  private readonly baseUrl = environment.flightAware.endpoint; // FlightAware API base URL
  private readonly apiKey = environment.flightAware.apiKey; // FlightAware API key

  constructor(private http: HttpClient) {}

  /**
   * Search for flights within a geographic bounding box
   * @param lat1 - Latitude of bottom-left corner
   * @param lon1 - Longitude of bottom-left corner
   * @param lat2 - Latitude of top-right corner
   * @param lon2 - Longitude of top-right corner
   */
  searchFlights(lat1: number, lon1: number, lat2: number, lon2: number): Observable<any> {
    const url = `${this.baseUrl}/flights/search`;
    const params = new HttpParams().set('query', `bounds:[${lat1},${lon1},${lat2},${lon2}]`);
    const headers = new HttpHeaders().set('Accept', 'application/json').set('Accept-Version', 'v1').set('Authorization', `Bearer ${this.apiKey}`);

    console.log('Firing flightaware with url: ', url);
    return this.http.get(url, { headers, params }).pipe(
      catchError(error => {
        console.error('Error searching flights by bounding box', {
          message: error.message,
          status: error.status,
          statusText: error.statusText,
          url: error.url,
        });
        return throwError(() => new Error('Failed to search flights.'));
      }),
    );
  }
  /**
   * Fetch flights by aircraft type
   * @param aircraftType - Aircraft type (e.g., C130 for firefighting aircraft)
   */
  getFlightsByAircraftType(aircraftType: string): Observable<any> {
    const url = `${this.baseUrl}/flights`;
    const params = new HttpParams().set('type', aircraftType);
    const headers = new HttpHeaders().set('Accept', 'application/json').set('Authorization', `Bearer ${this.apiKey}`);

    return this.http.get(url, { headers, params }).pipe(
      catchError(error => {
        console.error('Error fetching flights by aircraft type', {
          message: error.message,
          status: error.status,
          statusText: error.statusText,
          url: error.url,
        });
        return throwError(() => new Error('Failed to fetch flights.'));
      }),
    );
  }

  /**
   * Fetch flight positions by flight ID
   * @param flightId - The ID of the flight
   */
  getFlightPositions(flightId: string): Observable<any> {
    const url = `${this.baseUrl}/flights/${flightId}/position`;
    const headers = new HttpHeaders().set('x-apikey', this.apiKey).set('Authorization', `Bearer ${this.apiKey}`);

    return this.http.get(url, { headers }).pipe(
      catchError(error => {
        console.error('Error fetching flight positions', {
          message: error.message,
          status: error.status,
          statusText: error.statusText,
          url: error.url,
        });
        return throwError(() => new Error('Failed to fetch flight positions.'));
      }),
    );
  }
}
