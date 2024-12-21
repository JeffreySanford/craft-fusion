import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment.prod';

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  private isProduction = environment.production;
  private apiUrl = this.isProduction ? "https://jeffreysanford.us:3000/api" : 'https://localhost:3000';

  constructor(private http: HttpClient) {
    console.log('API Service: Production mode is', this.isProduction ? 'ON' : 'OFF');
    console.log(`API Service: Setting environment variable for API URL ${this.apiUrl}`);
  }

  private getHeaders(): HttpHeaders {
    return new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': 'Bearer YOUR_TOKEN_HERE' // Replace with your token logic
    });
  }

  get<T>(endpoint: string): Observable<T> {
    return this.http.get<T>(`${this.apiUrl}/${endpoint}`, { headers: this.getHeaders() });
  }

  post<T>(endpoint: string, body: T): Observable<T> {
    return this.http.post<T>(`${this.apiUrl}/${endpoint}`, body, { headers: this.getHeaders() });
  }

  put<T>(endpoint: string, body: T): Observable<T> {
    return this.http.put<T>(`${this.apiUrl}/${endpoint}`, body, { headers: this.getHeaders() });
  }

  delete<T>(endpoint: string): Observable<T> {
    return this.http.delete<T>(`${this.apiUrl}/${endpoint}`, { headers: this.getHeaders() });
  }

  // allow for setting different server endpoint api/go for Go server and api for NestJS server (4000 and 3000)
  setApiUrl(api: string): void {
    this.apiUrl = this.isProduction ? `https://jeffreysanford.us:${api}` : `https://localhost:${api}`;
    console.log(`API Service: Setting API URL to ${this.apiUrl}`);
  }
}