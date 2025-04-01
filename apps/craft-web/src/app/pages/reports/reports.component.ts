import { Component, OnInit, OnDestroy } from '@angular/core';
import { PerformanceMetricsService, ApiPerformanceSummary } from '../../common/services/performance-metrics.service';
import { HealthService, ServiceHealth } from '../../common/services/health.service';
import { UserStateService } from '../../common/services/user-state.service';
import { UserActivityService } from '../../common/services/user-activity.service';
import { ThemeService } from '../../common/services/theme.service';
import { LoggerService } from '../../common/services/logger.service';
import { BehaviorSubject, Observable, Subject } from 'rxjs';
import { takeUntil, map } from 'rxjs/operators';

@Component({
  selector: 'app-reports',
  templateUrl: './reports.component.html',
  styleUrls: ['./reports.component.scss'],
  standalone: false
})
export class ReportsComponent implements OnInit, OnDestroy {
  // System metrics
  systemMetrics$: Observable<any>; // Change type to any to avoid issues
  apiPerformance$: Observable<ApiPerformanceSummary>;
  
  // Health data
  servicesHealth$: Observable<ServiceHealth[]>;
  overallHealth$: Observable<number>; // 0-100 scale
  healthStatusText$: Observable<string>;
  
  // User activity
  userActivityData$: Observable<any[]>;
  activeUsers$: Observable<number>;
  
  // Chart data
  cpuChartData$: BehaviorSubject<any[]> = new BehaviorSubject<any[]>([]);
  memoryChartData$: BehaviorSubject<any[]> = new BehaviorSubject<any[]>([]);
  apiResponseTimeData$: BehaviorSubject<any[]> = new BehaviorSubject<any[]>([]);
  userSessionData$: BehaviorSubject<any[]> = new BehaviorSubject<any[]>([]);
  
  // Chart options
  cpuChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      y: {
        beginAtZero: true,
        max: 100,
        title: {
          display: true,
          text: 'CPU Usage (%)'
        }
      }
    }
  };
  
  memoryChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      y: {
        beginAtZero: true,
        max: 100,
        title: {
          display: true,
          text: 'Memory Usage (%)'
        }
      }
    }
  };
  
  apiChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      y: {
        beginAtZero: true,
        title: {
          display: true,
          text: 'Response Time (ms)'
        }
      }
    }
  };
  
  // Time periods for filtering
  timePeriods = [
    { label: 'Last Hour', value: 60 },
    { label: 'Last 24 Hours', value: 24 * 60 },
    { label: 'Last 7 Days', value: 7 * 24 * 60 },
    { label: 'Last 30 Days', value: 30 * 24 * 60 }
  ];
  selectedTimePeriod = this.timePeriods[1].value; // Default to 24 hours
  
  // UI state
  loading = {
    system: true,
    api: true,
    health: true,
    user: true
  };
  
  error = {
    system: false,
    api: false,
    health: false,
    user: false
  };
  
  // Track subscriptions for cleanup
  private destroy$ = new Subject<void>();
  
  constructor(
    private performanceService: PerformanceMetricsService,
    private healthService: HealthService,
    private userStateService: UserStateService,
    private userActivityService: UserActivityService,
    private themeService: ThemeService,
    private logger: LoggerService
  ) {
    // Initialize observables
    this.systemMetrics$ = this.performanceService.metrics$;
    this.apiPerformance$ = this.performanceService.apiPerformance$;
    this.servicesHealth$ = this.healthService.servicesHealth$;
    
    // Calculate overall health as average of all service health percentages
    this.overallHealth$ = this.servicesHealth$.pipe(
      map(services => {
        if (!services || services.length === 0) return 0;
        const total = services.reduce((sum, service) => sum + service.healthPercentage, 0);
        return Math.round(total / services.length);
      })
    );
    
    // Map health percentage to status text
    this.healthStatusText$ = this.overallHealth$.pipe(
      map(health => {
        if (health >= 90) return 'Excellent';
        if (health >= 75) return 'Good';
        if (health >= 50) return 'Fair';
        if (health >= 25) return 'Poor';
        return 'Critical';
      })
    );
    
    // Get user activity data
    this.userActivityData$ = this.userActivityService.getUserActivityData();
    this.activeUsers$ = this.userActivityService.getActiveUserCount();
  }
  
  ngOnInit(): void {
    this.logger.info('Reports component initialized');
    
    // Start performance metrics simulation if not already running
    this.performanceService.startMetricsSimulation();
    this.performanceService.startFramerateSampling();
    
    // Listen for system metrics changes and update chart data
    this.systemMetrics$.pipe(
      takeUntil(this.destroy$)
    ).subscribe(metrics => {
      this.updateCpuChartData(metrics.cpuLoadRaw);
      this.updateMemoryChartData(metrics.memoryUsageRaw);
      this.loading.system = false;
    }, () => {
      this.error.system = true;
      this.loading.system = false;
    });
    
    // Listen for API performance changes and update chart data
    this.apiPerformance$.pipe(
      takeUntil(this.destroy$)
    ).subscribe(performance => {
      this.updateApiResponseTimeData(performance);
      this.loading.api = false;
    }, () => {
      this.error.api = true;
      this.loading.api = false;
    });
    
    // Listen for health status changes
    this.servicesHealth$.pipe(
      takeUntil(this.destroy$)
    ).subscribe(() => {
      this.loading.health = false;
    }, () => {
      this.error.health = true;
      this.loading.health = false;
    });
    
    // Listen for user activity data
    this.userActivityData$.pipe(
      takeUntil(this.destroy$)
    ).subscribe(data => {
      this.updateUserSessionData(data);
      this.loading.user = false;
    }, () => {
      this.error.user = true;
      this.loading.user = false;
    });
    
    // Initialize with historical data
    this.loadHistoricalData();
  }
  
  ngOnDestroy(): void {
    this.performanceService.stopFramerateSampling();
    this.destroy$.next();
    this.destroy$.complete();
  }
  
  onTimePeriodChange(event: { value: number }): void {
    this.selectedTimePeriod = event.value;
    this.loadHistoricalData();
  }
  
  private loadHistoricalData(): void {
    // Reset loading states
    this.loading = {
      system: true,
      api: true,
      health: true,
      user: true
    };
    
    // Load historical system metrics
    this.performanceService.getHistoricalData(
      this.selectedTimePeriod / (60 * 24) || 1 // Convert minutes to days
    ).subscribe(data => {
      // Map to CPU and Memory charts
      const cpuData = data.map(item => ({
        label: item.label,
        value: item.value
      }));
      
      const memoryData = data.map(item => ({
        label: item.label,
        value: item.value * 1.2 % 100 // Create some variation
      }));
      
      this.cpuChartData$.next(cpuData);
      this.memoryChartData$.next(memoryData);
      this.loading.system = false;
    }, () => {
      this.error.system = true;
      this.loading.system = false;
    });
    
    // Load historical API metrics
    this.performanceService.getHistoricalData(
      this.selectedTimePeriod / (60 * 24) || 1 // Convert minutes to days
    ).subscribe(data => {
      const apiData = data.map(item => ({
        label: item.label,
        value: item.value * 3 // Scale for response time in ms
      }));
      
      this.apiResponseTimeData$.next(apiData);
      this.loading.api = false;
    }, () => {
      this.error.api = true;
      this.loading.api = false;
    });
    
    // Load user activity data
    this.userActivityService.getHistoricalUserActivity(
      this.selectedTimePeriod / (60 * 24) || 1 // Convert minutes to days
    ).subscribe((data: any[]) => { // Fix: Add explicit type to data parameter
      this.userSessionData$.next(data);
      this.loading.user = false;
    }, () => {
      this.error.user = true;
      this.loading.user = false;
    });
  }
  
  private updateCpuChartData(newValue: number): void {
    const currentData = this.cpuChartData$.value;
    if (currentData.length === 0) return;
    
    // Add new data point to end, using current time
    const now = new Date();
    const timeStr = now.getHours().toString().padStart(2, '0') + ':' + 
                  now.getMinutes().toString().padStart(2, '0');
    
    const newData = [
      ...currentData.slice(1), // Remove first point
      { label: timeStr, value: newValue }
    ];
    
    this.cpuChartData$.next(newData);
  }
  
  private updateMemoryChartData(newValue: number): void {
    const currentData = this.memoryChartData$.value;
    if (currentData.length === 0) return;
    
    // Add new data point to end, using current time
    const now = new Date();
    const timeStr = now.getHours().toString().padStart(2, '0') + ':' + 
                  now.getMinutes().toString().padStart(2, '0');
    
    const newData = [
      ...currentData.slice(1), // Remove first point
      { label: timeStr, value: newValue }
    ];
    
    this.memoryChartData$.next(newData);
  }
  
  private updateApiResponseTimeData(performance: ApiPerformanceSummary): void {
    const currentData = this.apiResponseTimeData$.value;
    if (currentData.length === 0) return;
    
    // Add new data point to end, using current time
    const now = new Date();
    const timeStr = now.getHours().toString().padStart(2, '0') + ':' + 
                  now.getMinutes().toString().padStart(2, '0');
    
    const newData = [
      ...currentData.slice(1), // Remove first point
      { label: timeStr, value: performance.avgResponseTime }
    ];
    
    this.apiResponseTimeData$.next(newData);
  }
  
  private updateUserSessionData(userData: any[]): void {
    this.userSessionData$.next(userData);
  }
  
  getHealthStatusClass(health: number): string {
    if (health >= 90) return 'status-excellent';
    if (health >= 75) return 'status-good';
    if (health >= 50) return 'status-fair';
    if (health >= 25) return 'status-poor';
    return 'status-critical';
  }
  
  getEndpointErrorRate(apiPerformance: ApiPerformanceSummary): number {
    if (!apiPerformance || apiPerformance.totalRequests === 0) return 0;
    return (apiPerformance.failedRequests / apiPerformance.totalRequests) * 100;
  }
}
