import { Component, OnInit, OnDestroy, AfterViewInit, ViewChild, ElementRef } from '@angular/core';
import Chart from 'chart.js/auto';
import { Subscription, interval } from 'rxjs';
import { LoggerService } from '../../../common/services/logger.service';

@Component({
  selector: 'app-system-performance',
  templateUrl: './system-performance.component.html',
  styleUrls: ['./system-performance.component.scss'],
  standalone: false,
})
export class SystemPerformanceComponent implements OnInit, OnDestroy, AfterViewInit {
  @ViewChild('systemMetricsCanvas') systemMetricsCanvas!: ElementRef<HTMLCanvasElement>;

  performanceMetrics = {
    memoryUsage: 'N/A',
    cpuLoad: 'N/A',
    appUptime: 'N/A',
    networkLatency: 'N/A',
    adminStatus: 'inactive',
  } as any;

  private systemMetricsChart: Chart | null = null;
  private metricsSubscription!: Subscription;
  private frameRateSamples: number[] = [];
  private lastFrameTime = 0;
  private frameRateRafId: number | null = null;

  constructor(private logger: LoggerService) {}

  ngOnInit(): void {
    this.metricsSubscription = interval(2000).subscribe(() => this.updateSystemMetrics());
    this.lastFrameTime = performance.now();
    this.frameRateRafId = requestAnimationFrame(this.updateFrameRate.bind(this));
    this.logger.debug('SystemPerformance initialized');
  }

  ngAfterViewInit(): void {
    setTimeout(() => this.initializeSystemMetricsChart(), 250);
  }

  ngOnDestroy(): void {
    if (this.metricsSubscription) this.metricsSubscription.unsubscribe();
    if (this.systemMetricsChart) this.systemMetricsChart.destroy();
    if (this.frameRateRafId) cancelAnimationFrame(this.frameRateRafId);
  }

  private updateFrameRate(): void {
    const now = performance.now();
    const delta = now - this.lastFrameTime;
    this.lastFrameTime = now;
    const fps = 1000 / delta;
    this.frameRateSamples.push(fps);
    if (this.frameRateSamples.length > 30) this.frameRateSamples.shift();
    this.frameRateRafId = requestAnimationFrame(this.updateFrameRate.bind(this));
  }

  private updateSystemMetrics(): void {
    this.performanceMetrics.memoryUsage = `${(Math.random() * 50 + 20).toFixed(2)}%`;
    this.performanceMetrics.memoryUsage = `${(Math.random() * 50 + 20).toFixed(2)}%`;
    this.performanceMetrics.cpuLoad = `${(Math.random() * 60 + 10).toFixed(2)}%`;
    this.performanceMetrics.networkLatency = `${(Math.random() * 120 + 10).toFixed(2)} ms`;
    const now = performance.now();
    const uptimeSec = Math.floor((now - (window as any).__appStartTime || now) / 1000);
    this.performanceMetrics.appUptime = `${uptimeSec}s`;
    this.refreshChart();
  }

  private initializeSystemMetricsChart(): void {
    const el = this.systemMetricsCanvas?.nativeElement;
    if (!el) return;
    const ctx = el.getContext('2d');
    if (!ctx) return;

    this.systemMetricsChart = new Chart(ctx, {
      type: 'line',
      data: {
        labels: [],
        datasets: [
          { label: 'Memory', data: [], borderColor: '#3b82f6', fill: false },
          { label: 'CPU', data: [], borderColor: '#10b981', fill: false },
          { label: 'Network', data: [], borderColor: '#ef4444', fill: false },
        ],
      },
      options: { responsive: true, maintainAspectRatio: false },
    });
  }

  private refreshChart(): void {
    if (!this.systemMetricsChart) return;
    const now = new Date().toLocaleTimeString();
    const mem = parseFloat(String(this.performanceMetrics.memoryUsage)) || 0;
    const cpu = parseFloat(String(this.performanceMetrics.cpuLoad)) || 0;
    const net = parseFloat(String(this.performanceMetrics.networkLatency)) || 0;
    const data = this.systemMetricsChart.data as any;
    data.labels = data.labels || [];
    data.datasets = data.datasets || [];
    (data.labels as any[]).push(now);
    (data.datasets[0].data as any[]).push(mem);
    (data.datasets[1].data as any[]).push(cpu);
    (data.datasets[2].data as any[]).push(net);
    const maxPoints = 30;
    if ((data.labels as any[]).length > maxPoints) {
      (data.labels as any[]).shift();
      (data.datasets as any[]).forEach((ds: any) => ds.data.shift());
    }
    this.systemMetricsChart.update();
  }
}
