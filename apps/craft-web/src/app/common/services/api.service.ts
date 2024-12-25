import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';
import { environment as production } from 'src/environments/environment.prod';
export interface Server {
  name: string;
  language: string;
  api: string;
  port: number;
  swagger: string;
}

@Injectable({
  providedIn: 'root',
})
export class ApiService {
  private isProduction = environment.production;
  private apiUrl = `${environment.apiUrl}:${environment.nestPort}/api`;
  private recordSize = 100; // Default record size
  
  private servers: Server[] = [
      {
        name: 'Nest',
        language: 'NestJS (node.js)',
        api: '/api',
        port: 3000,
        swagger: '/api/swagger',
      },
      {
        name: 'Go',
        language: 'Go',
        api: '',
        port: 4000,
        swagger: '/swagger',
      },
    ];

    private server = this.servers[0];


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
    const server = this.servers.find(server => server.name === api);
    
    if (server) {
      this.apiUrl = this.isProduction ? `http://${production.host}:${server.port}/${server.api}` : `http://${environment.host}:${server.port}${server.api}`;

      const apiEndpoint = this.apiUrl + server.api;
      console.log(`API Service: Setting API URL to ${apiEndpoint}`);
      
      return apiEndpoint;
    } else {
      console.error('API Service: Server API not found');

      return 'Server API not found';
    }
  }

  getApiUrl(): string {
    return this.apiUrl;
  }

  setRecordSize(size: number): void {
    this.recordSize = size;
    console.log(`API Service: Setting record size to ${this.recordSize}`);
  }

  setServerType(serverName: string): void {
    const server = this.servers.find(s => s.name === serverName);
    if (server) {
      this.server = server;
      console.log(`API Service: Setting server type to ${server.name}`);
    } else {
      console.error('API Service: Server not found');
    }
  }

  getPerformanceDetails(): void {
    console.log(`API Service: Performance details for ${this.recordSize} records on ${this.server} server`);
    // Add logic to fetch and display performance details
  }

  generatePerformanceReport(selectedServer: { language: string }, totalRecords: number, generationTimeLabel: string, roundtripLabel: string): string {
    return `Using the backend server language, ${selectedServer.language}, Mock record set of ${totalRecords} records was generated in ${generationTimeLabel} and delivered in ${roundtripLabel}.`;
  }
}
