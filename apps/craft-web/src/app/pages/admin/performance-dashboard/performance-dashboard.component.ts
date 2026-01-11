import { Component, AfterViewInit, OnDestroy, ViewChild, ElementRef } from '@angular/core';
import { PerformanceHelperService } from './performance-helper.service';
import { ServicesDashboardService } from '../services-dashboard/services-dashboard.service';

@Component({
  selector: 'app-performance-dashboard',
  templateUrl: './performance-dashboard.component.html',
  styleUrls: ['./performance-dashboard.component.scss'],
  standalone: false,
})
export class PerformanceDashboardComponent implements AfterViewInit, OnDestroy {
  @ViewChild('systemCanvas') systemCanvas!: ElementRef<HTMLCanvasElement>;
  private chart: any;

  performanceMetrics = {
    memoryUsage: '0%',
    cpuLoad: '0%',
    appUptime: '0s',
    networkLatency: '0ms',
    adminStatus: 'unknown',
  };

  private intervalId: number | undefined;

  constructor(
    private helper: PerformanceHelperService,
    private servicesDashboard: ServicesDashboardService,
  ) {}

  ngAfterViewInit(): void {
    const ctx = this.systemCanvas.nativeElement.getContext('2d');
    if (!ctx) return;

    const labels = this.servicesDashboard.getRegisteredServices().map(s => s.name);
    const data = labels.map(() => 0);
    const colors = labels.map(s => this.servicesDashboard.getServiceColor(s));

    this.chart = this.helper.createBarChart(ctx, labels, data, colors);

    this.intervalId = window.setInterval(() => {
      this.refreshMetrics();
    }, 5000);
  }

  refreshMetrics() {
    const labels = this.servicesDashboard.getRegisteredServices().map(s => s.name);
    const stats = labels.map(name => this.servicesDashboard.getServiceStatistics(name)?.avgResponseTime || 0);
    const colors = labels.map(s => this.servicesDashboard.getServiceColor(s));
    this.helper.updateChartData(this.chart, labels, stats, colors);

    const mem = Math.round((stats[0] || 0) % 100);
    this.performanceMetrics.memoryUsage = `${mem}%`;
    const cpu = Math.round((stats[1] || 0) % 100);
    this.performanceMetrics.cpuLoad = `${cpu}%`;
    this.performanceMetrics.networkLatency = `${Math.round(stats.reduce((a, b) => a + b, 0) / Math.max(1, stats.length))}ms`;
    this.performanceMetrics.appUptime = `${Math.floor(Date.now() / 1000)}s`;
  }

  ngOnDestroy(): void {
    if (this.intervalId !== undefined) {
      clearInterval(this.intervalId);
    }
    try {
      this.chart?.destroy();
    } catch {}
  }
}
