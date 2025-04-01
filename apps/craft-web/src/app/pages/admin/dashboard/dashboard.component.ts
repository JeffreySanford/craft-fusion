import { Component, OnInit, OnDestroy } from '@angular/core';
import { Observable, combineLatest, interval } from 'rxjs';
import { startWith, switchMap, map, shareReplay } from 'rxjs/operators';
import { ApiService, ServerMetrics } from '../../../common/services/api.service';
import { ThemeService } from '../../../common/services/theme.service';
import { LoggerService } from '../../../common/services/logger.service';
import { UserActivityService } from '../../../common/services/user-activity.service';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss'],
  standalone: false
})
export class DashboardComponent implements OnInit, OnDestroy {
  // Server data
  nestServer: ServerMetrics | null = null;
  goServer: ServerMetrics | null = null;
  
  // Charts data
  cpuChartData: any[] = [];
  memoryChartData: any[] = [];
  requestsChartData: any[] = [];
  userActivityData: any[] = [];
  
  // System status
  systemStatus: 'healthy' | 'degraded' | 'critical' | 'warning' | 'offline' = 'offline';
  statusMessage = 'Loading system status...';
  
  // Time formats
  timeFormat: 'short' | 'relative' = 'relative';
  
  // Theme
  currentTheme = 'light-theme';
  
  // Refresh settings
  autoRefresh = true;
  refreshInterval = 30; // seconds
  lastRefreshTime = new Date();
  
  constructor(
    private apiService: ApiService,
    private themeService: ThemeService,
    private logger: LoggerService,
    private userActivityService: UserActivityService
  ) {}

  ngOnInit(): void {
    this.setupThemeSubscription();
    this.setupDataRefresh();
    this.loadUserActivityData();
    
    this.logger.info('Dashboard initialized');
  }

  ngOnDestroy(): void {
    this.logger.info('Dashboard destroyed');
  }
  
  /**
   * Set up theme subscription
   */
  private setupThemeSubscription(): void {
    this.themeService.currentTheme$.subscribe(theme => {
      this.currentTheme = theme;
    });
  }
  
  /**
   * Set up automatic data refreshing
   */
  private setupDataRefresh(): void {
    // Set up combined server metrics
    const refreshTrigger$ = interval(this.refreshInterval * 1000).pipe(
      startWith(0),
      shareReplay(1)
    );
    
    // Get both server metrics
    const serverMetrics$ = refreshTrigger$.pipe(
      switchMap(() => this.fetchServerMetrics())
    );
    
    // Subscribe to combined metrics
    serverMetrics$.subscribe(([nestServer, goServer]) => {
      this.nestServer = nestServer;
      this.goServer = goServer;
      
      this.updateChartData();
      this.determineSystemStatus();
      this.lastRefreshTime = new Date();
      
      this.logger.debug('Dashboard data refreshed', {
        nestServer: this.nestServer?.status,
        goServer: this.goServer?.status
      });
    });
  }
  
  /**
   * Fetch server metrics from both servers
   */
  private fetchServerMetrics(): Observable<[ServerMetrics, ServerMetrics]> {
    return combineLatest([
      this.apiService.getNestServerMetrics(),
      this.apiService.getGoServerMetrics()
    ]);
  }
  
  /**
   * Load user activity data
   */
  private loadUserActivityData(): void {
    this.userActivityService.getHistoricalUserActivity(7).subscribe(data => {
      this.userActivityData = data;
    });
  }
  
  /**
   * Update chart data based on server metrics
   */
  private updateChartData(): void {
    // Update CPU chart data
    this.cpuChartData = [
      {
        name: 'NestJS',
        value: this.nestServer?.cpuUsage || 0,
        color: '#E91E63'
      },
      {
        name: 'Go',
        value: this.goServer?.cpuUsage || 0,
        color: '#2196F3'
      }
    ];
    
    // Update memory chart data
    this.memoryChartData = [
      {
        name: 'NestJS',
        value: this.nestServer?.memoryUsage || 0,
        color: '#E91E63'
      },
      {
        name: 'Go',
        value: this.goServer?.memoryUsage || 0,
        color: '#2196F3'
      }
    ];
    
    // Update requests chart data
    this.requestsChartData = [
      {
        name: 'NestJS',
        value: this.nestServer?.requestsPerMinute || 0,
        color: '#E91E63'
      },
      {
        name: 'Go',
        value: this.goServer?.requestsPerMinute || 0,
        color: '#2196F3'
      }
    ];
  }
  
  /**
   * Determine overall system status based on server metrics
   */
  private determineSystemStatus(): void {
    // Set default status
    let status: 'healthy' | 'degraded' | 'critical' | 'warning' | 'offline' = 'healthy';
    let message = 'All systems operational';
    
    // Get status of each server
    const nestStatus = this.nestServer?.status || 'offline';
    const goStatus = this.goServer?.status || 'offline';
    
    // Determine worst status
    if (nestStatus === 'offline' || goStatus === 'offline') {
      status = 'offline';
      message = 'One or more systems offline';
    } else if (nestStatus === 'critical' || goStatus === 'critical') {
      status = 'critical';
      message = 'Critical system issues detected';
    } else if (nestStatus === 'degraded' || goStatus === 'degraded') {
      status = 'degraded';
      message = 'Systems experiencing degraded performance';
    } else if (nestStatus === 'warning' || goStatus === 'warning') {
      status = 'warning';
      message = 'Systems experiencing minor issues';
    }
    
    this.systemStatus = status;
    this.statusMessage = message;
  }
  
  /**
   * Format time difference as a human-readable string
   */
  formatTimeAgo(timestamp: number): string {
    if (!timestamp) return 'Unknown';
    
    const now = Date.now();
    const diff = now - timestamp;
    
    if (this.timeFormat === 'relative') {
      // Convert to relative time
      if (diff < 60000) return 'Just now';
      if (diff < 3600000) return `${Math.floor(diff / 60000)} minutes ago`;
      if (diff < 86400000) return `${Math.floor(diff / 3600000)} hours ago`;
      return `${Math.floor(diff / 86400000)} days ago`;
    } else {
      // Convert to time format
      return new Date(timestamp).toLocaleTimeString();
    }
  }
  
  /**
   * Toggle time format between relative and absolute
   */
  toggleTimeFormat(): void {
    this.timeFormat = this.timeFormat === 'relative' ? 'short' : 'relative';
  }
  
  /**
   * Get CSS class for CPU usage
   */
  getCpuClass(usage: number): string {
    if (usage > 80) return 'danger';
    if (usage > 60) return 'warning';
    return 'normal';
  }
  
  /**
   * Get CSS class for memory usage
   */
  getMemoryClass(usage: number): string {
    if (usage > 80) return 'danger';
    if (usage > 60) return 'warning';
    return 'normal';
  }
  
  /**
   * Get CSS class for latency
   */
  getLatencyClass(latency: number): string {
    if (latency > 500) return 'danger';
    if (latency > 200) return 'warning';
    return 'normal';
  }
  
  /**
   * Get CSS class based on server status
   */
  getStatusClass(status: string | undefined): string {
    switch (status) {
      case 'healthy':
      case 'online':
        return 'status-healthy';
      case 'degraded':
      case 'warning':
        return 'status-warning';
      case 'critical':
      case 'offline':
        return 'status-critical';
      default:
        return 'status-unknown';
    }
  }
  
  /**
   * Get icon based on status
   */
  getStatusIcon(status: string | undefined): string {
    switch (status) {
      case 'healthy':
      case 'online':
        return 'check_circle';
      case 'degraded':
      case 'warning':
        return 'warning';
      case 'critical':
      case 'offline':
        return 'error';
      default:
        return 'help';
    }
  }
  
  /**
   * Manually trigger a refresh
   */
  refreshData(): void {
    this.fetchServerMetrics().subscribe(([nestServer, goServer]) => {
      this.nestServer = nestServer;
      this.goServer = goServer;
      
      this.updateChartData();
      this.determineSystemStatus();
      this.lastRefreshTime = new Date();
      
      this.logger.info('Dashboard data manually refreshed');
    });
  }
  
  /**
   * Get the overall system status
   */
  getOverallStatus(): string {
    const nestStatus = this.nestServer?.status || 'offline';
    const goStatus = this.goServer?.status || 'offline';
    
    if (nestStatus === 'critical' || goStatus === 'critical' || 
        nestStatus === 'offline' || goStatus === 'offline') {
      return 'critical';
    } else if (nestStatus === 'degraded' || goStatus === 'degraded') {
      return 'degraded';
    } else if (nestStatus === 'warning' || goStatus === 'warning') {
      return 'warning';
    } else if ((nestStatus === 'healthy' || nestStatus === 'online') && 
               (goStatus === 'healthy' || goStatus === 'online')) {
      return 'healthy';
    } else {
      return 'unknown';
    }
  }

  getMemoryUsageClass(usage: number): string {
    if (usage > 80) return 'critical';
    if (usage > 60) return 'warning';
    return 'normal';
  }
  getNetworkLatencyClass(latency: number): string {
    if (latency > 500) return 'critical';
    if (latency > 200) return 'warning';
    return 'normal';
  }

  getLogosByCategory(category: string): any[] {
    return this.userActivityData.filter(logo => logo.category === category);
  }

}
