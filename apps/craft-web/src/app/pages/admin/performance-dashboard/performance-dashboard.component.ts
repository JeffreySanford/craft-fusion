import { Component, AfterViewInit, OnDestroy, ViewChild, ElementRef } from '@angular/core';
import { Subscription } from 'rxjs';
import { PerformanceHelperService } from './performance-helper.service';
import { ServicesDashboardService } from '../services-dashboard/services-dashboard.service';
import { PerformanceMetricsBridgeService } from './performance-metrics-bridge.service';
import { ServiceCallMetric } from '../../../common/services/logger.service';

@Component({
  selector: 'app-performance-dashboard',
  templateUrl: './performance-dashboard.component.html',
  styleUrls: ['./performance-dashboard.component.scss'],
  standalone: false,
})
export class PerformanceDashboardComponent implements AfterViewInit, OnDestroy {
  @ViewChild('systemCanvas') systemCanvas!: ElementRef<HTMLCanvasElement>;
  private chart: any;
  private metricsSubscription?: Subscription;
  private animationFrameId: number | undefined;
  private pollingIntervalId: number | undefined;
  private latestMetrics: ServiceCallMetric[] = [];
  private readonly startedAt = Date.now();
  private readonly POLLING_INTERVAL_MS = 1000; // Poll every 1 second

  performanceMetrics = {
    memoryUsage: '0%',
    cpuLoad: '0%',
    appUptime: '0s',
    networkLatency: '0ms',
    adminStatus: 'unknown',
  };

  servicesData: Array<{
    name: string;
    description: string;
    icon: string;
    active: boolean;
    avgResponseTime: number;
    callCount: number;
    successRate: number;
    updating?: boolean;
  }> = [];

  get activeServicesCount(): number {
    return this.servicesData.filter(s => s.active).length;
  }

  get totalServicesCount(): number {
    return this.servicesData.length;
  }

  trackByServiceName(index: number, service: { name: string }): string {
    return service.name;
  }

  constructor(
    private helper: PerformanceHelperService,
    private servicesDashboard: ServicesDashboardService,
    private metricsBridge: PerformanceMetricsBridgeService,
  ) {}

  ngAfterViewInit(): void {
    const ctx = this.systemCanvas.nativeElement.getContext('2d');
    if (!ctx) return;

    const services = this.servicesDashboard.getRegisteredServices();
    const labels = services.map(s => s.name);
    const data = services.map(() => 0);
    const colors = services.map(s => this.servicesDashboard.getServiceColor(s.name));

    this.chart = this.helper.createBarChart(ctx, labels, data, colors);
    this.initializeServicesData();
    this.metricsBridge.startMonitoring();
    this.metricsSubscription = this.metricsBridge.metrics$.subscribe(metrics => {
      this.latestMetrics = metrics;
      this.scheduleChartRefresh();
    });
    this.startPolling();
  }

  ngOnDestroy(): void {
    this.stopPolling();
    if (this.animationFrameId !== undefined) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = undefined;
    }
    this.metricsSubscription?.unsubscribe();
    this.metricsBridge.stopMonitoring();
    try {
      this.chart?.destroy();
    } catch {}
  }

  private scheduleChartRefresh(): void {
    if (this.animationFrameId !== undefined) {
      return;
    }
    this.animationFrameId = window.requestAnimationFrame(() => {
      this.renderLatestMetrics();
      this.animationFrameId = undefined;
    });
  }

  private renderLatestMetrics(): void {
    if (!this.chart) {
      return;
    }

    const services = this.servicesDashboard.getRegisteredServices();
    const labels = services.map(s => s.name);
    const stats = labels.map(name => {
      const serviceStats = this.servicesDashboard.getServiceStatistics(name);
      return serviceStats?.avgResponseTime || 0;
    });
    const colors = labels.map(name => this.servicesDashboard.getServiceColor(name));
    this.helper.updateChartData(this.chart, labels, stats, colors);

    this.updatePerformanceMetrics(stats, this.latestMetrics);
    this.updateServicesData();
  }

  private updatePerformanceMetrics(stats: number[], metrics: ServiceCallMetric[]): void {
    const average = stats.length ? stats.reduce((sum, value) => sum + value, 0) / stats.length : 0;
    this.performanceMetrics.memoryUsage = `${Math.min(100, Math.round(average))}%`;
    this.performanceMetrics.cpuLoad = `${Math.min(100, Math.round(average * 0.9))}%`;
    const latency = metrics.length
      ? Math.round(metrics.reduce((sum, metric) => sum + (metric.duration || 0), 0) / metrics.length)
      : 0;
    this.performanceMetrics.networkLatency = `${latency}ms`;
    const uptimeSeconds = Math.max(0, Math.floor((Date.now() - this.startedAt) / 1000));
    this.performanceMetrics.appUptime = this.formatDuration(uptimeSeconds);
    this.performanceMetrics.adminStatus = metrics.some(metric => (metric.status ?? 0) >= 400) ? 'attention' : 'stable';
  }

  private formatDuration(totalSeconds: number): string {
    const days = Math.floor(totalSeconds / 86400);
    const hours = Math.floor((totalSeconds % 86400) / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    const parts: string[] = [];
    if (days) parts.push(`${days}d`);
    if (hours) parts.push(`${hours}h`);
    if (minutes) parts.push(`${minutes}m`);
    parts.push(`${seconds}s`);
    return parts.join(' ');
  }

  private startPolling(): void {
    // Clear any existing interval
    this.stopPolling();
    
    // Start polling every second to update metrics
    this.pollingIntervalId = window.setInterval(() => {
      this.scheduleChartRefresh();
    }, this.POLLING_INTERVAL_MS);
  }

  private stopPolling(): void {
    if (this.pollingIntervalId !== undefined) {
      clearInterval(this.pollingIntervalId);
      this.pollingIntervalId = undefined;
    }
  }

  private initializeServicesData(): void {
    const services = this.servicesDashboard.getRegisteredServices();
    this.servicesData = services.map(service => ({
      name: service.name,
      description: service.description,
      icon: this.servicesDashboard.getServiceIcon(service.name),
      active: service.active,
      avgResponseTime: 0,
      callCount: 0,
      successRate: 100
    }));
  }

  private updateServicesData(): void {
    this.servicesData = this.servicesData.map(service => {
      const stats = this.servicesDashboard.getServiceStatistics(service.name);
      if (stats) {
        const updated = {
          ...service,
          avgResponseTime: Math.round(stats.avgResponseTime),
          callCount: stats.callCount,
          successRate: Math.round(stats.successRate),
          updating: false
        };
        // Trigger glow if any metric changed
        if (updated.avgResponseTime !== service.avgResponseTime || 
            updated.callCount !== service.callCount || 
            updated.successRate !== service.successRate) {
          updated.updating = true;
          setTimeout(() => {
            const idx = this.servicesData.findIndex(s => s.name === service.name);
            if (idx !== -1 && this.servicesData[idx]) {
              this.servicesData[idx].updating = false;
            }
          }, 300);
        }
        return updated;
      }
      return service;
    });
  }
}
