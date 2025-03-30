import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError, map, tap } from 'rxjs/operators';
import { LoggerService } from './logger.service';
import { environment } from '../../../environments/environment';

export interface EnvironmentInfo {
  production: boolean;
  apiUrl: string;
  actualApiUrl: string | null;
  serverResponding: boolean;
  isDevelopmentServer: boolean;
  userAgent: string;
  screenSize: { width: number; height: number };
  timeChecked: Date;
}

@Injectable({
  providedIn: 'root'
})
export class EnvironmentService {
  private readonly potentialApiUrls = [
    environment.apiUrl || 'http://localhost:3000',
    'http://localhost:3000',
    'http://localhost:4200/api',
    'http://localhost:8080'
  ];

  constructor(
    private http: HttpClient,
    private logger: LoggerService
  ) {
    this.logger.registerService('EnvironmentService');
    this.detectEnvironment().subscribe(info => {
      this.logger.info('Environment detected', info);
    });
  }

  /**
   * Detect the current environment and server availability
   */
  detectEnvironment(): Observable<EnvironmentInfo> {
    const info: EnvironmentInfo = {
      production: environment.production,
      apiUrl: environment.apiUrl || 'undefined',
      actualApiUrl: null,
      serverResponding: false,
      isDevelopmentServer: window.location.hostname === 'localhost',
      userAgent: navigator.userAgent,
      screenSize: {
        width: window.innerWidth,
        height: window.innerHeight
      },
      timeChecked: new Date()
    };

    // Try to find a responding API server
    return this.findRespondingServer().pipe(
      tap(url => {
        info.actualApiUrl = url;
        info.serverResponding = !!url;
      }),
      map(() => info),
      catchError(err => {
        this.logger.error('Error detecting environment', { error: err });
        return of(info);
      })
    );
  }

  /**
   * Try to find a responding server from the list of potential URLs
   */
  private findRespondingServer(): Observable<string | null> {
    // Try each URL in sequence
    return this.checkUrl(this.potentialApiUrls[0]).pipe(
      catchError(() => this.checkUrl(this.potentialApiUrls[1])),
      catchError(() => this.checkUrl(this.potentialApiUrls[2])),
      catchError(() => this.checkUrl(this.potentialApiUrls[3])),
      catchError(() => {
        this.logger.warn('No responding API server found');
        return of(null);
      })
    );
  }

  /**
   * Check if a URL responds
   */
  private checkUrl(baseUrl: string): Observable<string> {
    // Try common health/status endpoints
    const endpoints = ['/health', '/api/health', '/status', '/api/status'];
    
    return this.http.get(`${baseUrl}${endpoints[0]}`, { responseType: 'text' }).pipe(
      map(() => baseUrl),
      catchError(() => this.http.get(`${baseUrl}${endpoints[1]}`, { responseType: 'text' }).pipe(
        map(() => baseUrl),
        catchError(() => this.http.get(`${baseUrl}${endpoints[2]}`, { responseType: 'text' }).pipe(
          map(() => baseUrl),
          catchError(() => this.http.get(`${baseUrl}${endpoints[3]}`, { responseType: 'text' }).pipe(
            map(() => baseUrl)
          ))
        ))
      ))
    );
  }

  /**
   * Get environment information
   */
  getEnvironmentInfo(): EnvironmentInfo {
    return {
      production: environment.production,
      apiUrl: environment.apiUrl || 'undefined',
      actualApiUrl: null, // Will be determined by server check
      serverResponding: false, // Will be determined by server check
      isDevelopmentServer: window.location.hostname === 'localhost',
      userAgent: navigator.userAgent,
      screenSize: {
        width: window.innerWidth,
        height: window.innerHeight
      },
      timeChecked: new Date()
    };
  }
}
