import { Injectable, Inject, forwardRef } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';

import { Observable, tap, catchError, throwError, timer, switchMap, finalize } from 'rxjs';
import { environment } from '../../../environments/environment';
import { LoggerService } from './logger.service';
import { User } from './user.interface';                                            

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

  private apiUrl = '/api';                                                           
  private apiPrefix = '/api';                            
  private apiPrefixGo = '/api-go';                        
  private recordSize = 100;                       

  private readonly BASE_TIMEOUT = 10000;                                       
  private readonly MAX_RETRIES = 3;
  private serverStarting = false;
  private connectionAttempts = 0;
  private maxStartupRetries = 5;

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
      swagger: '/api-go/swagger',
    },
  ];

  private currentServer: Server = this.servers[0]!;

  private requestThrottler = new Map<string, number>();
  private activeRequests = new Set<string>();
  private readonly MAX_CONCURRENT_REQUESTS = 8;
  private readonly THROTTLE_WINDOW_MS = 1000;                   

  constructor(
    private http: HttpClient,
    @Inject(forwardRef(() => LoggerService)) private logger: LoggerService,
  ) {

    this.logger.registerService('ApiService');
    this.logger.info('API Service initialized', {
      production: this.isProduction,
      apiUrl: this.apiUrl,
    });
  }

  private getHeaders(): HttpHeaders {

    const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
    const authHeader = token ? `Bearer ${token}` : '';
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (authHeader) {
      headers['Authorization'] = authHeader;
    }

    this.logger.debug('ApiService.getHeaders', { hasToken: !!token, tokenPreview: token ? token.slice(0, 24) + '...' : null });
    return new HttpHeaders(headers);
  }

  private addSecurityHeaders(headers: HttpHeaders): HttpHeaders {
    return headers.set('X-Content-Type-Options', 'nosniff').set('X-Frame-Options', 'DENY').set('X-XSS-Protection', '1; mode=block');
  }

  private getTracingHeaders(): HttpHeaders {
    let headers = this.getHeaders();

    const traceId = window.crypto?.randomUUID?.() || Math.random().toString(36).slice(2);
    headers = headers.set('X-Request-ID', traceId);
    return this.addSecurityHeaders(headers);
  }

  private normalizeHeaders(headers?: HeadersInit | HttpHeaders | Record<string, string | string[]>): HttpHeaders | Record<string, string | string[]> | undefined {
    if (!headers) return undefined;
    if (headers instanceof HttpHeaders) return headers;

    try {

      if (typeof (headers as any).forEach === 'function') {
        const h = headers as Headers;
        const obj: Record<string, string> = {};
        h.forEach((value: string, key: string) => {
          obj[key] = value;
        });
        return new HttpHeaders(obj);
      }
    } catch (e) {

    }

    return headers as Record<string, string | string[]>;
  }

  private normalizeOptions(options?: any): {
    headers?: HttpHeaders | Record<string, string | string[]>;
    params?: HttpParams | Record<string, string | string[]>;
    [k: string]: any;
  } {
    const opts: any = { ...(options || {}) };
    if (opts.headers) {
      opts.headers = this.normalizeHeaders(opts.headers);
    }
    return opts;
  }

  private getFullUrl(endpoint: string): string {

    endpoint = endpoint.replace(/^\/+/, '');

    const baseUrl = this.apiUrl;

    const fullUrl = `${baseUrl}/${endpoint}`;
    this.logger.debug(`Constructed API URL: ${fullUrl}`);

    return fullUrl;
  }

  get<T>(
    endpoint: string,
    options?: { headers?: HttpHeaders | Record<string, string | string[]>; params?: HttpParams | Record<string, string | string[]>; [k: string]: any },
  ): Observable<T> {
    const url = this.getFullUrl(endpoint);
    const callId = this.logger.startServiceCall('ApiService', 'GET', url);
    const httpOptions = this.normalizeOptions(options);

    httpOptions.headers = this.getTracingHeaders();

    if (this.shouldThrottleRequest(url)) {
      return this.delayedRequest<T>(() => this.get(endpoint, options), 300);
    }

    this.trackRequest(url);

    this.logger.debug(`Making GET request to ${url}`, {
      endpoint,
      fullUrl: url,
      options: JSON.stringify(httpOptions),
      timestamp: new Date().toISOString(),
    });

    return this.http.get<T>(url, httpOptions).pipe(
      tap(response => {
        this.logger.endServiceCall(callId, 200);
        this.logger.debug(`GET ${endpoint} succeeded`, {
          responseReceived: true,
          url,
        });
      }),
      catchError(error => {
        this.releaseRequest(url);
        this.logger.endServiceCall(callId, error.status || 500);
        this.logger.error(`GET ${endpoint} failed`, {
          status: error.status,
          message: error.message,
          url,
          timestamp: new Date().toISOString(),
          errorObject: JSON.stringify(error),
        });

        console.error(`API Error Details:`, {
          url,
          status: error.status,
          message: error.message,
          error,
        });

        if (error.status === 504 || error.status === 0) {

          return throwError(() => error);
        }

        this.checkServerAvailability();

        throw error;
      }),
      finalize(() => {
        this.releaseRequest(url);
      }),
    ) as Observable<T>;
  }

  put<T>(
    endpoint: string,
    body: T,
    options?: { headers?: HttpHeaders | Record<string, string | string[]>; params?: HttpParams | Record<string, string | string[]>; [k: string]: any },
  ): Observable<T> {
    const url = this.getFullUrl(endpoint);
    const callId = this.logger.startServiceCall('ApiService', 'PUT', url);

    const httpOptions = this.normalizeOptions(options);
    httpOptions.headers = this.getTracingHeaders();

    return this.http.put<T>(url, body, httpOptions).pipe(
      tap(response => {
        this.logger.endServiceCall(callId, 200);
        this.logger.debug(`PUT ${endpoint} succeeded`);
      }),
      catchError(error => {
        this.logger.endServiceCall(callId, error.status || 500);
        this.logger.error(`PUT ${endpoint} failed`, {
          status: error.status,
          message: error.message,
        });
        throw error;
      }),
    ) as Observable<T>;
  }

  delete<T>(
    endpoint: string,
    options?: { headers?: HttpHeaders | Record<string, string | string[]>; params?: HttpParams | Record<string, string | string[]>; [k: string]: any },
  ): Observable<T> {
    const url = this.getFullUrl(endpoint);
    const callId = this.logger.startServiceCall('ApiService', 'DELETE', url);

    const httpOptions = this.normalizeOptions(options);
    httpOptions.headers = this.getTracingHeaders();

    return this.http.delete<T>(url, httpOptions).pipe(
      tap(response => {
        this.logger.endServiceCall(callId, 200);
        this.logger.debug(`DELETE ${endpoint} succeeded`);
      }),
      catchError(error => {
        this.logger.endServiceCall(callId, error.status || 500);
        this.logger.error(`DELETE ${endpoint} failed`, {
          status: error.status,
          message: error.message,
        });
        throw error;
      }),
    ) as Observable<T>;
  }

  getUserState(): Observable<unknown> {

    return this.http.get<unknown>(this.getFullUrl('users'), { headers: this.getHeaders() });
  }

  updateUserState(userState: unknown): Observable<unknown> {

    return this.http.put<unknown>(this.getFullUrl('users'), userState, { headers: this.getHeaders() });
  }

  deleteUserState(): Observable<unknown> {

    return this.http.delete<unknown>(this.getFullUrl('users'), { headers: this.getHeaders() });
  }

  setApiUrl(resource: string): string {
    this.logger.debug(`Setting API URL for resource: ${resource}`);

    if (resource === 'Go') {
      this.apiUrl = '/api-go';                               
      this.logger.debug(`Switched to Go API: ${this.apiUrl}`);
    } else {

      this.apiUrl = '/api';                                   
      this.logger.debug(`Switched to NestJS API: ${this.apiUrl}`);
    }

    return this.apiUrl;
  }

  getApiUrl(): string {
    return this.apiUrl;
  }

  setRecordSize(size: number): void {
    this.recordSize = size;
    console.log(`API Service: Record size set to ${this.recordSize}`);
  }

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

  getPerformanceDetails(): void {
    console.log(`API Service: Performance details for ${this.recordSize} records on ${this.currentServer.name} server`);
  }

  generatePerformanceReport(selectedServer: { language: string }, totalRecords: number, generationTimeLabel: string, roundtripLabel: string): string {
    return `Using the backend server language, ${selectedServer.language}, Mock record set of ${totalRecords} records was generated in ${generationTimeLabel} and delivered in ${roundtripLabel}.`;
  }

  handleStringArray(data: string[]): unknown {

    console.log('Handling string array:', data);

    return data.map(str => str.length);
  }

  getLogs(limit: number, level?: string): Observable<unknown> {
    let params = new HttpParams().set('limit', limit.toString());
    if (level && level.trim()) {
      params = params.set('level', level);
    }

    return this.http.get(this.getFullUrl('logs'), { params });
  }

  getAllUsers(): Observable<User[]> {

    return this.http.get<User[]>(this.getFullUrl('users'));
  }

  getUserById(id: string): Observable<User> {

    return this.http.get<User>(this.getFullUrl(`users/${id}`));
  }

  public get isServerStarting(): boolean {
    return this.serverStarting;
  }

  public authRequest<T>(
    method: string,
    endpoint: string,
    body?: unknown,
    options?: { headers?: HttpHeaders | Record<string, string | string[]>; params?: HttpParams | Record<string, string | string[]>; [k: string]: any },
  ): Observable<T> {

    console.log('🔍 Auth request details', {
      method,
      endpoint,
      fullUrl: this.getFullUrl(endpoint),
      bodyKeys: body ? Object.keys(body as Record<string, unknown>) : 'none',
      timestamp: new Date().toISOString(),
      options,
      isProduction: this.isProduction,
    });

    const enhancedOptions: Record<string, unknown> = {
      ...((options as Record<string, unknown>) || {}),
      timeout: this.BASE_TIMEOUT * 2,                                    
      retries: this.maxStartupRetries,
    };

    const debugHeaders = {
      headers: {
        'X-Debug-Timestamp': new Date().toISOString(),
        'X-Client-Info': navigator.userAgent,
      },
    };

    const finalOptions = {
      ...enhancedOptions,
      ...debugHeaders,
    };

    switch (method.toUpperCase()) {
      case 'GET':
        return this.get<T>(endpoint, finalOptions);
      case 'POST':

        console.log(`🔐 Making ${method} request to ${this.getFullUrl(endpoint)}`);
        return this.post<unknown, T>(endpoint, body, finalOptions) as unknown as Observable<T>;
      case 'PUT':
        return this.put<unknown>(endpoint, body, finalOptions) as unknown as Observable<T>;
      case 'DELETE':
        return this.delete<T>(endpoint, finalOptions) as unknown as Observable<T>;
      default:
        this.logger.error(`Unsupported HTTP method for auth request: ${method}`);
        return throwError(() => new Error(`Unsupported HTTP method: ${method}`));
    }
  }

  post<T = unknown, R = unknown>(
    endpoint: string,
    body: T,
    options?: { headers?: HttpHeaders | Record<string, string | string[]>; params?: HttpParams | Record<string, string | string[]>; [k: string]: any },
  ): Observable<R> {
    const url = this.getFullUrl(endpoint);
    const callId = this.logger.startServiceCall('ApiService', 'POST', url);

    const httpOptions = this.normalizeOptions(options);
    httpOptions.headers = this.getTracingHeaders();

    this.logger.debug(`Making POST request to ${url}`, {
      endpoint,
      baseUrl: this.apiUrl,
      fullUrl: url,
      isProduction: this.isProduction,
    });

    if (endpoint.includes('auth')) {
      console.log(`🌐 Network request details:`, {
        url,
        method: 'POST',
        bodyType: typeof body,
        hasCredentials: !!(body && typeof body === 'object' && 'username' in (body as any)),
        timestamp: Date.now(),
        options: Object.keys(httpOptions || {}),
      });
    }

    return this.http.post<R>(url, body, httpOptions).pipe(
      tap(response => {
        this.logger.endServiceCall(callId, 200);
        this.logger.debug(`POST ${endpoint} succeeded`);

        if (endpoint.includes('auth')) {
          console.log(`✅ Auth request succeeded`, {
            endpoint,
            responseReceived: true,
            responseType: typeof response,
          });
        }
      }),
      catchError(error => {
        this.logger.endServiceCall(callId, error.status || 500);
        this.logger.error(`POST ${endpoint} failed`, {
          status: error.status,
          message: error.message,
          url: url,
        });

        if (endpoint.includes('auth')) {
          console.error(`❌ Auth request failed: ${error.status}`, {
            message: error.message || 'No message',
            statusText: error.statusText,
            url: url,
            error: error,
          });

          this.checkServerAvailability();
        }

        throw error;
      }),
    ) as Observable<R>;
  }

  private checkServerAvailability(): void {
    this.logger.debug('Checking server availability...');

    fetch('/api/health', { method: 'HEAD', signal: (AbortSignal as any).timeout ? (AbortSignal as any).timeout(3000) : null })
      .then(response => {
        this.logger.info('Server availability check: Server is responding', {
          status: response.status,
          ok: response.ok,
        });
        this.serverStarting = false;
      })
      .catch(error => {

        fetch('/assets/ping.txt', { method: 'HEAD', signal: (AbortSignal as any).timeout ? (AbortSignal as any).timeout(2000) : null })
          .then(() => {
            this.logger.warn('Backend unavailable, but frontend assets are reachable');
          })
          .catch(() => {
            this.logger.error('Server availability check: Server is not responding', {
              error: error.message || 'Unknown error',
              timestamp: new Date().toISOString(),
            });
          });
        this.connectionAttempts++;
        if (this.connectionAttempts <= this.maxStartupRetries) {
          this.serverStarting = true;
          this.logger.warn(`Server might be starting up. Attempt ${this.connectionAttempts} of ${this.maxStartupRetries}`);
        } else {
          this.serverStarting = false;
          this.logger.error('Server appears to be offline after multiple attempts');
        }
      });
  }

  private shouldThrottleRequest(endpoint: string): boolean {

    if (this.activeRequests.size >= this.MAX_CONCURRENT_REQUESTS) {
      return true;
    }

    const now = Date.now();
    const lastRequest = this.requestThrottler.get(endpoint) || 0;

    if (now - lastRequest < this.THROTTLE_WINDOW_MS) {
      return true;                   
    }

    this.requestThrottler.set(endpoint, now);
    return false;
  }

  private trackRequest(endpoint: string): void {
    this.activeRequests.add(endpoint);
  }

  private releaseRequest(endpoint: string): void {
    this.activeRequests.delete(endpoint);
  }

  private delayedRequest<T>(requestFn: () => Observable<T>, delayMs: number): Observable<T> {
    return timer(delayMs).pipe(switchMap(() => requestFn()));
  }
}
