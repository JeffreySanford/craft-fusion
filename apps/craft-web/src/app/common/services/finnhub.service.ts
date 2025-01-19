import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
    providedIn: 'root'
})
export class FinnhubService {
    private apiUrl = 'http://localhost:3000/finnhub'; // Adjust the URL as needed

    constructor(private http: HttpClient) {}

    getStockData(symbol: string): Observable<any> {
        return this.http.get<any>(`${this.apiUrl}/stock/${symbol}`);
    }

    getCryptoData(symbol: string): Observable<any> {
        return this.http.get<any>(`${this.apiUrl}/crypto/${symbol}`);
    }

    getForexData(symbol: string): Observable<any> {
        return this.http.get<any>(`${this.apiUrl}/forex/${symbol}`);
    }
}