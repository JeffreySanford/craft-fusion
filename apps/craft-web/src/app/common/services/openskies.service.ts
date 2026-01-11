import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
    providedIn: 'root'
})
export class OpenSkiesService {
    private apiUrl = 'http://localhost:3000/openskies'; // Replace with your NestJS backend URL

    constructor(private http: HttpClient) {}

    fetchFlightData(): Observable<any> {
        return this.http.get<any>(`${this.apiUrl}/fetchflightdata`);
    }

    fetchAirportData(): Observable<any> {
        return this.http.get<any>(`${this.apiUrl}/airports`);
    }

    fetchFlightDataByAirline(airline: string): Observable<any> {
        return this.http.get<any>(`${this.apiUrl}/flights/airline/${airline}`);
    }

    fetchFlightDataByAircraft(aircraft: string): Observable<any> {
        return this.http.get<any>(`${this.apiUrl}/flights/aircraft/${aircraft}`);
    }
}