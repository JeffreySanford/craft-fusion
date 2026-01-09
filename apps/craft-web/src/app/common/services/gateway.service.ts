import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError, of, timer } from 'rxjs';
import { catchError, timeout, map, concatMap, delay, retryWhen, tap } from 'rxjs/operators';
import { LoggerService } from './logger.service';
import { NotificationService } from './notification.service';

@Injectable({
  providedIn: 'root',
})
export class GatewayService {
  private readonly BASE_TIMEOUT = 10000;
  private readonly MAX_RETRIES = 3;
  private isOfflineMode = false;
  private serverStarting = false;
  private connectionAttempts = 0;
  private maxStartupRetries = 5;

  constructor(
    private http: HttpClient,
    private logger: LoggerService,
    private notificationService: NotificationService,
  ) {
    this.logger.registerService('GatewayService');
  }

  public request<T>(
    method: string,
    endpoint: string,
    options: {
      body?: unknown;
      headers?: HttpHeaders;
      params?: HttpParams;
      responseType?: 'json' | 'arraybuffer' | 'blob' | 'text';
      timeout?: number;
      retries?: number;
      isAuthRequest?: boolean;
    } = {},
  ): Observable<T> {

    const reqTimeout = options.timeout || this.BASE_TIMEOUT;
    const maxRetries = options.retries || this.MAX_RETRIES;
    const isAuthRequest = options.isAuthRequest || false;

    const url = this.getFullApiUrl(endpoint);
    const trackingId = this.generateRequestId();

    this.logger.debug(`${method} request initiated`, {
      endpoint,
      timeout: reqTimeout,
      retries: maxRetries,
      trackingId,
      isAuthRequest,
    });

    const responseType = options.responseType ?? 'json';
    const httpOptions = {
      headers: options.headers,
      params: options.params,
      responseType,
      body: options.body,
    } as {
      headers?: HttpHeaders;
      params?: HttpParams;
      responseType: 'json' | 'arraybuffer' | 'blob' | 'text';
      body?: unknown;
    };

    let request: Observable<T>;

    switch (method.toUpperCase()) {
      case 'GET':
      case 'POST':
      case 'PUT':
      case 'DELETE':
        request = this.http.request(method.toUpperCase(), url, httpOptions) as Observable<T>;
        break;
      default:
        this.logger.error(`Unsupported HTTP method: ${method}`);
        return throwError(() => new Error(`Unsupported HTTP method: ${method}`));
    }

    return request.pipe(
      timeout(reqTimeout),
      retryWhen(errors =>
        errors.pipe(
          concatMap((error: HttpErrorResponse, index) => {
            const retryAttempt = index + 1;

            const isServerStarting = error.status === 0 || (error.error && typeof error.error.message === 'string' && error.error.message.includes('ECONNREFUSED'));

            if (isAuthRequest && isServerStarting && this.connectionAttempts < this.maxStartupRetries) {

              if (!this.serverStarting) {
                this.serverStarting = true;
                this.notificationService.showInfo('Server appears to be starting up. Will retry connecting automatically.', 'Server Starting');
              }

              this.connectionAttempts++;

              const startupDelay = Math.min(Math.pow(2, this.connectionAttempts) * 1000, 30000);                  

              this.logger.info(`Server seems to be starting up, retry in ${startupDelay / 1000}s...`, {
                endpoint,
                attempt: this.connectionAttempts,
                maxAttempts: this.maxStartupRetries,
                error: error.message,
                trackingId,
              });

              return timer(startupDelay);
            }

            if (retryAttempt <= maxRetries && (error.status === 0 || error.status === 504 || error.status === 502)) {

              const retryDelay = Math.pow(2, retryAttempt - 1) * 1000;

              this.logger.warn(`Connection issue, retrying in ${retryDelay}ms...`, {
                endpoint,
                attempt: retryAttempt,
                maxRetries: maxRetries,
                error: error.message,
                trackingId,
              });

              if (retryAttempt === 1) {
                this.notificationService.showWarning(`Server connection issue. Retrying... (${retryAttempt}/${maxRetries})`, 'Connection Issue');
              }

              return of(error).pipe(delay(retryDelay));
            }

            return throwError(() => error);
          }),
        ),
      ),
      tap(response => {

        if (this.serverStarting) {
          this.serverStarting = false;
          this.connectionAttempts = 0;

          this.notificationService.showSuccess('Successfully connected to the server!', 'Connection Established');
        }

        this.logger.debug(`${method} request successful`, {
          endpoint,
          trackingId,
          responseStatus: 'success',
        });
        return response;
      }),
      catchError(error => {

        if (error.status === 0 || error.status === 504) {
          this.isOfflineMode = true;

          if (this.serverStarting && this.connectionAttempts >= this.maxStartupRetries) {
            this.notificationService.showWarning(`Server appears to be unavailable after ${this.maxStartupRetries} attempts. Switching to offline mode.`, 'Offline Mode');
            this.serverStarting = false;
          }

          this.logger.warn('Network connectivity issue detected', {
            endpoint,
            errorStatus: error.status,
            errorMessage: error.message,
            trackingId,
            serverStarting: this.serverStarting,
            connectionAttempts: this.connectionAttempts,
          });
        }

        this.logger.error(`${method} request failed`, {
          endpoint,
          status: error.status,
          message: error.message,
          trackingId,
        });

        return throwError(() => error);
      }),
    );
  }

  public get<T>(endpoint: string, options = {}): Observable<T> {
    return this.request<T>('GET', endpoint, options);
  }

  public post<T>(endpoint: string, body: unknown, options = {}): Observable<T> {
    return this.request<T>('POST', endpoint, { ...options, body });
  }

  public authRequest<T>(method: string, endpoint: string, body?: unknown, options = {}): Observable<T> {
    return this.request<T>(method, endpoint, {
      ...options,
      body,
      isAuthRequest: true,
      retries: this.maxStartupRetries,
      timeout: this.BASE_TIMEOUT * 2,                                    
    });
  }

  public get isOffline(): boolean {
    return this.isOfflineMode;
  }

  public get isServerStarting(): boolean {
    return this.serverStarting;
  }

  public resetConnectionTracking(): void {
    this.connectionAttempts = 0;
    this.serverStarting = false;
  }

  public checkBackendHealth(): Observable<boolean> {
    return this.get<unknown>('health-check', { timeout: 3000 }).pipe(
      map(() => {
        this.isOfflineMode = false;
        return true;
      }),
      catchError(() => {
        this.isOfflineMode = true;
        return of(false);
      }),
    );
  }

  private getFullApiUrl(endpoint: string): string {
    endpoint = endpoint.replace(/^\/+/, '');
    return `/api/${endpoint}`;
  }

  private generateRequestId(): string {
    return window.crypto?.randomUUID?.() || Math.random().toString(36).slice(2);
  }
}
