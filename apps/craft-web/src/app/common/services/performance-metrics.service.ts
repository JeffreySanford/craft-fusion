import { Injectable, OnDestroy } from '@angular/core';
import { BehaviorSubject, Observable, of, interval, timer, Subject, fromEvent } from 'rxjs';
import { startWith, switchMap, map, takeUntil, tap, scan, buffer, filter, share } from 'rxjs/operators';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { LoggerService } from './logger.service';

/**
 * System metrics data interface
 */
export interface SystemMetrics {
  cpuUsage: number;
  memoryUsage: number;
  networkUtilization: number;
  diskUsage: number;
  activeUsers: number;
  requestsPerMinute: number;
  uptime: number; // in seconds
  systemStatus: string;
  timestamp: Date;
  // Add missing properties needed by Performance component
  cpuLoadRaw?: number;
  cpuLoad?: string;
  memoryUsageRaw?: number;
  networkLatencyRaw?: number;
  networkLatency?: string;
}

/**
 * API call details for tracking performance
 */
export interface ApiCall {
  url: string;
  method: string;
  duration: number;
  statusCode: number;
  timestamp: Date;
  size?: number;
  error?: boolean;
}

/**
 * API performance summary
 */
export interface ApiPerformanceSummary {
  totalCalls: number;
  successfulCalls: number;
  failedCalls: number;
  failedRequests: number;
  totalRequests: number;
  avgResponseTime: number;
  minResponseTime: number;
  maxResponseTime: number;
  errorRate: number;
  byMethod: Record<string, number>;
  byEndpoint: Record<string, number>;
  slowestEndpoints: Array<{url: string, avgTime: number, calls: number}>;
  recentCalls: ApiCall[];
}

/**
 * Frame rate data
 */
export interface FrameRateData {
  fps: number;
  avgFps: number;
  minFps: number;
  maxFps: number;
  frameDrops: number;
  timestamp: Date;
}

/**
 * Historical data point
 */
export interface HistoricalDataPoint {
  timestamp: Date;
  cpuUsage: number;
  memoryUsage: number;
  networkUtilization: number;
  activeUsers: number;
  requestsPerMinute: number;
  // Add missing properties needed by Reports component
  label?: string;
  value?: number;
}

/**
 * Resource usage metrics
 */
export interface ResourceUsage {
  name: string;
  value: number;
  unit: string;
  threshold?: number;
  critical?: number;
}

@Injectable({
  providedIn: 'root'
})
export class PerformanceMetricsService implements OnDestroy {
  private refreshInterval = 10000; // 10 seconds
  private metrics = new BehaviorSubject<SystemMetrics>({
    cpuUsage: 0,
    memoryUsage: 0,
    networkUtilization: 0,
    diskUsage: 0,
    activeUsers: 0,
    requestsPerMinute: 0,
    uptime: 0,
    systemStatus: 'Operational',
    timestamp: new Date()
  });
  
  // System metrics observable
  public metrics$ = this.metrics.asObservable();
  
  // API calls tracking
  private apiCalls = new BehaviorSubject<ApiCall[]>([]);
  private apiPerformanceSummarySubject = new BehaviorSubject<ApiPerformanceSummary>({
    totalCalls: 0,
    successfulCalls: 0,
    failedCalls: 0,
    failedRequests: 0,
    totalRequests: 0,
    avgResponseTime: 0,
    minResponseTime: 0,
    maxResponseTime: 0,
    errorRate: 0,
    byMethod: {},
    byEndpoint: {},
    slowestEndpoints: [],
    recentCalls: []
  });
  
  // API performance observable
  public apiPerformance$ = this.apiPerformanceSummarySubject.asObservable();
  
  // Frame rate monitoring
  private frameRateSubject = new BehaviorSubject<FrameRateData>({
    fps: 0,
    avgFps: 0,
    minFps: 60,
    maxFps: 0,
    frameDrops: 0,
    timestamp: new Date()
  });
  private frameRateHistory: number[] = [];
  private frameSamplingActive = false;
  private rafId: number | null = null;
  private lastFrameTime = 0;
  
  // Historical data storage
  private historicalData: HistoricalDataPoint[] = [];
  private readonly MAX_HISTORY_LENGTH = 1000;
  
  // Cleanup
  private destroy$ = new Subject<void>();
  private simulationActive = false;
  private systemUptime = 0;
  private uptimeInterval: any;
  
  constructor(
    private http: HttpClient,
    private logger: LoggerService
  ) {
    this.initMetricsPolling();
    this.startUptimeCounter();
    
    // Set initial simulated values in development
    if (!environment.production) {
      this.setSimulatedMetrics();
    }
    
    // Start collecting metrics history
    this.startHistoricalDataCollection();
  }
  
  /**
   * Get metrics updates as observable
   * @returns Observable that emits system metrics on change
   */
  getMetricsUpdates(): Observable<SystemMetrics> {
    return this.metrics.asObservable();
  }
  
  /**
   * Get current metrics snapshot
   * @returns Current system metrics
   */
  getCurrentMetrics(): SystemMetrics {
    return this.metrics.getValue();
  }
  
  /**
   * Record an API call for performance tracking
   * @param call API call details
   */
  recordApiCall(call: ApiCall): void {
    const currentCalls = this.apiCalls.getValue();
    
    // Keep only the most recent 100 calls
    const updatedCalls = [...currentCalls, call].slice(-100);
    this.apiCalls.next(updatedCalls);
    
    // Update the API performance summary
    this.updateApiPerformanceSummary(updatedCalls);
    
    // Log the call
    this.logger.debug(`API Call: ${call.method} ${call.url} - ${call.duration}ms`, {
      category: 'API_PERFORMANCE',
      duration: call.duration,
      statusCode: call.statusCode
    });
  }
  
  /**
   * Start metrics simulation for testing/demo purposes
   */
  startMetricsSimulation(): void {
    if (this.simulationActive) {
      return;
    }
    
    this.logger.info('Starting metrics simulation');
    this.simulationActive = true;
    
    interval(2000)
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        if (!this.simulationActive) {
          return;
        }
        
        const randomMetrics: SystemMetrics = {
          cpuUsage: this.generateRandomValue(10, 90, 10),
          memoryUsage: this.generateRandomValue(30, 85, 5),
          networkUtilization: this.generateRandomValue(5, 80, 15),
          diskUsage: this.generateRandomValue(40, 95, 2),
          activeUsers: Math.floor(Math.random() * 200) + 50,
          requestsPerMinute: Math.floor(Math.random() * 1000) + 100,
          uptime: this.systemUptime,
          systemStatus: this.determineSystemStatus(this.generateRandomValue(0, 100, 30)),
          timestamp: new Date()
        };
        
        this.metrics.next(randomMetrics);
        this.addToHistoricalData(randomMetrics);
      });
  }
  
  /**
   * Stop metrics simulation
   */
  stopMetricsSimulation(): void {
    this.logger.info('Stopping metrics simulation');
    this.simulationActive = false;
  }
  
  /**
   * Start framerate sampling to measure UI performance
   */
  startFramerateSampling(): void {
    if (this.frameSamplingActive) {
      return;
    }
    
    this.logger.info('Starting framerate sampling');
    this.frameSamplingActive = true;
    this.frameRateHistory = [];
    this.lastFrameTime = performance.now();
    
    // Use requestAnimationFrame to measure frame rate
    const measureFrameRate = (timestamp: number) => {
      if (!this.frameSamplingActive) {
        return;
      }
      
      const now = performance.now();
      const delta = now - this.lastFrameTime;
      this.lastFrameTime = now;
      
      // Only count frames that are rendered
      if (delta > 0) {
        const fps = 1000 / delta;
        this.frameRateHistory.push(fps);
        
        // Keep a reasonable history size
        if (this.frameRateHistory.length > 60) {
          this.frameRateHistory.shift();
        }
        
        // Calculate stats
        const avgFps = this.frameRateHistory.reduce((sum, fps) => sum + fps, 0) / this.frameRateHistory.length;
        const minFps = Math.min(...this.frameRateHistory);
        const maxFps = Math.max(...this.frameRateHistory);
        const frameDrops = this.frameRateHistory.filter(fps => fps < 30).length;
        
        this.frameRateSubject.next({
          fps: Math.round(fps),
          avgFps: Math.round(avgFps),
          minFps: Math.round(minFps),
          maxFps: Math.round(maxFps),
          frameDrops,
          timestamp: new Date()
        });
      }
      
      this.rafId = requestAnimationFrame(measureFrameRate);
    };
    
    this.rafId = requestAnimationFrame(measureFrameRate);
  }
  
  /**
   * Stop framerate sampling
   */
  stopFramerateSampling(): void {
    if (this.rafId !== null) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
    
    this.logger.info('Stopping framerate sampling');
    this.frameSamplingActive = false;
  }
  
  /**
   * Get current framerate data
   */
  getFramerate$(): Observable<number> {
    return this.frameRateSubject.asObservable().pipe(
      map(data => data.fps)
    );
  }
  
  /**
   * Get historical performance data for a specific time range
   * @param days Number of days to look back
   * @param interval Interval in minutes between data points
   */
  getHistoricalData(days: number = 7, interval: number = 60): Observable<HistoricalDataPoint[]> {
    // In production, we would call an API
    if (environment.production) {
      return this.http.get<HistoricalDataPoint[]>(`/api/metrics/history?days=${days}&interval=${interval}`);
    }
    
    // In development, generate realistic historical data
    const endDate = new Date();
    const startDate = new Date(endDate);
    startDate.setDate(startDate.getDate() - days);
    
    const dataPoints: HistoricalDataPoint[] = [];
    const minutesPerPoint = interval;
    const pointsCount = (days * 24 * 60) / minutesPerPoint;
    
    for (let i = 0; i < pointsCount; i++) {
      const timestamp = new Date(startDate);
      timestamp.setMinutes(timestamp.getMinutes() + i * minutesPerPoint);
      
      // Generate more realistic patterns
      const hour = timestamp.getHours();
      const isBusinessHour = hour >= 9 && hour <= 17;
      const isWeekend = [0, 6].includes(timestamp.getDay());
      
      // More active during business hours on weekdays
      const activityMultiplier = isWeekend ? 0.4 : (isBusinessHour ? 1 : 0.6);
      
      // Add some weekly patterns
      const dayOfWeek = timestamp.getDay();
      const dayMultiplier = 0.8 + (dayOfWeek * 0.05);
      
      // Add some random variation but maintain trends
      const baseValue = activityMultiplier * dayMultiplier;
      
      dataPoints.push({
        timestamp,
        cpuUsage: this.generateTrendValue(20, 80, baseValue, i),
        memoryUsage: this.generateTrendValue(30, 90, baseValue, i),
        networkUtilization: this.generateTrendValue(10, 70, baseValue, i),
        activeUsers: Math.floor(this.generateTrendValue(20, 500, baseValue, i)),
        requestsPerMinute: Math.floor(this.generateTrendValue(50, 2000, baseValue, i))
      });
    }
    
    return of(dataPoints);
  }
  
  /**
   * Clean up resources on service destroy
   */
  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    
    if (this.uptimeInterval) {
      clearInterval(this.uptimeInterval);
    }
    
    if (this.rafId !== null) {
      cancelAnimationFrame(this.rafId);
    }
  }
  
  /**
   * Initialize metrics polling from API
   */
  private initMetricsPolling(): void {
    // Use interval to poll metrics regularly
    interval(this.refreshInterval)
      .pipe(
        startWith(0), // Start immediately
        takeUntil(this.destroy$),
        switchMap(() => {
          // In production, get real metrics
          if (environment.production) {
            return this.http.get<SystemMetrics>('/api/metrics/system');
          } else {
            // In development, create simulated metrics
            return this.getSimulatedMetrics();
          }
        })
      )
      .subscribe({
        next: (data) => {
          this.updateMetrics(data);
          this.logger.debug('Updated system metrics', { metrics: data });
        },
        error: (error) => {
          this.logger.error('Failed to fetch system metrics', { error });
          
          // On error, update status to degraded
          const currentMetrics = this.metrics.getValue();
          this.metrics.next({
            ...currentMetrics,
            systemStatus: 'Degraded'
          });
        }
      });
  }
  
  /**
   * Update metrics with new data
   */
  private updateMetrics(data: SystemMetrics): void {
    const updatedMetrics: SystemMetrics = {
      cpuUsage: data.cpuUsage || 0,
      memoryUsage: data.memoryUsage || 0,
      networkUtilization: data.networkUtilization || 0,
      diskUsage: data.diskUsage || 0,
      activeUsers: data.activeUsers || 0,
      requestsPerMinute: data.requestsPerMinute || 0,
      uptime: data.uptime || this.systemUptime,
      systemStatus: data.systemStatus || 'Operational',
      timestamp: new Date(),
      // Add additional properties for performance component compatibility
      cpuLoadRaw: data.cpuUsage || 0,
      cpuLoad: `${data.cpuUsage || 0}%`,
      memoryUsageRaw: data.memoryUsage || 0,
      networkLatencyRaw: data.networkUtilization || 0,
      networkLatency: `${data.networkUtilization || 0}ms`,
    };
    
    this.metrics.next(updatedMetrics);
    this.addToHistoricalData(updatedMetrics);
  }
  
  /**
   * Start internal uptime counter for simulated data
   */
  private startUptimeCounter(): void {
    this.uptimeInterval = setInterval(() => {
      this.systemUptime += 1;
      
      // Update uptime in metrics
      const currentMetrics = this.metrics.getValue();
      this.metrics.next({
        ...currentMetrics,
        uptime: this.systemUptime
      });
    }, 1000);
  }
  
  /**
   * Set simulated metrics for development
   */
  private setSimulatedMetrics(): void {
    const simulatedMetrics: SystemMetrics = {
      cpuUsage: Math.floor(Math.random() * 40) + 20, // 20-60%
      memoryUsage: Math.floor(Math.random() * 30) + 40, // 40-70%
      networkUtilization: Math.floor(Math.random() * 50) + 20, // 20-70%
      diskUsage: 45, // Static for now
      activeUsers: Math.floor(Math.random() * 50) + 20, // 20-70 users
      requestsPerMinute: Math.floor(Math.random() * 100) + 50, // 50-150 RPM
      uptime: this.systemUptime,
      systemStatus: 'Operational',
      timestamp: new Date()
    };
    
    this.metrics.next(simulatedMetrics);
  }
  
  /**
   * Get simulated metrics for development environment
   */
  private getSimulatedMetrics(): Observable<SystemMetrics> {
    return new Observable(observer => {
      const metrics: SystemMetrics = {
        cpuUsage: this.generateRandomValue(20, 60, 10),
        memoryUsage: this.generateRandomValue(40, 70, 5),
        networkUtilization: this.generateRandomValue(20, 70, 15),
        diskUsage: this.generateRandomValue(40, 60, 2),
        activeUsers: Math.floor(Math.random() * 50) + 20, // 20-70 users
        requestsPerMinute: Math.floor(Math.random() * 100) + 50, // 50-150 RPM
        uptime: this.systemUptime,
        systemStatus: this.determineSystemStatus(Math.random() * 100),
        timestamp: new Date()
      };
      
      observer.next(metrics);
      observer.complete();
    });
  }
  
  /**
   * Generate random value with some fluctuation
   */
  private generateRandomValue(min: number, max: number, fluctuation: number): number {
    const baseValue = this.metrics.getValue()[Object.keys(this.metrics.getValue())[0] as keyof SystemMetrics] as number || min;
    const change = (Math.random() * fluctuation * 2) - fluctuation;
    const newValue = baseValue + change;
    return Math.min(Math.max(newValue, min), max);
  }
  
  /**
   * Generate trend value for historical data
   */
  private generateTrendValue(min: number, max: number, multiplier: number, step: number): number {
    // Use sine wave to create natural-looking patterns
    const sinValue = Math.sin(step / 10) * 0.5 + 0.5;
    const range = max - min;
    const baseValue = min + (range * multiplier * sinValue);
    
    // Add random noise
    const noise = (Math.random() * 0.2 - 0.1) * range;
    return Math.min(Math.max(baseValue + noise, min), max);
  }
  
  /**
   * Determine system status based on performance values
   */
  private determineSystemStatus(value: number): string {
    if (value > 95) return 'Critical';
    if (value > 80) return 'Degraded';
    if (value > 60) return 'Warning';
    return 'Operational';
  }
  
  /**
   * Update API performance summary from collected calls
   */
  private updateApiPerformanceSummary(calls: ApiCall[]): void {
    if (calls.length === 0) {
      return;
    }
    
    // Calculate basic stats
    const totalCalls = calls.length;
    const successfulCalls = calls.filter(call => call.statusCode < 400).length;
    const failedCalls = totalCalls - successfulCalls;
    const errorRate = failedCalls / totalCalls * 100;
    
    // Calculate response times
    const responseTimes = calls.map(call => call.duration);
    const avgResponseTime = responseTimes.reduce((sum, time) => sum + time, 0) / totalCalls;
    const minResponseTime = Math.min(...responseTimes);
    const maxResponseTime = Math.max(...responseTimes);
    
    // Group by method
    const byMethod: Record<string, number> = {};
    calls.forEach(call => {
      const method = call.method.toUpperCase();
      byMethod[method] = (byMethod[method] || 0) + 1;
    });
    
    // Group by endpoint
    const byEndpoint: Record<string, number> = {};
    calls.forEach(call => {
      // Extract base endpoint pattern (e.g., /api/users/:id -> /api/users)
      const path = new URL(call.url, window.location.origin).pathname;
      const segments = path.split('/');
      
      // Try to identify URL pattern by looking for ID-like segments
      const patternSegments = segments.map(segment => {
        // If segment looks like an ID, replace with :id
        return /^\d+$|^[0-9a-f]{8,}$/i.test(segment) ? ':id' : segment;
      });
      
      const endpoint = patternSegments.join('/');
      byEndpoint[endpoint] = (byEndpoint[endpoint] || 0) + 1;
    });
    
    // Calculate slowest endpoints
    const endpointPerformance: Record<string, {totalTime: number, calls: number}> = {};
    calls.forEach(call => {
      const path = new URL(call.url, window.location.origin).pathname;
      const segments = path.split('/');
      const patternSegments = segments.map(segment => {
        return /^\d+$|^[0-9a-f]{8,}$/i.test(segment) ? ':id' : segment;
      });
      const endpoint = patternSegments.join('/');
      
      if (!endpointPerformance[endpoint]) {
        endpointPerformance[endpoint] = { totalTime: 0, calls: 0 };
      }
      
      endpointPerformance[endpoint].totalTime += call.duration;
      endpointPerformance[endpoint].calls += 1;
    });
    
    const slowestEndpoints = Object.entries(endpointPerformance)
      .map(([url, stats]) => ({
        url,
        avgTime: stats.totalTime / stats.calls,
        calls: stats.calls
      }))
      .sort((a, b) => b.avgTime - a.avgTime)
      .slice(0, 5);
    
    // Create summary
    const summary: ApiPerformanceSummary = {
      totalCalls,
      successfulCalls,
      failedCalls,
      failedRequests: failedCalls,
      totalRequests: totalCalls,
      avgResponseTime,
      minResponseTime,
      maxResponseTime,
      errorRate,
      byMethod,
      byEndpoint,
      slowestEndpoints,
      recentCalls: calls.slice(-10) // Keep last 10 calls for display
    };
    
    this.apiPerformanceSummarySubject.next(summary);
  }
  
  /**
   * Add current metrics to historical data
   */
  private addToHistoricalData(metrics: SystemMetrics): void {
    const dataPoint: HistoricalDataPoint = {
      timestamp: new Date(),
      cpuUsage: metrics.cpuUsage,
      memoryUsage: metrics.memoryUsage,
      networkUtilization: metrics.networkUtilization,
      activeUsers: metrics.activeUsers,
      requestsPerMinute: metrics.requestsPerMinute
    };
    
    this.historicalData.push(dataPoint);
    
    // Keep history to a reasonable size
    if (this.historicalData.length > this.MAX_HISTORY_LENGTH) {
      this.historicalData.shift();
    }
  }
  
  /**
   * Start collecting historical data
   */
  private startHistoricalDataCollection(): void {
    // Store metrics every minute for historical data
    interval(60000)
      .pipe(
        startWith(0),
        takeUntil(this.destroy$)
      )
      .subscribe(() => {
        this.addToHistoricalData(this.metrics.getValue());
      });
  }
}
