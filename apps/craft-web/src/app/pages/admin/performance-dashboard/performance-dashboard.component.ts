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
  private latestMetrics: ServiceCallMetric[] = [];
  private readonly startedAt = Date.now();

  performanceMetrics = {
    memoryUsage: '0%',
    cpuLoad: '0%',
    appUptime: '0s',
    networkLatency: '0ms',
    adminStatus: 'unknown',
  };

  constructor(
    private helper: PerformanceHelperService,
    private servicesDashboard: ServicesDashboardService,
    private metricsBridge: PerformanceMetricsBridgeService,
  ) {}

  ngAfterViewInit(): void {
    const ctx = this.systemCanvas.nativeElement.getContext('2d');
    if (!ctx) return;

    const labels = this.servicesDashboard.getRegisteredServices().map(s => s.name);
    const data = labels.map(() => 0);
    const colors = labels.map(s => this.servicesDashboard.getServiceColor(s));

    this.chart = this.helper.createBarChart(ctx, labels, data, colors);
    this.metricsBridge.startMonitoring();
    this.metricsSubscription = this.metricsBridge.metrics$.subscribe(metrics => {
      this.latestMetrics = metrics;
      this.scheduleChartRefresh();
    });
  }

  ngOnDestroy(): void {
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

    const labels = this.servicesDashboard.getRegisteredServices().map(s => s.name);
    const stats = labels.map(name => this.servicesDashboard.getServiceStatistics(name)?.avgResponseTime || 0);
    const colors = labels.map(s => this.servicesDashboard.getServiceColor(s));
    this.helper.updateChartData(this.chart, labels, stats, colors);

    this.updatePerformanceMetrics(stats, this.latestMetrics);
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
}
