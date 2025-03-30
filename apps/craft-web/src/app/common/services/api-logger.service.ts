import { Injectable } from '@angular/core';
import { Observable, Subject, BehaviorSubject } from 'rxjs';
import { LoggerService } from './logger.service';

export interface ApiRequest {
  method: string;
  url: string;
  headers: Record<string, string | null>;
  body?: any;
}

export interface ApiResponse {
  status: number;
  statusText: string;
  body?: any;
  headers?: Record<string, string | null>;
  size?: number; // Allow size for data transfer calculations
}

export interface ApiLogEntry {
  request: ApiRequest;
  response: ApiResponse;
  timestamp: number;
  responseTime: number;
  id?: string; // Add id as an optional property
  clientInfo?: {
    browser: string;
    device: string;
    location: string;
  };
  error?: any; // Needed for API Monitor
}

export interface ApiLogSummary {
  totalCalls: number;
  successCalls: number;
  errorCalls: number;
  avgResponseTime: number;
  maxResponseTime: number;
  totalDataTransferred: number;
  errorRate: number;
  topErrorEndpoints: { endpoint: string; count: number }[];
  slowestEndpoints: { endpoint: string; avgTime: number }[];
  mostCalledEndpoints: { endpoint: string; count: number }[];
  callsPerMinute: number;
}

@Injectable({
  providedIn: 'root',
})
export class ApiLoggerService {
  private logSubject = new Subject<ApiLogEntry>();
  private logs: ApiLogEntry[] = [];
  private logsSubject = new BehaviorSubject<ApiLogEntry[]>([]);
  private maxLogs = 1000; // Store up to 1000 logs
  private isInterceptorRegistered = false;

  private summarySubject = new BehaviorSubject<ApiLogSummary>({
    totalCalls: 0,
    successCalls: 0,
    errorCalls: 0,
    avgResponseTime: 0,
    maxResponseTime: 0,
    totalDataTransferred: 0,
    errorRate: 0,
    topErrorEndpoints: [],
    slowestEndpoints: [],
    mostCalledEndpoints: [],
    callsPerMinute: 0,
  });

  public summary$ = this.summarySubject.asObservable();
  public logs$ = this.logsSubject.asObservable();

  // Keep track of calls in the last minute for rate calculation
  private callsInLastMinute: number[] = [];

  constructor(private logger: LoggerService) {
    this.logger.debug('ApiLoggerService initialized');
  }

  /**
   * Log an API request/response
   */
  logApiCall(entry: ApiLogEntry): void {
    // Mark that we've received a real API call through the interceptor
    this.isInterceptorRegistered = true;

    this.logs.push(entry);

    // Trim logs if they exceed the maximum
    if (this.logs.length > this.maxLogs) {
      this.logs.shift();
    }

    // Emit the log entry to subscribers
    this.logSubject.next(entry);
    this.logsSubject.next([...this.logs]);

    // Also log to the general logger for debug purposes
    const status = entry.response?.status;
    const method = entry.request.method;
    const url = entry.request.url;
    const time = entry.responseTime.toFixed(1);

    if (!status || status >= 400) {
      this.logger.warn(`API ${method} ${url} failed with status ${status || 'unknown'} (${time}ms)`, {
        category: 'api',
        status,
        method,
        url,
        responseTime: entry.responseTime,
      });
    } else {
      this.logger.debug(`API ${method} ${url} completed with status ${status} (${time}ms)`, {
        category: 'api',
        status,
        method,
        url,
        responseTime: entry.responseTime,
      });
    }

    // Track call for rate calculation
    this.callsInLastMinute.push(Date.now());

    // Remove calls older than 1 minute
    const oneMinuteAgo = Date.now() - 60000;
    this.callsInLastMinute = this.callsInLastMinute.filter((time) => time >= oneMinuteAgo);

    // Update summary statistics
    this.updateSummary();
  }

  /**
   * Clear all logs
   */
  clearLogs(): void {
    this.logs = [];
    this.logger.info('API logs cleared', {
      category: 'api',
    });
  }

  /**
   * Get all stored logs
   */
  getLogs(): ApiLogEntry[] {
    return [...this.logs];
  }

  /**
   * Get logs for a specific endpoint
   */
  getLogsForEndpoint(endpoint: string): ApiLogEntry[] {
    return this.logs.filter((log) => {
      try {
        const url = new URL(log.request.url, window.location.origin);
        return url.pathname === endpoint;
      } catch (e) {
        return false;
      }
    });
  }

  /**
   * Subscribe to the log stream
   */
  getLogStream(): Observable<ApiLogEntry> {
    return this.logSubject.asObservable();
  }

  /**
   * Trigger a test API call
   * Used to verify the interceptor is working by making a real API call
   */
  triggerTestCall(): void {
    if (this.logs.length === 0 && !this.isInterceptorRegistered) {
      this.logger.info('Making test API call to initialize API monitoring', {
        category: 'api:initialization',
      });

      // This method intentionally left empty - the actual implementation
      // will be in the component that makes real API calls for testing
    }
  }

  /**
   * Generate a simulated log entry for testing
   * Only used if no real API calls have been logged
   */
  generateMockLog(path: string = '/api/data', method: string = 'GET'): ApiLogEntry {
    const timestamp = Date.now();
    const responseTime = Math.floor(Math.random() * 500) + 5; // 5-505ms
    const statusOptions = [200, 200, 200, 200, 201, 204, 400, 404, 500]; // Weighted to favor success
    const status = statusOptions[Math.floor(Math.random() * statusOptions.length)];

    const getStatusText = (code: number): string => {
      switch (code) {
        case 200: return 'OK';
        case 201: return 'Created';
        case 204: return 'No Content';
        case 400: return 'Bad Request';
        case 404: return 'Not Found';
        case 500: return 'Internal Server Error';
        default:  return 'Unknown';
      }
    };

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
        statusText: getStatusText(status),
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

  /**
   * Check if this service has recorded any real API calls
   */
  hasRealApiCalls(): boolean {
    return this.isInterceptorRegistered || this.logs.length > 0;
  }

  /**
   * Get the current API summary statistics
   */
  getSummary(): ApiLogSummary {
    return this.summarySubject.value;
  }

  /**
   * Calculate and update API call summary statistics
   */
  private updateSummary(): void {
    if (this.logs.length === 0) {
      return;
    }

    // Calculate basic statistics
    const totalCalls = this.logs.length;
    const successCalls = this.logs.filter((log) => log.response?.status && log.response.status < 400).length;
    const errorCalls = totalCalls - successCalls;

    // Calculate response times
    const responseTimes = this.logs.map((log) => log.responseTime);
    const avgResponseTime = responseTimes.reduce((a, b) => a + b, 0) / totalCalls;
    const maxResponseTime = Math.max(...responseTimes);

    // Calculate error rate
    const errorRate = (errorCalls / totalCalls) * 100;

    // Calculate data transferred (if size info is available)
    let totalDataTransferred = 0;
    this.logs.forEach((log) => {
      if (log.response?.size) {
        totalDataTransferred += log.response.size;
      }
    });

    // Group logs by normalized endpoint for analysis
    const endpointMap = new Map<string, ApiLogEntry[]>();

    this.logs.forEach((log) => {
      const endpoint = this.normalizeUrl(log.request.url);

      if (!endpointMap.has(endpoint)) {
        endpointMap.set(endpoint, []);
      }

      endpointMap.get(endpoint)?.push(log);
    });

    // Find top error endpoints
    const endpointErrors = Array.from(endpointMap.entries()).map(([endpoint, logs]) => ({
      endpoint,
      count: logs.filter((log) => log.response?.status && log.response.status >= 400).length,
    }));

    const topErrorEndpoints = endpointErrors
      .filter((entry) => entry.count > 0)
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    // Find slowest endpoints
    const endpointTimings = Array.from(endpointMap.entries()).map(([endpoint, logs]) => ({
      endpoint,
      avgTime: logs.reduce((sum, log) => sum + log.responseTime, 0) / logs.length,
    }));

    const slowestEndpoints = endpointTimings.sort((a, b) => b.avgTime - a.avgTime).slice(0, 5);

    // Find most called endpoints
    const endpointCalls = Array.from(endpointMap.entries()).map(([endpoint, logs]) => ({
      endpoint,
      count: logs.length,
    }));

    const mostCalledEndpoints = endpointCalls.sort((a, b) => b.count - a.count).slice(0, 5);

    // Calculate calls per minute (real-time rate)
    const callsPerMinute = this.callsInLastMinute.length;

    // Update summary
    this.summarySubject.next({
      totalCalls,
      successCalls,
      errorCalls,
      avgResponseTime,
      maxResponseTime,
      totalDataTransferred,
      errorRate,
      topErrorEndpoints,
      slowestEndpoints,
      mostCalledEndpoints,
      callsPerMinute,
    });
  }

  /**
   * Normalize URL to get endpoint pattern
   */
  private normalizeUrl(url: string): string {
    try {
      const parsedUrl = new URL(url, window.location.origin);
      const path = parsedUrl.pathname;

      // Replace numeric segments with {id}
      return path.replace(/\/\d+(?=\/|$)/g, '/{id}');
    } catch (e) {
      return url;
    }
  }
}
