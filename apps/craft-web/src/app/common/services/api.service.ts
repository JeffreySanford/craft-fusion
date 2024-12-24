import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root',
})
export class ApiService {
  private isProduction = environment.production;
  private apiUrl = `${environment.apiUrl}:${environment.nestPort}/api`;
  private recordSize = 100; // Default record size
  private serverType = 'NestJS'; // Default server type

  constructor(private http: HttpClient) {
    console.log('API Service: Production mode is', this.isProduction ? 'ON' : 'OFF');
    console.log(`API Service: Setting environment variable for API URL ${this.apiUrl}`);
  }

  private getHeaders(): HttpHeaders {
    return new HttpHeaders({
      'Content-Type': 'application/json',
      Authorization: 'Bearer YOUR_TOKEN_HERE', // Replace with your token logic
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
  /** The sets dynamic server name, port, and most importantly the apiUrl.  Details this and rewrite this function
   * @param api - The server endpoint to set
   * @example
   * setApiUrl('/api/go');
   * setApiUrl('/api');
   * 
   */

  setApiUrl(api: string): string {
    debugger
    const port = api === '/api/go' ? environment.goPort : environment.nestPort;
    this.apiUrl = this.isProduction ? `https://jeffreysanford.us:${port}` : `http://${environment.host}:${port}`;
    console.log(`API Service: Setting API URL to ${this.apiUrl}`);

    return this.apiUrl;
  }

  getApiUrl(): string {
    return this.apiUrl;
  }

  setRecordSize(size: number): void {
    this.recordSize = size;
    console.log(`API Service: Setting record size to ${this.recordSize}`);
  }

  setServerType(type: string): void {
    this.serverType = type;
    console.log(`API Service: Setting server type to ${this.serverType}`);
  }

  getPerformanceDetails(): void {
    console.log(`API Service: Performance details for ${this.recordSize} records on ${this.serverType} server`);
    // Add logic to fetch and display performance details
  }

  generatePerformanceReport(selectedServer: { language: string }, totalRecords: number, generationTimeLabel: string, roundtripLabel: string): string {
    return `Using the backend server language, ${selectedServer.language}, Mock record set of ${totalRecords} records was generated in ${generationTimeLabel} and delivered in ${roundtripLabel}.`;
  }
}
