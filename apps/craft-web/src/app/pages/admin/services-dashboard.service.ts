import { Injectable } from '@angular/core';
import { ServiceCallMetric } from '../../common/services/logger.service';
import Chart from 'chart.js/auto';

export interface ServiceMetricsSummary {
  avgResponseTime: number;
  callCount: number;
  successRate: number;
  lastUpdate?: number;
}

@Injectable({ providedIn: 'root' })
export class ServicesDashboardService {
  private serviceMetricsMap = new Map<string, any>();
  private metricsByService = new Map<string, ServiceCallMetric[]>();
  private serviceStatistics = new Map<string, ServiceMetricsSummary>();
  private pollingIntervalId: number | undefined;
  private simulationIntervalId: number | undefined;

  private readonly DEFAULT_SERVICES = [
    { name: 'ApiService', description: 'Core API communication', active: true },
    { name: 'AuthenticationService', description: 'User authentication', active: true },
    { name: 'UserStateService', description: 'User state management', active: true },
    { name: 'SessionService', description: 'Session management', active: true },
    { name: 'BusyService', description: 'Loading state management', active: false },
    { name: 'NotificationService', description: 'User notifications', active: true },
    { name: 'LoggerService', description: 'Application logging', active: true },
    { name: 'ChatService', description: 'Chat functionality', active: false },
    { name: 'SettingsService', description: 'Application settings', active: true },
    { name: 'AdminStateService', description: 'Admin state management', active: true },
  ];

  private serviceColors = new Map<string, string>([
    ['ApiService', '#FF6B6B'],
    ['AuthenticationService', '#4ECDC4'],
    ['UserStateService', '#45B7D1'],
    ['SessionService', '#96CEB4'],
    ['BusyService', '#FFEEAD'],
    ['NotificationService', '#D4A5A5'],
    ['LoggerService', '#9B59B6'],
    ['ChatService', '#3498DB'],
    ['SettingsService', '#FF9F4A'],
    ['AdminStateService', '#2ECC71'],
  ]);

  constructor() {}

  getRegisteredServices() {
    return this.DEFAULT_SERVICES;
  }

  setServiceMetrics(metrics: ServiceCallMetric[]) {

    metrics.forEach(m => {
      const arr = this.metricsByService.get(m.serviceName) || [];
      arr.push(m);

      this.metricsByService.set(m.serviceName, arr.slice(-200));

      this.serviceMetricsMap.set(m.serviceName, m);
    });
  }

  startStatisticsPolling(intervalMs = 15000) {
    this.stopStatisticsPolling();
    this.pollingIntervalId = window.setInterval(() => {
      try {
        const now = Date.now();
        const active = this.getRegisteredServices();
        active.forEach(s => {
          const metrics = (this.metricsByService.get(s.name) || []).slice(-50);
          if (metrics.length > 0) {
            const avgTime = metrics.reduce((sum, m) => sum + (m.duration || 0), 0) / metrics.length;
            const successCount = metrics.filter(m => (m.status ?? 0) >= 200 && (m.status ?? 0) < 400).length;
            const successRate = metrics.length ? (successCount / metrics.length) * 100 : 100;
            this.updateServiceStats(s.name, { avgResponseTime: avgTime, callCount: metrics.length, successRate, lastUpdate: now });
          }
        });
      } catch (e) {

        console.error('ServicesDashboardService polling error', e);
      }
    }, intervalMs);
  }

  stopStatisticsPolling() {
    if (this.pollingIntervalId !== undefined) {
      clearInterval(this.pollingIntervalId);
      this.pollingIntervalId = undefined;
    }
  }

  startSimulation() {
    this.stopSimulation();
    this.simulationIntervalId = window.setInterval(
      () => {

        this.getRegisteredServices().forEach(s => {
          const avg = Math.random() * 200 + 20;
          const calls = Math.floor(Math.random() * 50);
          const success = 75 + Math.random() * 25;
          this.updateServiceStats(s.name, { avgResponseTime: avg, callCount: calls, successRate: success, lastUpdate: Date.now() });
        });
      },
      8000 + Math.random() * 4000,
    );
  }

  stopSimulation() {
    if (this.simulationIntervalId !== undefined) {
      clearInterval(this.simulationIntervalId);
      this.simulationIntervalId = undefined;
    }
  }

  getServiceStatistics(serviceName: string) {
    return this.serviceStatistics.get(serviceName);
  }

  updateServiceStats(serviceName: string, stats: Partial<ServiceMetricsSummary> & { lastUpdate?: number }) {
    const prev = this.serviceStatistics.get(serviceName) || ({} as ServiceMetricsSummary);
    this.serviceStatistics.set(serviceName, {
      avgResponseTime: stats.avgResponseTime ?? prev.avgResponseTime ?? 0,
      callCount: stats.callCount ?? prev.callCount ?? 0,
      successRate: stats.successRate ?? prev.successRate ?? 100,
      lastUpdate: stats.lastUpdate ?? Date.now(),
    });
  }

  getServiceColor(serviceName: string): string {
    return this.serviceColors.get(serviceName) || '#808080';
  }

  buildChartDataForServices(limit = 6) {
    const active = this.getRegisteredServices().slice(0, limit);
    const stats = this.serviceStatistics;
    return {
      labels: active.map(s => s.name),
      datasets: [
        {
          label: 'Response Time (ms)',
          data: active.map(s => stats.get(s.name)?.avgResponseTime || 0),
          backgroundColor: active.map(s => this.getServiceColor(s.name)),
          borderWidth: 1,
          yAxisID: 'y',
        },
      ],
    } as any;
  }

  createServiceMetricsChart(ctx: CanvasRenderingContext2D) {
    const chartData = this.buildChartDataForServices();
    return new Chart(ctx, {
      type: 'bar',
      data: chartData,
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          x: { grid: { display: false } },
          y: { beginAtZero: true, title: { display: true, text: 'Avg Response Time (ms)' } },
        },
        plugins: {
          legend: { display: false },
        },
      },
    });
  }
}
