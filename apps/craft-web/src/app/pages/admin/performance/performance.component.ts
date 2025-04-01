import { Component, OnInit, OnDestroy } from '@angular/core';
import { ThemeService } from '../../../common/services/theme.service';
import { Subject, interval } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { PerformanceMetricsService, SystemMetrics } from '../../../common/services/performance-metrics.service';
import { LoggerService } from '../../../common/services/logger.service';
import { UserActivityService } from '../../../common/services/user-activity.service';

interface MetricItem {
  name: string;
  value: string;
  rawValue: number;
  unit: string;
  trend: 'up' | 'down' | 'stable';
  change: number;
  history: number[];
}

@Component({
  selector: 'app-performance',
  templateUrl: './performance.component.html',
  styleUrls: ['./performance.component.scss'],
  standalone: false
})
export class PerformanceComponent implements OnInit, OnDestroy {
  themeClass = '';
  private destroy$ = new Subject<void>();
  
  // Performance metrics
  cpuMetric: MetricItem = {
    name: 'CPU',
    value: '0',
    rawValue: 0,
    unit: '%',
    trend: 'stable',
    change: 0,
    history: []
  };
  
  memoryMetric: MetricItem = {
    name: 'Memory',
    value: '0',
    rawValue: 0,
    unit: '%',
    trend: 'stable',
    change: 0,
    history: []
  };
  
  networkMetric: MetricItem = {
    name: 'Network',
    value: '0',
    rawValue: 0,
    unit: 'ms',
    trend: 'stable',
    change: 0,
    history: []
  };

  fps: number = 0;
  userActivitySummary: any = {};
  isMonitoring: boolean = false;
  
  constructor(
    private themeService: ThemeService,
    private performanceMetricsService: PerformanceMetricsService,
    private logger: LoggerService,
    private userActivityService: UserActivityService
  ) {}
  
  ngOnInit(): void {
    // Subscribe to theme changes
    this.themeService.isDarkTheme$
      .pipe(takeUntil(this.destroy$))
      .subscribe(isDarkTheme => {
        this.themeClass = isDarkTheme ? 'dark-theme' : 'light-theme';
      });
    
    // Start metrics collection
    this.startMetricsCollection();
    
    // Get user activity summary
    this.getUserActivitySummary();
    
    // Start FPS monitoring
    this.startFrameMonitoring();
    
    this.logger.info('Performance monitoring component initialized', {
      component: 'PerformanceComponent',
      category: 'PERFORMANCE',
    });
  }
  
  ngOnDestroy(): void {
    // Stop metrics collection when component is destroyed
    this.performanceMetricsService.stopMetricsSimulation();
    this.performanceMetricsService.stopFramerateSampling();
    this.destroy$.next();
    this.destroy$.complete();
    this.logger.info('Performance monitoring stopped', {
      component: 'PerformanceComponent',
      category: 'PERFORMANCE',
    });
  }
  
  startMetricsCollection(): void {
    // Start performance metrics simulation if not already active
    this.performanceMetricsService.startMetricsSimulation();
    this.isMonitoring = true;
    
    console.log('Starting metrics collection'); // Add logging to verify it's running
    
    // Subscribe to metrics updates
    this.performanceMetricsService.metrics$
      .pipe(takeUntil(this.destroy$))
      .subscribe(metrics => {
        // Update CPU metrics
        const cpuRaw = metrics.cpuLoadRaw || 0; // Provide default value to avoid undefined
        this.updateMetric(this.cpuMetric, cpuRaw, metrics.cpuLoad || '0%');
        
        // Update Memory metrics
        const memoryRaw = metrics.memoryUsageRaw || 0; // Provide default value to avoid undefined
        this.updateMetric(this.memoryMetric, memoryRaw, metrics.memoryUsage?.toString() || '0%');
        
        // Update Network metrics
        const networkRaw = metrics.networkLatencyRaw || 0; // Provide default value to avoid undefined
        this.updateMetric(this.networkMetric, networkRaw, metrics.networkLatency || '0ms');
        
        console.log('Updated metrics:', {
          cpu: this.cpuMetric.value,
          memory: this.memoryMetric.value,
          network: this.networkMetric.value
        });
        
        // Log detailed performance data at intervals
        if (this.cpuMetric.history.length % 5 === 0) {
          this.logPerformanceMetrics();
        }
      });
      
    // Refresh user activity summary every 10 seconds
    interval(10000)
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.getUserActivitySummary();
      });
  }
  
  startFrameMonitoring(): void {
    this.performanceMetricsService.startFramerateSampling();
    
    this.performanceMetricsService.getFramerate$()
      .pipe(takeUntil(this.destroy$))
      .subscribe(fps => {
        this.fps = fps; // Now returns a number directly
      });
  }
  
  stopMetricsCollection(): void {
    this.performanceMetricsService.stopMetricsSimulation();
    this.isMonitoring = false;
    this.logger.info('Performance metrics collection manually stopped', {
      component: 'PerformanceComponent',
      category: 'PERFORMANCE'
    });
  }
  
  toggleMetricsCollection(): void {
    if (this.isMonitoring) {
      this.stopMetricsCollection();
    } else {
      this.startMetricsCollection();
    }
  }
  
  private updateMetric(metric: MetricItem, rawValue: number, formattedValue: string | number): void {
    // Add to history (keep last 20 values)
    metric.history.push(rawValue);
    if (metric.history.length > 20) {
      metric.history.shift();
    }
    
    // Calculate trend and change
    if (metric.history.length > 1) {
      const previous = metric.history[metric.history.length - 2];
      const change = rawValue - previous;
      const percentChange = previous !== 0 ? (change / previous) * 100 : 0;
      
      metric.change = +percentChange.toFixed(1);
      
      if (Math.abs(percentChange) < 1) {
        metric.trend = 'stable';
      } else {
        metric.trend = percentChange > 0 ? 'up' : 'down';
      }
    }
    
    // Update current value
    metric.rawValue = rawValue;
    // Handle both string and number inputs
    metric.value = typeof formattedValue === 'string' 
      ? formattedValue.replace('%', '').replace('ms', '').trim() 
      : formattedValue.toString();
  }
  
  private logPerformanceMetrics(): void {
    this.logger.performance('Performance metrics updated', [
      { name: 'CPU', value: this.cpuMetric.rawValue, unit: '%' },
      { name: 'Memory', value: this.memoryMetric.rawValue, unit: '%' },
      { name: 'Network', value: this.networkMetric.rawValue, unit: 'ms' }
    ], {
      category: 'system:performance:metrics'
    });
  }
  
  getUserActivitySummary(): void {
    this.userActivitySummary = this.userActivityService.getActivitySummary();
  }
  
  formatSessionDuration(ms: number): string {
    const seconds = Math.floor(ms / 1000);
    if (seconds < 60) return `${seconds}s`;
    
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ${seconds % 60}s`;
    
    const hours = Math.floor(minutes / 60);
    return `${hours}h ${minutes % 60}m`;
  }
  
  getCpuTrend(): string {
    return this.getTrendIndicator(this.cpuMetric);
  }
  
  getMemoryTrend(): string {
    return this.getTrendIndicator(this.memoryMetric);
  }
  
  getNetworkTrend(): string {
    return this.getTrendIndicator(this.networkMetric);
  }
  
  private getTrendIndicator(metric: MetricItem): string {
    const arrowColor = metric.trend === 'up' 
      ? '#FF6384'  // Red for up (usually bad for resource usage)
      : metric.trend === 'down' 
        ? '#4BC0C0'  // Green for down (usually good for resource usage)
        : '#36A2EB'; // Blue for stable
    
    const arrow = metric.trend === 'up' 
      ? '▲' 
      : metric.trend === 'down' 
        ? '▼' 
        : '•';
    
    return `<span style="color: ${arrowColor}; font-weight: bold; margin-left: 5px;">
      ${arrow} ${Math.abs(metric.change)}%
    </span>`;
  }
}
