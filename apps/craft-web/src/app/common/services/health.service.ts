import { Injectable } from '@angular/core';
import { Observable, of, timer, BehaviorSubject, Subject } from 'rxjs';
import { catchError, switchMap, tap, retry, shareReplay, map, takeUntil } from 'rxjs/operators';
import { HttpClient } from '@angular/common/http';
import { LoggerService } from './logger.service';
import { MockApiService } from './mock-api.service';
import { ApiService } from './api.service';
import { environment } from '../../../environments/environment';

export interface HealthStatus {
  status: 'online' | 'degraded' | 'offline';
  uptime?: number;
  timestamp: number;
  hostname?: string;
  version?: string;
  environment?: string;
  memory?: {
    free?: number;
    total?: number;
    usage: number;
  };
  services?: Record<string, 'up' | 'degraded' | 'down'>;
}

@Injectable({
  providedIn: 'root'
})
export class HealthService {
  private healthUrl = environment.apiUrl + '/health';
  private healthStatus$ = new BehaviorSubject<HealthStatus>({
    status: 'offline',
    timestamp: Date.now()
  });
  
  // Track connection failures and adjust polling frequency
  private connectionFailures = 0;
  private pollingStopSignal = new Subject<void>();
  private currentPollingInterval = 60000; // Start with 60 seconds
  private readonly MIN_POLLING_INTERVAL = 60000; // 1 minute
  private readonly MAX_POLLING_INTERVAL = 300000; // 5 minutes
  private readonly MAX_RETRIES = 2;
  
  // Track the last logged error to prevent log spam
  private lastErrorTime = 0;
  private readonly ERROR_LOG_THROTTLE = 60000; // Only log same error once per minute
  
  constructor(
    private http: HttpClient,
    private apiService: ApiService,
    private logger: LoggerService,
    private mockApiService: MockApiService
  ) {
    this.logger.registerService('HealthService');
    
    // Start with mock data initially to avoid connection errors during startup
    this.mockApiService.getMockHealthStatus().subscribe(mockStatus => {
      this.healthStatus$.next(mockStatus);
      this.logger.info('Health service initialized with mock data', { 
        status: mockStatus.status 
      });
    });
    
    // Start polling for health status (delayed start)
    setTimeout(() => this.startHealthPolling(), 5000);
  }
  
  private startHealthPolling(): void {
    // Stop any existing polling
    this.pollingStopSignal.next();
    
    this.logger.debug(`Starting health polling with interval of ${this.currentPollingInterval}ms`);
    
    timer(0, this.currentPollingInterval)
      .pipe(
        takeUntil(this.pollingStopSignal),
        switchMap(() => this.fetchHealthStatus())
      )
      .subscribe(status => {
        this.healthStatus$.next(status);
        
        // If we're back online, reduce the polling interval
        if (status.status !== 'offline') {
          this.decreasePollingInterval();
        }
      });
  }
  
  private fetchHealthStatus(): Observable<HealthStatus> {
    // Use ApiService's checkApiStatus instead of direct HTTP call
    return this.apiService.checkApiStatus().pipe(
      map(response => {
        const responseData = response as any; // Type cast to avoid unknown type errors
        
        if (responseData.status === 'offline') {
          // If API is offline, increase backoff
          this.increasePollingInterval();
          
          return {
            status: 'offline' as const,
            timestamp: Date.now(),
            memory: { usage: 0 }
          } as HealthStatus;
        }
        
        // Reset failure counter on success
        this.connectionFailures = 0;
        
        // Convert API status response to HealthStatus
        return {
          status: 'online' as const,
          timestamp: Date.now(),
          uptime: responseData.uptime || 0,
          version: responseData.version || '1.0.0',
          hostname: responseData.hostname || 'localhost',
          memory: {
            usage: responseData.memoryUsage || 50
          },
          services: {
            api: 'up'
          }
        } as HealthStatus;
      }),
      catchError(error => {
        this.connectionFailures++;
        
        // Only log errors occasionally to avoid spam
        const now = Date.now();
        if (now - this.lastErrorTime > this.ERROR_LOG_THROTTLE) {
          this.lastErrorTime = now;
          this.logger.warn('Health check failed', { 
            error: error.message,
            consecutiveFailures: this.connectionFailures 
          });
        }
        
        // Increase polling interval on failure (backoff strategy)
        this.increasePollingInterval();
        
        // Use mock data after multiple failures
        if (this.connectionFailures > 2) {
          return this.mockApiService.getMockHealthStatus();
        }
        
        return of({
          status: 'offline' as const,
          timestamp: Date.now(),
          memory: { usage: 0 }
        } as HealthStatus);
      }),
      shareReplay(1)
    );
  }
  
  // Increase polling interval exponentially up to a maximum
  private increasePollingInterval(): void {
    const newInterval = Math.min(
      this.currentPollingInterval * 1.5, 
      this.MAX_POLLING_INTERVAL
    );
    
    if (newInterval !== this.currentPollingInterval) {
      this.currentPollingInterval = newInterval;
      this.logger.debug(`Increasing health polling interval to ${this.currentPollingInterval}ms`);
      
      // Restart polling with new interval
      this.startHealthPolling();
    }
  }
  
  // Decrease polling interval when services come back online
  private decreasePollingInterval(): void {
    if (this.currentPollingInterval > this.MIN_POLLING_INTERVAL) {
      this.currentPollingInterval = this.MIN_POLLING_INTERVAL;
      this.logger.debug(`Resetting health polling interval to ${this.currentPollingInterval}ms`);
      
      // Restart polling with new interval
      this.startHealthPolling();
    }
  }
  
  formatUptime(uptime: number): string {
    if (!uptime) return 'Unknown';
    
    const seconds = Math.floor(uptime / 1000);
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor(((seconds % 86400) % 3600) / 60);
    const remainingSeconds = ((seconds % 86400) % 3600) % 60;
    
    if (days > 0) {
      return `${days}d ${hours}h ${minutes}m`;
    } else if (hours > 0) {
      return `${hours}h ${minutes}m ${remainingSeconds}s`;
    } else if (minutes > 0) {
      return `${minutes}m ${remainingSeconds}s`;
    } else {
      return `${remainingSeconds}s`;
    }
  }
  
  getHealthStatus(): Observable<HealthStatus> {
    return this.healthStatus$.asObservable();
  }
  
  getCurrentStatus(): 'online' | 'degraded' | 'offline' {
    return this.healthStatus$.getValue().status;
  }
}
