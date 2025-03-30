import { Component, OnInit, OnDestroy, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { ThemeService } from '../../../common/services/theme.service';
import { LoggerService } from '../../../common/services/logger.service';
import { PerformanceMetricsService } from '../../../common/services/performance-metrics.service';
import { UserActivityService } from '../../../common/services/user-activity.service';
import { ApiLoggerService } from '../../../common/services/api-logger.service';
import { ApiService, ServerMetrics } from '../../../common/services/api.service';
import { interval, Subject, forkJoin, of } from 'rxjs';
import { takeUntil, catchError } from 'rxjs/operators';
import { LoggerHelperService } from '../../../common/services/logger-helper.service';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss'],
  standalone: false,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DashboardComponent implements OnInit, OnDestroy {
  themeClass = '';
  pageViews = 0;
  userInteractions = 0;
  totalErrors = 0;
  totalWarnings = 0;
  apiCalls = 0;
  avgResponseTime = 0;
  apiCallRate = 0;
  performanceScore = 0;

  // System metrics
  cpuUsage = 0;
  memoryUsage = 0;
  networkLatency = 0;
  systemUptime = 0;

  // Trend indicators
  cpuTrend: 'up' | 'down' | 'stable' = 'stable';
  memoryTrend: 'up' | 'down' | 'stable' = 'stable';
  networkTrend: 'up' | 'down' | 'stable' = 'stable';

  // Previous metrics for trend calculation
  previousCpu = 0;
  previousMemory = 0;
  previousNetwork = 0;

  // Tables data
  recentErrors: any[] = [];
  recentApiCalls: any[] = [];

  // User activity data
  userActivitySummary: any = {};
  activeUsers = 0;

  // System status
  systemStatus: 'online' | 'degraded' | 'warning' | 'offline' = 'online';

  // Server metrics
  nestServer: ServerMetrics | null = null;
  goServer: ServerMetrics | null = null;

  private destroy$ = new Subject<void>();

  constructor(
    private themeService: ThemeService,
    private loggerService: LoggerService,
    private performanceService: PerformanceMetricsService,
    private userActivityService: UserActivityService,
    private apiLoggerService: ApiLoggerService,
    private apiService: ApiService,
    private cdRef: ChangeDetectorRef,
    private loggerHelper: LoggerHelperService
  ) {
    this.loggerService.registerService('DashboardComponent');
  }

  ngOnInit(): void {
    this.loggerService.info('Dashboard component initialized');

    // Subscribe to theme changes
    this.themeService.isDarkTheme$
      .pipe(takeUntil(this.destroy$))
      .subscribe(isDarkTheme => {
        this.themeClass = isDarkTheme ? 'dark-theme' : 'light-theme';
      });

    // Load initial data
    this.loadDashboardData();

    // Load server metrics
    this.loadServerMetrics();

    // Set up periodic refresh
    interval(10000)
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.loadDashboardData();
      });

    interval(30000)
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.loadServerMetrics();
      });

    // Subscribe to API summary for real-time updates
    this.apiLoggerService.summary$
      .pipe(takeUntil(this.destroy$))
      .subscribe(summary => {
        this.apiCalls = summary.totalCalls;
        this.avgResponseTime = summary.avgResponseTime;

        // Update dashboard with real-time API rate
        this.apiCallRate = summary.callsPerMinute;

        // Get error rate for status calculation
        const apiErrorRate = summary.errorRate;
        if (apiErrorRate > 10) {
          // Adjust system status if error rate is high
          this.systemStatus = 'warning';
        }
      });

    // Subscribe to real-time performance metrics
    this.performanceService.metrics$
      .pipe(takeUntil(this.destroy$))
      .subscribe(metrics => {
        this.cpuUsage = metrics.cpuLoadRaw;
        this.memoryUsage = metrics.memoryUsageRaw;
        this.networkLatency = metrics.networkLatencyRaw;

        // Additional real-time performance indicators
        this.performanceScore = this.calculatePerformanceScore(
          metrics.cpuLoadRaw,
          metrics.memoryUsageRaw,
          metrics.networkLatencyRaw
        );
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadDashboardData(): void {
    // Store previous metrics for trend calculation
    this.previousCpu = this.cpuUsage;
    this.previousMemory = this.memoryUsage;
    this.previousNetwork = this.networkLatency;

    // Load user activity data
    this.userActivitySummary = this.userActivityService.getActivitySummary();
    this.pageViews = this.userActivitySummary.pageViews || 0;
    this.userInteractions = (this.userActivitySummary.clicks || 0) + (this.userActivitySummary.inputs || 0);
    this.activeUsers = this.userActivitySummary.activeUsers || 1;

    // Load error and warning counts
    this.totalErrors = this.loggerService.getLogsByLevel(0).length;
    this.totalWarnings = this.loggerService.getLogsByLevel(1).length;

    // Load API call data
    const apiLogs = this.apiLoggerService.getLogs();
    this.apiCalls = apiLogs.length;

    // Calculate average response time
    if (apiLogs.length > 0) {
      const totalResponseTime = apiLogs.reduce((total, log) => total + log.responseTime, 0);
      this.avgResponseTime = Math.round(totalResponseTime / apiLogs.length);
    }

    // Get latest system metrics
    const metrics = this.performanceService.getCurrentMetrics();
    this.cpuUsage = metrics.cpuLoadRaw;
    this.memoryUsage = metrics.memoryUsageRaw;
    this.networkLatency = metrics.networkLatencyRaw;

    // Calculate trends
    this.calculateTrends();

    // Determine system status
    this.determineSystemStatus();

    // Calculate system uptime
    this.systemUptime = Math.floor(Date.now() / 1000) % 86400;

    // Get recent errors (limited to 5)
    this.recentErrors = this.loggerService.getLogsByLevel(0)
      .sort((a, b) => this.loggerHelper.compareTimestamps(b.timestamp, a.timestamp))
      .slice(0, 5)
      .map(log => ({
        timestamp: log.timestamp,
        message: log.message || 'Unknown error',
        source: log.source || 'System'
      }));

    // Get recent API calls (limited to 5)
    this.recentApiCalls = apiLogs
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, 5)
      .map(log => ({
        timestamp: new Date(log.timestamp),
        url: log.request.url,
        method: log.request.method,
        status: log.response?.status || 0,
        time: log.responseTime
      }));
  }

  loadServerMetrics(): void {
    const requestStart = performance.now();
    const requestId = Math.random().toString(36).substring(2, 15);

    this.loggerService.info('Loading server metrics', {
      requestId,
      component: 'DashboardComponent',
      operation: 'loadServerMetrics',
      timestamp: new Date()
    });

    forkJoin({
      nest: this.apiService.getNestServerMetrics().pipe(
        catchError(error => {
          this.loggerService.warn('Failed to fetch Nest metrics, using fallback data', {
            requestId,
            error: error?.message || 'Unknown error',
            endpoint: 'Nest server metrics',
            timestamp: new Date()
          });
          return of(null);
        })
      ),
      go: this.apiService.getGoServerMetrics().pipe(
        catchError(error => {
          this.loggerService.warn('Failed to fetch Go metrics, using fallback data', {
            requestId,
            error: error?.message || 'Unknown error',
            endpoint: 'Go server metrics',
            timestamp: new Date()
          });
          return of(null);
        })
      )
    }).subscribe({
      next: results => {
        const requestDuration = Math.round(performance.now() - requestStart);
        this.nestServer = results.nest;
        this.goServer = results.go;

        this.loggerService.info('Server metrics loaded', {
          requestId,
          duration: requestDuration,
          nestStatus: this.nestServer?.status || 'offline',
          goStatus: this.goServer?.status || 'offline',
          timestamp: new Date()
        });

        if (!this.nestServer && !this.goServer) {
          this.loggerService.warn('Both servers are offline, using mock data', { requestId });
          this.provideMockServerData();
        } else {
          this.updateSystemStatusFromServers();
        }

        this.cdRef.markForCheck();
      },
      error: error => {
        const requestDuration = Math.round(performance.now() - requestStart);
        this.loggerService.error('Critical error loading server metrics', {
          requestId,
          error: error?.message || 'Unknown error',
          duration: requestDuration,
          timestamp: new Date()
        });

        this.provideMockServerData();
        this.cdRef.markForCheck();
      }
    });
  }

  private provideMockServerData(): void {
    this.nestServer = this.createMockServerData('Nest Server');
    this.goServer = this.createMockServerData('Go Server');
    this.systemStatus = 'degraded';
    this.loggerService.info('Using mock server data for dashboard demo', {
      context: 'Dashboard',
      dataType: 'Mock Server Metrics'
    });
  }

  private createMockServerData(name: string): ServerMetrics {
    const cpuLoad = 30 + Math.floor(Math.random() * 40);
    const memoryUsage = 40 + Math.floor(Math.random() * 35);
    const latency = 80 + Math.floor(Math.random() * 50);

    let status: 'online' | 'degraded' | 'warning' | 'offline';

    if (name.includes('Go')) {
      status = 'offline';
    } else {
      if (cpuLoad > 85 || memoryUsage > 85 || latency > 250) {
        status = 'warning';
      } else if (cpuLoad > 70 || memoryUsage > 70 || latency > 150) {
        status = 'degraded';
      } else {
        status = 'online';
      }
    }

    return {
      name: name + (name.includes('Go') ? ' (Offline)' : ''),
      tol: Date.now(),
      status: status,
      latency: status === 'offline' ? 0 : latency,
      serverMetrics: {
        cpu: status === 'offline' ? 0 : cpuLoad,
        memory: status === 'offline' ? 0 : memoryUsage,
        uptime: status === 'offline' ? 0 : 3600 * (1 + Math.floor(Math.random() * 72)),
        activeUsers: status === 'offline' ? 0 : 10 + Math.floor(Math.random() * 40),
        requestsPerSecond: status === 'offline' ? 0 : 5 + Math.floor(Math.random() * 20)
      },
      apiPerformance: {
        avgResponseTime: status === 'offline' ? 0 : latency,
        totalRequests: status === 'offline' ? 0 : 5000 + Math.floor(Math.random() * 5000),
        successfulRequests: status === 'offline' ? 0 : 4900 + Math.floor(Math.random() * 95),
        failedRequests: status === 'offline' ? 0 : Math.floor(Math.random() * 20),
        endpointStats: status === 'offline' ? {} : {
          '/api/users': { hits: 1234, avgResponseTime: 65, errors: 5 },
          '/api/data': { hits: 987, avgResponseTime: 85, errors: 3 },
          '/api/metrics': { hits: 543, avgResponseTime: 35, errors: 1 }
        }
      }
    };
  }

  updateSystemStatusFromServers(): void {
    if (!this.nestServer && !this.goServer) {
      this.systemStatus = 'offline';
      return;
    }

    const nestStatus = this.nestServer?.status || 'offline';
    const goStatus = this.goServer?.status || 'offline';

    if (nestStatus === 'offline' || goStatus === 'offline') {
      this.systemStatus = 'warning';
    } else if (nestStatus === 'warning' || goStatus === 'warning') {
      this.systemStatus = 'warning';
    } else if (nestStatus === 'degraded' || goStatus === 'degraded') {
      this.systemStatus = 'degraded';
    } else {
      this.systemStatus = 'online';
    }
  }

  private calculateTrends(): void {
    if (this.previousCpu > 0) {
      const cpuDiff = this.cpuUsage - this.previousCpu;
      if (Math.abs(cpuDiff) < 3) {
        this.cpuTrend = 'stable';
      } else {
        this.cpuTrend = cpuDiff > 0 ? 'up' : 'down';
      }
    }

    if (this.previousMemory > 0) {
      const memoryDiff = this.memoryUsage - this.previousMemory;
      if (Math.abs(memoryDiff) < 3) {
        this.memoryTrend = 'stable';
      } else {
        this.memoryTrend = memoryDiff > 0 ? 'up' : 'down';
      }
    }

    if (this.previousNetwork > 0) {
      const networkDiff = this.networkLatency - this.previousNetwork;
      if (Math.abs(networkDiff) < 5) {
        this.networkTrend = 'stable';
      } else {
        this.networkTrend = networkDiff > 0 ? 'up' : 'down';
      }
    }
  }

  private determineSystemStatus(): void {
    if (this.cpuUsage > 90 || this.memoryUsage > 95 || this.networkLatency > 500) {
      this.systemStatus = 'warning';
    } else if (this.cpuUsage > 80 || this.memoryUsage > 85 || this.networkLatency > 250) {
      this.systemStatus = 'degraded';
    } else {
      this.systemStatus = 'online';
    }

    if (this.totalErrors > 5) {
      this.systemStatus = 'warning';
    }
  }

  private calculatePerformanceScore(cpu: number, memory: number, network: number): number {
    const cpuWeight = 0.4;
    const memoryWeight = 0.4;
    const networkWeight = 0.2;

    const normalizedNetwork = Math.min(network, 500) / 5;

    const score = (cpu * cpuWeight) + (memory * memoryWeight) + (normalizedNetwork * networkWeight);

    return Math.max(0, Math.min(100, 100 - score));
  }

  formatTimeAgo(timestamp: number | Date): string {
    return this.loggerHelper.formatTimeAgo(timestamp);
  }

  getStatusClass(status: number): string {
    if (status >= 200 && status < 300) return 'status-success';
    if (status >= 300 && status < 400) return 'status-warning';
    if (status >= 400) return 'status-error';
    return 'status-unknown';
  }

  getSystemStatusClass(status?: string): string {
    const statusToCheck = status || this.systemStatus;

    switch (statusToCheck) {
      case 'online': return 'status-success';
      case 'degraded': return 'status-warning';
      case 'warning': return 'status-error';
      case 'offline': return 'status-offline';
      default: return 'status-unknown';
    }
  }

  getTrendIcon(trend: 'up' | 'down' | 'stable'): string {
    switch (trend) {
      case 'up': return 'trending_up';
      case 'down': return 'trending_down';
      default: return 'trending_flat';
    }
  }

  getTrendClass(trend: 'up' | 'down' | 'stable', isResourceMetric: boolean = true): string {
    if (isResourceMetric) {
      switch (trend) {
        case 'up': return 'trend-negative';
        case 'down': return 'trend-positive';
        default: return 'trend-neutral';
      }
    } else {
      switch (trend) {
        case 'up': return 'trend-positive';
        case 'down': return 'trend-negative';
        default: return 'trend-neutral';
      }
    }
  }

  getLatencyClass(latency: number): string {
    if (latency < 100) return 'excellent';
    if (latency < 200) return 'good';
    if (latency < 300) return 'fair';
    if (latency < 500) return 'poor';
    return 'critical';
  }

  getScoreColor(score: number): string {
    if (score >= 90) return '#4caf50';
    if (score >= 70) return '#8bc34a';
    if (score >= 50) return '#ffeb3b';
    if (score >= 30) return '#ff9800';
    return '#f44336';
  }

  refreshData(): void {
    this.loadDashboardData();
    this.loadServerMetrics();
  }

  formatSessionDuration(ms: number): string {
    const seconds = Math.floor(ms / 1000);
    if (seconds < 60) return `${seconds}s`;

    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ${seconds % 60}s`;

    const hours = Math.floor(minutes / 60);
    return `${hours}h ${minutes % 60}m`;
  }

  formatUptime(seconds: number): string {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }

  trackByTimestamp(index: number, item: any): number {
    return item.timestamp instanceof Date ? item.timestamp.getTime() : item.timestamp;
  }
}
