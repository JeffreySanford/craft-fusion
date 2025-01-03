import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { environment as production } from '../../..//environments/environment.prod';

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

  // Default API URL set to NestJS server
  private apiUrl = `${environment.apiUrl}/api`;
  private recordSize = 100; // Default record size

  private servers: Server[] = [
    {
      name: 'Nest',
      language: 'NestJS (Node.js)',
      api: 'api',
      port: 3000,
      swagger: '/api/swagger',
    },
    {
      name: 'Go',
      language: 'Go',
      api: 'api-go',
      port: 4000,
      swagger: '/swagger',
    },
  ];

  private currentServer: Server = this.servers[0];

  constructor(private http: HttpClient) {
    console.log('API Service: Production mode is', this.isProduction ? 'ON' : 'OFF');
    console.log(`API Service: Initial API URL is ${this.apiUrl}`);
  }

  private getHeaders(): HttpHeaders {
    return new HttpHeaders({
      'Content-Type': 'application/json',
      Authorization: 'Bearer YOUR_TOKEN_HERE', // Replace with dynamic token logic
    });
  }

  // 🛡️ API CRUD Operations
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

  /**
   * Dynamically sets the server API URL based on the selected server name.
   * Updates `apiUrl` to point to the selected server.
   * @param serverName - Name of the server ('Nest' or 'Go')
   * @example
   * setApiUrl('Nest');
   * setApiUrl('Go');
   */
  setApiUrl(serverName: string): string {
    const server = this.servers.find(s => s.name === serverName);

    if (server) {
      this.currentServer = server;
      const protocol = this.isProduction ? 'https' : 'http';
      const host = this.isProduction ? production.host : environment.host;

      // Use the server's port instead of a hardcoded port
      this.apiUrl = `${protocol}://${host}:${server.port}/${server.api}`;
      console.log(`API Service: API URL set to ${this.apiUrl}`);
    } else {
      this.apiUrl = '';
      console.error(`API Service: Server with name '${serverName}' not found`);
    }

    return this.apiUrl;
  }

  /**
   * Gets the currently active API URL.
   * @returns The current API URL.
   */
  getApiUrl(): string {
    return this.apiUrl;
  }

  /**
   * Sets the number of records to fetch/generate.
   * @param size - The number of records.
   */
  setRecordSize(size: number): void {
    this.recordSize = size;
    console.log(`API Service: Record size set to ${this.recordSize}`);
  }

  /**
   * Selects the server by its name.
   * @param serverName - The name of the server.
   */
  setServerType(serverName: string): void {
    const server = this.servers.find(s => s.name === serverName);
    if (server) {
      this.currentServer = server;
      this.setApiUrl(serverName);
      console.log(`API Service: Server switched to ${server.name}`);
    } else {
      console.error('API Service: Server not found');
    }
  }

  /**
   * Logs performance details based on the current configuration.
   */
  getPerformanceDetails(): void {
    console.log(`API Service: Performance details for ${this.recordSize} records on ${this.currentServer.name} server`);
  }

  /**
   * Generates a performance report based on the selected server.
   * @param selectedServer - Selected server object.
   * @param totalRecords - Number of records generated.
   * @param generationTimeLabel - Time taken to generate records.
   * @param roundtripLabel - Time taken for round-trip delivery.
   * @returns A performance report string.
   */
  generatePerformanceReport(selectedServer: { language: string }, totalRecords: number, generationTimeLabel: string, roundtripLabel: string): string {
    return `Using the backend server language, ${selectedServer.language}, Mock record set of ${totalRecords} records was generated in ${generationTimeLabel} and delivered in ${roundtripLabel}.`;
  }
}
