import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, timer } from 'rxjs';
import { switchMap, shareReplay, catchError } from 'rxjs/operators';
import { LoggerService } from './logger.service';
import { ApiService } from './api.service';

export interface BackendLogEntry {
  timestamp: string;
  level: string;
  message: string;
  metadata?: any;
  source: 'backend';
}

@Injectable({
  providedIn: 'root'
})
export class ApiLoggerService {
  private readonly API_URL = 'logs';
  private readonly POLL_INTERVAL = 10000; // 10 seconds
  
  // Cache the logs with polling for updates
  public backendLogs$ = timer(0, this.POLL_INTERVAL).pipe(
    switchMap(() => this.fetchLogs()),
    shareReplay(1),
    catchError(err => {
      this.loggerService.error('Failed to fetch backend logs', err);
      return [];
    })
  );

  constructor(
    private http: HttpClient,
    private loggerService: LoggerService,
    private apiService: ApiService
  ) {
    // Register with logger
    this.loggerService.registerService('ApiLoggerService');
    this.loggerService.info('ApiLoggerService initialized - connecting to backend logs');
  }

  /**
   * Fetch logs from the backend
   */
  fetchLogs(level?: string, limit: number = 100): Observable<BackendLogEntry[]> {
    let url = this.API_URL;
    const params: any = {};
    
    if (level && level !== 'all') {
      params.level = level;
    }
    
    if (limit) {
      params.limit = limit.toString();
    }
    
    this.loggerService.debug(`Fetching backend logs - level: ${level || 'all'}, limit: ${limit}`);
    return this.apiService.get<BackendLogEntry[]>(`${this.API_URL}?level=${level || ''}&limit=${limit}`);
  }

  /**
   * Clear backend logs
   */
  clearLogs(): Observable<{ message: string }> {
    this.loggerService.info('Clearing backend logs');
    return this.apiService.delete<{ message: string }>(this.API_URL);
  }
  
  /**
   * Format backend logs to match frontend format
   * This helps the logger-display component process both types
   */
  formatBackendLog(logEntry: BackendLogEntry): string {
    return `[${logEntry.timestamp}] ${logEntry.level.toUpperCase()}: ${logEntry.message}`;
  }
}
