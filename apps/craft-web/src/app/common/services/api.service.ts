import { Injectable, Inject, forwardRef } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
// Add ResponseType import for better typing
import { Observable, tap, catchError } from 'rxjs';
import { environment } from '../../../environments/environment';
import { environment as production } from '../../../environments/environment.prod';
import { LoggerService } from './logger.service';
import { User } from './user-state.service';

/**
 * API Service for interacting with backend endpoints
 * 
 * This service provides a standardized interface for making HTTP requests to the API.
 * It works with Ward Bell's state mechanism and Dan Wahlin's RXJS state methodology
 * by returning Observables that can be directly consumed by state stores.
 * 
 * See the STATE-MANAGEMENT.md documentation for details on the state architecture.
 */
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
    // In development, use relative URLs so the proxy works
    if (!this.isProduction) {
      endpoint = endpoint.replace(/^\/+/, '');
      return `/api/${endpoint}`;
    }
    // In production, use the full API URL
    endpoint = endpoint.replace(/^\/+/, '');
    return `${this.apiUrl}/${endpoint}`;
  }

  // 🛡️ API CRUD Operations
  /**
   * Creates HTTP GET request to specified endpoint
   * 
   * @param endpoint - API endpoint to request
   * @param options - Optional HTTP request options
   * @returns Observable<T> - Observable that can be subscribed to by state stores
   */
  get<T>(endpoint: string, options?: any): Observable<T> {
    const url = this.getFullUrl(endpoint);
    const callId = this.logger.startServiceCall('ApiService', 'GET', url);
    
    // Create options but don't allow overriding observe
    const httpOptions = { 
      ...options,
      headers: this.getHeaders(), 
    };
    
    // Use explicit type casting for the HTTP call
    return this.http.get<T>(url, httpOptions).pipe(
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
    ) as Observable<T>; // Explicitly cast the return type
  }

  post<T, R>(endpoint: string, body: T, options?: any): Observable<R> {
    const url = this.getFullUrl(endpoint);
    const callId = this.logger.startServiceCall('ApiService', 'POST', url);

    const httpOptions = {
      ...options,
      headers: this.getHeaders(),
    };
    
    return this.http.post<R>(url, body, httpOptions).pipe(
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
    ) as Observable<R>;
  }

  put<T>(endpoint: string, body: T, options?: any): Observable<T> {
    const url = this.getFullUrl(endpoint);
    const callId = this.logger.startServiceCall('ApiService', 'PUT', url);

    const httpOptions = {
      ...options,
      headers: this.getHeaders(),
    };
    
    return this.http.put<T>(url, body, httpOptions).pipe(
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
    ) as Observable<T>;
  }

  delete<T>(endpoint: string, options?: any): Observable<T> {
    const url = this.getFullUrl(endpoint);
    const callId = this.logger.startServiceCall('ApiService', 'DELETE', url);

    const httpOptions = {
      ...options,
      headers: this.getHeaders(),
    };
    
    return this.http.delete<T>(url, httpOptions).pipe(
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
    ) as Observable<T>;
  }

  /**
   * Fetches the current user state.
   * @returns An observable of the user state.
   */
  getUserState(): Observable<any> {
    // Use getFullUrl for proxy compatibility
    return this.http.get<any>(this.getFullUrl('users'), { headers: this.getHeaders() });
  }

  /**
   * Updates the user state.
   * @param userState - The new user state.
   * @returns An observable of the updated user state.
   */
  updateUserState(userState: any): Observable<any> {
    // Use getFullUrl for proxy compatibility
    return this.http.put<any>(this.getFullUrl('users'), userState, { headers: this.getHeaders() });
  }

  /**
   * Deletes the user state.
   * @returns An observable of the deletion result.
   */
  deleteUserState(): Observable<any> {
    // Use getFullUrl for proxy compatibility
    return this.http.delete<any>(this.getFullUrl('users'), { headers: this.getHeaders() });
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
    if (level && level.trim()) {
      params = params.set('level', level);
    }
    // Use getFullUrl for proxy compatibility
    return this.http.get(this.getFullUrl('logs'), { params });
  }

  getAllUsers(): Observable<User[]> {
    // Use getFullUrl for proxy compatibility
    return this.http.get<User[]>(this.getFullUrl('users'));
  }

  getUserById(id: string): Observable<User> {
    // Use getFullUrl for proxy compatibility
    return this.http.get<User>(this.getFullUrl(`users/${id}`));
  }
}
