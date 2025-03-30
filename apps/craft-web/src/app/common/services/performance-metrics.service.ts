import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, interval } from 'rxjs';
import { LoggerService } from './logger.service';

export interface PerformanceMetrics {
  cpuLoad: string;
  memoryUsage: string;
  networkLatency: string;
  cpuLoadRaw: number;
  memoryUsageRaw: number;
  networkLatencyRaw: number;
}

export interface ApiMetrics {
  url: string;
  method: string;
  duration: number;
  requestSize: number;
  responseSize: number;
  status: number;
  timestamp: number;
  success: boolean;
  errorType?: string;
}

export interface ApiPerformanceSummary {
  avgResponseTime: number;
  maxResponseTime: number;
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  totalDataTransferred: number;
  endpointStats: Map<string, EndpointStats>;
}

export interface EndpointStats {
  url: string;
  callCount: number;
  avgDuration: number;
  successRate: number;
}

export interface SystemMetrics {
  cpuLoad: string;
  cpuLoadRaw: number;
  memoryUsage: string;
  memoryUsageRaw: number;
  networkLatency: string;
  networkLatencyRaw: number;
  fps: number;
}

export interface ApiCallMetric {
  endpoint: string;
  method: string;
  duration: number;
  success: boolean;
  timestamp?: number;
}

@Injectable({
  providedIn: 'root'
})
export class PerformanceMetricsService {
  private metricsSubject = new BehaviorSubject<PerformanceMetrics>({
    cpuLoad: '0.00%',
    memoryUsage: '0.00%',
    networkLatency: '0.00 ms',
    cpuLoadRaw: 0,
    memoryUsageRaw: 0,
    networkLatencyRaw: 0
  });

  // Expose as Observable
  public metrics$ = this.metricsSubject.asObservable();
  private updateInterval: any = null;
  private simulationActive = false;

  private _frameId: number | null = null;
  private _lastFrameTime: number | null = null;
  private _fpsSubject = new BehaviorSubject<number>(0);

  private apiMetrics: ApiMetrics[] = [];
  private apiMetricsSubject = new BehaviorSubject<ApiMetrics[]>([]);
  private apiPerformanceSubject = new BehaviorSubject<ApiPerformanceSummary>({
    avgResponseTime: 0,
    maxResponseTime: 0,
    totalRequests: 0,
    successfulRequests: 0,
    failedRequests: 0,
    totalDataTransferred: 0,
    endpointStats: new Map<string, EndpointStats>()
  });

  public apiMetrics$ = this.apiMetricsSubject.asObservable();
  public apiPerformance$ = this.apiPerformanceSubject.asObservable();

  constructor(private logger: LoggerService) {
    this.logger.registerService('PerformanceMetricsService');
    this.logger.info('Performance metrics service initialized');
    
    // Start simulation by default
    this.startMetricsSimulation();
  }

  /**
   * Start simulating performance metrics
   */
  startMetricsSimulation(): void {
    if (this.simulationActive) return;
    
    this.simulationActive = true;
    this.logger.info('Starting performance metrics simulation');
    
    // Update metrics every 2 seconds
    this.updateInterval = interval(2000).subscribe(() => {
      this.updateSimulatedMetrics();
    });
    
    // Initial update
    this.updateSimulatedMetrics();
  }

  /**
   * Stop simulating performance metrics
   */
  stopMetricsSimulation(): void {
    if (this.updateInterval) {
      this.updateInterval.unsubscribe();
      this.updateInterval = null;
    }
    this.simulationActive = false;
    this.logger.info('Stopped performance metrics simulation');
  }

  /**
   * Update the performance metrics with simulated values
   */
  private updateSimulatedMetrics(): void {
    // Generate realistic fluctuating values
    const now = Date.now();
    
    // CPU load fluctuates between 30% and 70% with occasional spikes
    const cpuBase = 30 + Math.sin(now / 10000) * 20;
    const cpuSpike = Math.random() > 0.8 ? Math.random() * 30 : 0;
    const cpuLoadRaw = Math.min(100, cpuBase + cpuSpike);
    
    // Memory tends to gradually increase over time
    const memBase = 50 + Math.sin(now / 50000) * 30;
    const memoryUsageRaw = Math.min(100, memBase + (Math.random() * 20));
    
    // Network latency fluctuates with occasional spikes
    const latencyBase = 2 + Math.sin(now / 5000);
    const latencySpike = Math.random() > 0.9 ? Math.random() * 10 : 0;
    const networkLatencyRaw = Math.max(0.5, latencyBase + latencySpike);
    
    const metrics: PerformanceMetrics = {
      cpuLoad: `${cpuLoadRaw.toFixed(2)}%`,
      memoryUsage: `${memoryUsageRaw.toFixed(2)}%`,
      networkLatency: `${networkLatencyRaw.toFixed(2)} ms`,
      cpuLoadRaw,
      memoryUsageRaw,
      networkLatencyRaw
    };
    
    this.metricsSubject.next(metrics);
    
    this.logMetrics();
  }
  
  /**
   * Log performance metrics
   */
  private logMetrics(): void {
    const metrics = this.metricsSubject.getValue();
    this.logger.performance('System performance metrics updated', [
      { name: 'CPU Load', value: metrics.cpuLoad, unit: '%' },
      { name: 'Memory Usage', value: metrics.memoryUsage, unit: '%' },
      { name: 'Network Latency', value: metrics.networkLatency, unit: 'ms' }
    ], {
      type: 'SYSTEM_METRICS',
      category: 'system:performance:metrics'
    });
  }

  /**
   * Get current metrics value
   */
  getCurrentMetrics(): PerformanceMetrics {
    return this.metricsSubject.getValue();
  }

  /**
   * Start sampling the browser's framerate
   */
  startFramerateSampling(): void {
    if (this._frameId) { return; }
    this._lastFrameTime = performance.now();
    this.recordFrame();
  }

  /**
   * Record a frame and calculate FPS
   */
  private recordFrame(): void {
    this._frameId = requestAnimationFrame((latestTimestamp) => {
      if (this._lastFrameTime !== null) {
        const delta = latestTimestamp - this._lastFrameTime;
        const fps = 1000 / delta;
        this._fpsSubject.next(fps);
      }
      this._lastFrameTime = latestTimestamp;
      this.recordFrame();
    });
  }

  /**
   * Stop sampling the browser's framerate
   */
  stopFramerateSampling(): void {
    if (this._frameId) {
      cancelAnimationFrame(this._frameId);
      this._frameId = null;
      this._lastFrameTime = null;
    }
  }

  /**
   * Get the framerate as an observable
   */
  getFramerate$(): Observable<number> {
    return this._fpsSubject.asObservable();
  }

  /**
   * Record metrics from an API call
   */
  recordApiMetrics(metrics: ApiMetrics): void {
    // Keep only the latest 100 API metrics
    if (this.apiMetrics.length >= 100) {
      this.apiMetrics.shift();
    }
    
    this.apiMetrics.push(metrics);
    this.apiMetricsSubject.next([...this.apiMetrics]);
    
    // Update summary statistics
    this.updateApiPerformanceSummary();
  }
  
  /**
   * Record an API call metric
   */
  recordApiCall(metric: ApiCallMetric): void {
    const apiMetrics = [...this.apiMetricsSubject.value];
    const timestamp = metric.timestamp || Date.now();

    // Convert ApiCallMetric -> ApiMetrics
    const converted: ApiMetrics = {
      url: metric.endpoint,
      method: metric.method,
      duration: metric.duration,
      requestSize: 0,
      responseSize: 0,
      status: metric.success ? 200 : 500,
      timestamp,
      success: metric.success
    };

    apiMetrics.push(converted);

    // Keep only recent metrics (last 100 or last 5 minutes)
    const fiveMinutesAgo = Date.now() - 5 * 60 * 1000;
    const recentMetrics = apiMetrics
      .filter(m => m.timestamp > fiveMinutesAgo)
      .slice(-100);

    this.apiMetricsSubject.next(recentMetrics);

    // Call the correct method
    this.updateApiPerformanceSummary();
  }

  /**
   * Get the latest API metrics
   */
  getApiMetrics(): ApiMetrics[] {
    return [...this.apiMetrics];
  }
  
  /**
   * Calculate and update API performance summary
   */
  private updateApiPerformanceSummary(): void {
    if (this.apiMetrics.length === 0) {
      return;
    }
    
    // Calculate overall stats
    const totalRequests = this.apiMetrics.length;
    const successfulRequests = this.apiMetrics.filter(m => m.success).length;
    const failedRequests = totalRequests - successfulRequests;
    
    // Calculate response times
    const durations = this.apiMetrics.map(m => m.duration);
    const avgResponseTime = durations.reduce((sum, val) => sum + val, 0) / durations.length;
    const maxResponseTime = Math.max(...durations);
    
    // Calculate data transfer
    const totalDataTransferred = this.apiMetrics.reduce(
      (sum, m) => sum + m.requestSize + m.responseSize, 0
    );
    
    // Calculate per-endpoint stats
    const endpointMap = new Map<string, EndpointStats>();
    
    // Group by URL pattern (remove query params and IDs)
    this.apiMetrics.forEach(metric => {
      const urlPattern = this.normalizeUrl(metric.url);
      
      if (!endpointMap.has(urlPattern)) {
        endpointMap.set(urlPattern, {
          url: urlPattern,
          callCount: 0,
          avgDuration: 0,
          successRate: 0
        });
      }
      
      const stats = endpointMap.get(urlPattern)!;
      stats.callCount++;
      
      // Update running average: newAvg = oldAvg + (newValue - oldAvg) / newCount
      stats.avgDuration = stats.avgDuration + (metric.duration - stats.avgDuration) / stats.callCount;
      
      // Update success rate
      const successCount = this.apiMetrics
        .filter(m => this.normalizeUrl(m.url) === urlPattern && m.success)
        .length;
        
      stats.successRate = (successCount / stats.callCount) * 100;
    });
    
    // Update the subject with new summary
    this.apiPerformanceSubject.next({
      avgResponseTime,
      maxResponseTime,
      totalRequests,
      successfulRequests,
      failedRequests,
      totalDataTransferred,
      endpointStats: endpointMap
    });
  }
  
  /**
   * Normalize URL to group similar endpoints
   * e.g. /api/users/123 and /api/users/456 become /api/users/{id}
   */
  private normalizeUrl(url: string): string {
    try {
      // Parse the URL to get the pathname
      const parsedUrl = new URL(url, window.location.origin);
      const pathParts = parsedUrl.pathname.split('/');
      
      // Replace numeric IDs with {id} placeholder
      const normalizedParts = pathParts.map(part => {
        // If part is numeric or looks like an ID (UUID, etc.), replace with {id}
        if (/^\d+$/.test(part) || /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(part)) {
          return '{id}';
        }
        return part;
      });
      
      return normalizedParts.join('/');
    } catch (e) {
      // If URL parsing fails, return as is
      return url;
    }
  }
}
