import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, of, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { environment } from '../../../environments/environment';

export interface Flight {
    id: string;
    aircraft: {
        model: string;
        registration: string;
    };
    airline: {
        name: string;
    };
    origin: {
        name: string;
        code: string;
    };
    destination: {
        name: string;
        code: string;
    };
    status: {
        text: string;
        currentLocation: {
            latitude: number;
            longitude: number;
        };
    };
}

@Injectable({
    providedIn: 'root'
})
export class FlightRadarService {
    private readonly baseUrl = environment.flightRadar24.endpoint; // FlightRadar24 API base URL
    private readonly apiKey = environment.flightRadar24.apiKey; // FlightRadar24 API key

    constructor(private http: HttpClient) {
        console.log('STEP 1: FlightRadarService initialized');
    }

    private getHeaders(): HttpHeaders {
        return new HttpHeaders()
            .set('Accept', 'application/json')
            .set('Accept-Version', 'v1')
            .set('Authorization', `Bearer ${this.apiKey}`);
    }

    /**
     * Fetch flights in a geographic bounding box
     * @param lat1 - Latitude of bottom-left corner
     * @param lon1 - Longitude of bottom-left corner
     * @param lat2 - Latitude of top-right corner
     * @param lon2 - Longitude of top-right corner
     */
    getFlightsByBoundingBox(lat1: number, lon1: number, lat2: number, lon2: number): Observable<Array<Flight>> {
        console.log('STEP 2: Fetching flights by bounding box', { lat1, lon1, lat2, lon2 });
        const url = `${this.baseUrl}/live/flight-positions/full?bounds=${lat1},${lat2},${lon1},${lon2}`;
        const headers = this.getHeaders();
        console.log("Firing FlightRadar24 with url: ", url, headers);
        
        // return this.http.get(url, { headers }).pipe(
        //     catchError((error: HttpErrorResponse) => {
        //         if (error.error instanceof ErrorEvent) {
        //             // Client-side or network error
        //             console.error('STEP 3: Client-side error:', error.error.message);
        //         } else {
        //             // Backend error
        //             console.error(`STEP 3: Backend returned code ${error.status}, body was: ${error.error}`);
        //         }
        //         return throwError(() => new Error('Failed to fetch flights.'));
        //     })
        // );

        // Mock data for 100 flights
        const mockFlights: Flight[] = Array.from({ length: 100 }, (_, index) => {
            const originLat = lat1 + (lat2 - lat1) * Math.random();
            const originLon = lon1 + (lon2 - lon1) * Math.random();
            const destLat = lat1 + (lat2 - lat1) * Math.random();
            const destLon = lon1 + (lon2 - lon1) * Math.random();
            const progress = Math.random(); // Random progress between origin and destination

            return {
            id: `flight${index + 1}`,
            aircraft: {
                model: `Model ${index + 1}`,
                registration: `Reg${index + 1}`
            },
            airline: {
                name: `Airline ${index + 1}`
            },
            origin: {
                name: `Origin ${index + 1}`,
                code: `ORG${index + 1}`,
                latitude: originLat,
                longitude: originLon
            },
            destination: {
                name: `Destination ${index + 1}`,
                code: `DST${index + 1}`,
                latitude: destLat,
                longitude: destLon
            },
            status: {
                text: `Status ${index + 1}`,
                currentLocation: {
                latitude: originLat + (destLat - originLat) * progress,
                longitude: originLon + (destLon - originLon) * progress
                }
            }
            };
        });

        // Return a properly structured response with flights property
        return of(mockFlights);
    }

    getFlightById(flightId: string): Observable<any> {
        console.log('STEP 4: Fetching flight by ID', flightId);
        const url = `${this.baseUrl}/flight-tracks?flight_id=${flightId}`;
        const headers = this.getHeaders();
        console.log('FlightRadar fetch by ID', { url, headers });

        // Mock data for a single flight
        const mockFlight = {
            flight: `Flight ${flightId}`,
            ident: `Ident ${flightId}`,
            r24_id: `R24_ID ${flightId}`,
            aircraft: {
            type: `Aircraft Type ${flightId}`,
            registration: `Aircraft Reg ${flightId}`
            },
            origin: `Origin ${flightId}`,
            destination: `Destination ${flightId}`,
            altitude: 10000 + Math.random() * 10000,
            speed: 200 + Math.random() * 200,
            tracks: Array.from({ length: 10 }, (_, index) => ({
            trackId: `${flightId}-${index + 1}`,
            lat: 40 + Math.random() * 10,
            lon: -80 + Math.random() * 10
            }))
        };
        return of({ flight: mockFlight });
        
    }

    getAirportsByIcao(icao: string): Observable<any> {
        console.log('STEP 5: Fetching airport by ICAO code', icao);
        const url = `${this.baseUrl}/airport/${icao}`;
        const headers = this.getHeaders();

        return this.http.get(url, { headers }).pipe(
            catchError((error) => {
                console.error('Error fetching airport by ICAO code', error);
                return throwError(() => new Error('Failed to fetch airport.'));
            })
        );
    }   
}
