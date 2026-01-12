import { Injectable } from '@angular/core';
import { Observable, Subject } from 'rxjs';
import { LoggerService } from './logger.service';

export interface ApiLogEntry {
  timestamp: number;
  request: {
    url: string;
    method: string;
    headers?: unknown;
    body?: unknown;
  };
  response?: {
    status: number;
    body?: unknown;
    headers?: unknown;
  };
  responseTime: number;
  error?: unknown;
}

@Injectable({
  providedIn: 'root',
})
export class ApiLoggerService {
  private logSubject = new Subject<ApiLogEntry>();
  private logs: ApiLogEntry[] = [];
  private maxLogs = 1000;                         

  constructor(private logger: LoggerService) {
    this.logger.debug('ApiLoggerService initialized');
  }

  logApiCall(entry: ApiLogEntry): void {
    this.logs.push(entry);

    if (this.logs.length > this.maxLogs) {
      this.logs.shift();
    }

    this.logSubject.next(entry);

    const status = entry.response?.status;
    const method = entry.request.method;
    const url = entry.request.url;
    const time = entry.responseTime.toFixed(1);

    if (typeof status !== 'number' || status >= 400) {
      this.logger.warn(`API ${method} ${url} failed with status ${status ?? 'unknown'} (${time}ms)`);
    } else {
      this.logger.debug(`API ${method} ${url} completed with status ${status} (${time}ms)`);
    }
  }

  clearLogs(): void {
    this.logs = [];
    this.logger.info('API logs cleared');
  }

  getLogs(): ApiLogEntry[] {
    return [...this.logs];
  }

  getLogsForEndpoint(endpoint: string): ApiLogEntry[] {
    return this.logs.filter(log => {
      try {
        const url = new URL(log.request.url, window.location.origin);
        return url.pathname === endpoint;
      } catch {
        return false;
      }
    });
  }

  getLogStream(): Observable<ApiLogEntry> {
    return this.logSubject.asObservable();
  }

  generateMockLog(path: string = '/api/data', method: string = 'GET'): ApiLogEntry {
    const timestamp = Date.now();
    const responseTime = Math.floor(Math.random() * 500) + 5;           
    const statusOptions = [200, 200, 200, 200, 201, 204, 400, 404, 500];                             
    const status = statusOptions[Math.floor(Math.random() * statusOptions.length)] ?? 500;

    return {
      timestamp,
      request: {
        url: path,
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer mock-token-xxx',
        },
        body: method !== 'GET' ? { data: 'Mock request data', timestamp } : undefined,
      },
      response: {
        status,
        body:
          status < 400
            ? {
                success: true,
                data: { id: Math.floor(Math.random() * 1000), name: 'Mock Response' },
                timestamp,
              }
            : {
                success: false,
                error: status === 404 ? 'Resource not found' : 'Internal server error',
                timestamp,
              },
      },
      responseTime,
    };
  }
}
