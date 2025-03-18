import { Injectable, Inject, forwardRef } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable, tap, catchError } from 'rxjs';
import { environment } from '../../../environments/environment';
import { environment as production } from '../../../environments/environment.prod';
import { LoggerService } from './logger.service';
import { User } from './user-state.service';

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

  constructor(
    private http: HttpClient,
    @Inject(forwardRef(() => LoggerService)) private logger: LoggerService
  ) {
    // Register service with logger
    this.logger.registerService('ApiService');
    this.logger.info('API Service initialized', {
      production: this.isProduction,
      apiUrl: this.apiUrl
    });
  }

  private getHeaders(): HttpHeaders {
    return new HttpHeaders({
      'Content-Type': 'application/json',
      Authorization: 'Bearer YOUR_TOKEN_HERE', // Replace with dynamic token logic
    });
  }

  private getFullUrl(endpoint: string): string {
    // Remove leading slash if present to avoid double slashes
    endpoint = endpoint.replace(/^\/+/, '');
    return `${this.apiUrl}/${endpoint}`;
  }

  // 🛡️ API CRUD Operations
  get<T>(endpoint: string, options?: any): Observable<T> {
    const url = this.getFullUrl(endpoint);
    const callId = this.logger.startServiceCall('ApiService', 'GET', url);
    
    return this.http.get<T>(url, { headers: this.getHeaders() }).pipe(
      tap(response => {
        this.logger.endServiceCall(callId, 200);
        this.logger.debug(`GET ${endpoint} succeeded`);
      }),
      catchError(error => {
        this.logger.endServiceCall(callId, error.status || 500);
        this.logger.error(`GET ${endpoint} failed`, { 
          status: error.status,
          message: error.message
        });
        throw error;
      })
    );
  }

  post<T, R>(endpoint: string, body: T): Observable<R> {
    const url = `${this.apiUrl}/${endpoint}`;
    const callId = this.logger.startServiceCall('ApiService', 'POST', url);
    
    return this.http.post<R>(url, body, { headers: this.getHeaders() }).pipe(
      tap(response => {
        this.logger.endServiceCall(callId, 200);
        this.logger.debug(`POST ${endpoint} succeeded`);
      }),
      catchError(error => {
        this.logger.endServiceCall(callId, error.status || 500);
        this.logger.error(`POST ${endpoint} failed`, { 
          status: error.status,
          message: error.message
        });
        throw error;
      })
    );
  }

  put<T>(endpoint: string, body: T): Observable<T> {
    const url = `${this.apiUrl}/${endpoint}`;
    const callId = this.logger.startServiceCall('ApiService', 'PUT', url);
    
    return this.http.put<T>(url, body, { headers: this.getHeaders() }).pipe(
      tap(response => {
        this.logger.endServiceCall(callId, 200);
        this.logger.debug(`PUT ${endpoint} succeeded`);
      }),
      catchError(error => {
        this.logger.endServiceCall(callId, error.status || 500);
        this.logger.error(`PUT ${endpoint} failed`, { 
          status: error.status,
          message: error.message
        });
        throw error;
      })
    );
  }

  delete<T>(endpoint: string): Observable<T> {
    const url = `${this.apiUrl}/${endpoint}`;
    const callId = this.logger.startServiceCall('ApiService', 'DELETE', url);
    
    return this.http.delete<T>(url, { headers: this.getHeaders() }).pipe(
      tap(response => {
        this.logger.endServiceCall(callId, 200);
        this.logger.debug(`DELETE ${endpoint} succeeded`);
      }),
      catchError(error => {
        this.logger.endServiceCall(callId, error.status || 500);
        this.logger.error(`DELETE ${endpoint} failed`, { 
          status: error.status,
          message: error.message
        });
        throw error;
      })
    );
  }

  /**
   * Fetches the current user state.
   * @returns An observable of the user state.
   */
  getUserState(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/users`, { headers: this.getHeaders() });
  }

  /**
   * Updates the user state.
   * @param userState - The new user state.
   * @returns An observable of the updated user state.
   */
  updateUserState(userState: any): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/users`, userState, { headers: this.getHeaders() });
  }

  /**
   * Deletes the user state.
   * @returns An observable of the deletion result.
   */
  deleteUserState(): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/users`, { headers: this.getHeaders() });
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

      // Remove extra "/api" if Nest is already exposing "/api/logs"
      this.apiUrl = `${protocol}://${host}:${server.port}`;
      this.logger.info(`API URL set to ${this.apiUrl}`);
    } else {
      this.apiUrl = '';
      this.logger.error(`Server with name '${serverName}' not found`);
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

  /**
   * Handles an array of strings.
   * @param data - An array of strings.
   * @returns A processed result.
   */
  handleStringArray(data: string[]): any {
    // Implement your logic here
    console.log('Handling string array:', data);
    // Example: Return the length of each string
    return data.map(str => str.length);
  }

  getLogs(limit: number, level?: string): Observable<any> {
    let params = new HttpParams().set('limit', limit.toString());
    
    // Only add level param if it has a value
    if (level && level.trim()) {
      params = params.set('level', level);
    }

    return this.http.get(`${this.apiUrl}/logs`, { params });
  }

  getAllUsers(): Observable<User[]> {
    // Updated endpoint from '/api/user/getAllUsers' to '/api/users'
    return this.http.get<User[]>('/api/users');
  }

  getUserById(id: string): Observable<User> {
    return this.http.get<User>(`/api/users/${id}`);
  }
}
