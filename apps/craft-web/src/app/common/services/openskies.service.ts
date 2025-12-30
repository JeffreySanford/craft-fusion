import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
    providedIn: 'root'
})
export class OpenSkiesService {
    private apiUrl = 'http://localhost:3000/openskies'; // Replace with your NestJS backend URL

    constructor(private http: HttpClient) {}

    fetchFlightData(): Observable<unknown> {
        return this.http.get<unknown>(`${this.apiUrl}/fetchflightdata`);
    }

    fetchAirportData(): Observable<unknown> {
        return this.http.get<unknown>(`${this.apiUrl}/airports`);
    }

    fetchFlightDataByAirline(airline: string): Observable<unknown> {
        return this.http.get<unknown>(`${this.apiUrl}/flights/airline/${airline}`);
    }

    fetchFlightDataByAircraft(aircraft: string): Observable<unknown> {
        return this.http.get<unknown>(`${this.apiUrl}/flights/aircraft/${aircraft}`);
    }
}