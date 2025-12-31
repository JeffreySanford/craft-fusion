import { Injectable } from '@angular/core';
import { ServiceCallMetric, LoggerService } from '../../../common/services/logger.service';
import Chart from 'chart.js/auto';
import { BehaviorSubject, Subscription } from 'rxjs';
import { ApiEndpointLog } from '../admin-types';

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
  private serviceStatistics: { [key: string]: ServiceMetricsSummary } = {};
  private endpointLogs: { [key: string]: ApiEndpointLog } = {};
  private serviceIconMap: { [key: string]: string } = {
    ApiService: 'cloud',
    AuthenticationService: 'lock',
    UserStateService: 'person',
    SessionService: 'timer',
    BusyService: 'hourglass_top',
    NotificationService: 'notifications',
    LoggerService: 'list',
    ChatService: 'chat',
    SettingsService: 'settings',
    AdminStateService: 'admin_panel_settings',
  };
  private loggerSubscription: Subscription | undefined;

  private metricsSubject = new BehaviorSubject<ServiceCallMetric[]>([]);
  public metrics$ = this.metricsSubject.asObservable();
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

  private serviceColors: { [key: string]: string } = {
    ApiService: '#FF6B6B',
    AuthenticationService: '#4ECDC4',
    UserStateService: '#45B7D1',
    SessionService: '#96CEB4',
    BusyService: '#FFEEAD',
    NotificationService: '#D4A5A5',
    LoggerService: '#9B59B6',
    ChatService: '#3498DB',
    SettingsService: '#FF9F4A',
    AdminStateService: '#2ECC71',
  };

  constructor(private logger: LoggerService) {}

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
    this.emitFlattenedMetrics();
  }

  private emitFlattenedMetrics() {
    const all: ServiceCallMetric[] = [];
    Array.from(this.metricsByService.values()).forEach(arr => all.push(...arr));
    all.sort((a, b) => (a.timestamp as any).getTime() - (b.timestamp as any).getTime());
    this.metricsSubject.next(all.slice(-200));
  }

  getEndpointLogs() {
    return this.endpointLogs;
  }

  getServiceIcon(serviceName: string) {
    return this.serviceIconMap[serviceName] || 'device_hub';
  }

  startMonitoring() {
    this.stopMonitoring();
    this.loggerSubscription = this.logger.serviceCalls$.subscribe((metrics: ServiceCallMetric[]) => {
      if (!metrics || metrics.length === 0) {
        return;
      }
      this.setServiceMetrics(metrics);

      metrics.forEach(metric => {
        if (!this.endpointLogs[metric.serviceName]) {
          this.endpointLogs[metric.serviceName] = {
            path: metric.url,
            method: metric.method,
            lastContacted: null,
            lastPing: null,
            status: 'active',
            hitCount: 0,
            successCount: 0,
            errorCount: 0,
            avgResponseTime: 0,
            firstSeen: new Date(),
            timelineData: [],
          };
        }

        const info = this.endpointLogs[metric.serviceName]!;
        info.lastContacted = new Date(metric.timestamp);
        info.lastPing = new Date();
        info.hitCount++;

        const st = metric.status ?? 0;
        if (st >= 200 && st < 400) info.successCount++;
        else if (st >= 400) info.errorCount++;
        if (st >= 500) info.status = 'error';
        else if (st === 0) info.status = 'inactive';
        else info.status = 'active';

        info.avgResponseTime = (info.avgResponseTime * (info.hitCount - 1) + (metric.duration || 0)) / info.hitCount;
        info.timelineData.push({ timestamp: new Date(metric.timestamp), responseTime: metric.duration || 0, status: st });
        if (info.timelineData.length > 50) info.timelineData = info.timelineData.slice(-50);
      });

      // update lite stats for UI
      this.updateLiteStats();
    });
  }

  stopMonitoring() {
    if (this.loggerSubscription) {
      this.loggerSubscription.unsubscribe();
      this.loggerSubscription = undefined;
    }
  }

  getLatestServiceMetrics(limit = 50): ServiceCallMetric[] {
    const all = this.metricsSubject.getValue();
    return all.slice(-limit).reverse();
  }

  updateLiteStats(limitServices = 5, lookbackMs = 30000) {
    const now = Date.now();
    const active = this.getRegisteredServices()
      .filter(s => s.active)
      .slice(0, limitServices);
    active.forEach(service => {
      const arr = (this.metricsByService.get(service.name) || []).filter(m => now - (m.timestamp as any).getTime() < lookbackMs).slice(-10);
      if (arr.length > 0) {
        const avgTime = arr.reduce((sum, m) => sum + (m.duration || 0), 0) / arr.length;
        const successCount = arr.filter(m => (m.status ?? 0) < 400).length;
        const successRate = arr.length ? (successCount / arr.length) * 100 : 100;
        this.updateServiceStats(service.name, { avgResponseTime: avgTime, callCount: arr.length, successRate, lastUpdate: now });
      } else {
        // simulation fallback handled elsewhere
      }
    });
    this.emitFlattenedMetrics();
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
    return this.serviceStatistics[serviceName];
  }

  /** Clear all collected metrics and endpoint logs, and notify subscribers */
  clearAllMetrics() {
    this.metricsByService.clear();
    this.serviceMetricsMap.clear();
    this.serviceStatistics = {};
    this.endpointLogs = {};
    // Ask logger to clear its stored metrics as well when available
    try {
      // logger may expose clearMetrics
      // @ts-ignore
      if (this.logger && typeof (this.logger as any).clearMetrics === 'function') {
        // Clear logger internal metrics
        (this.logger as any).clearMetrics();
      }
    } catch (e) {
      console.warn('Failed to clear logger metrics', e);
    }
    // Emit empty metrics to subscribers
    this.metricsSubject.next([]);
  }

  /** Delegate clearing of application logs to LoggerService */
  clearLogs() {
    try {
      // @ts-ignore
      if (this.logger && typeof (this.logger as any).clearLogs === 'function') {
        // Clear logger stored logs
        (this.logger as any).clearLogs();
      }
    } catch (e) {
      console.warn('Failed to clear logs via LoggerService', e);
    }
  }

  updateServiceStats(serviceName: string, stats: Partial<ServiceMetricsSummary> & { lastUpdate?: number }) {
    const prev = this.serviceStatistics[serviceName] || ({} as ServiceMetricsSummary);
    this.serviceStatistics[serviceName] = {
      avgResponseTime: stats.avgResponseTime ?? prev.avgResponseTime ?? 0,
      callCount: stats.callCount ?? prev.callCount ?? 0,
      successRate: stats.successRate ?? prev.successRate ?? 100,
      lastUpdate: stats.lastUpdate ?? Date.now(),
    };
  }

  getServiceColor(serviceName: string): string {
    return this.serviceColors[serviceName] || '#808080';
  }

  /** Toggle active flag for a registered service by name */
  toggleServiceActive(serviceName: string): void {
    const svc = this.DEFAULT_SERVICES.find(s => s.name === serviceName);
    if (svc) {
      svc.active = !svc.active;
    }
  }

  /**
   * Return axis configurations and dataset axis mapping for a given set of metrics.
   * The component applies the returned axis objects onto the chart options and assigns
   * dataset yAxisIDs using the datasetAxisIds array.
   */
  getAxesConfig(metrics: string[]): { y: any; y1: any; datasetAxisIds: string[] } {
    // defaults
    const y = { display: false, title: { text: '', color: '#e5e7eb' }, ticks: { color: '#e5e7eb' } };
    const y1 = { display: false, title: { text: '', color: '#e5e7eb' }, ticks: { color: '#e5e7eb' } };
    const datasetAxisIds: string[] = [];

    if (!metrics || metrics.length === 0) {
      y.display = true;
      y.title.text = 'No metrics selected';
      return { y, y1, datasetAxisIds };
    }

    if (metrics.length === 1) {
      const metric = metrics[0];
      const color = metric === 'memory' ? '#3b82f6' : metric === 'cpu' ? '#10b981' : '#ef4444';
      y.display = true;
      y.title.text = metric === 'network' ? 'Physical Response Time (ms)' : metric === 'memory' ? 'Memory Usage (%)' : 'CPU Load (%)';
      y.title.color = color;
      y.ticks.color = color;
      // all datasets map to 'y'
      datasetAxisIds.push('y', 'y', 'y');
      return { y, y1, datasetAxisIds };
    }

    if (metrics.length === 2) {
      const hasMemory = metrics.includes('memory');
      const hasCpu = metrics.includes('cpu');
      const hasNetwork = metrics.includes('network');
      y.display = true;
      y1.display = true;
      if (hasMemory && hasCpu) {
        y.title.text = 'CPU Load (%)';
        y1.title.text = 'Memory Usage (%)';
        y.title.color = '#10b981';
        y1.title.color = '#3b82f6';
        datasetAxisIds.push('y1', 'y', 'y1');
      } else if (hasMemory && hasNetwork) {
        y.title.text = 'Memory Usage (%)';
        y1.title.text = 'Physical Response Time (ms)';
        y.title.color = '#3b82f6';
        y1.title.color = '#ef4444';
        datasetAxisIds.push('y', 'y', 'y1');
      } else if (hasCpu && hasNetwork) {
        y.title.text = 'CPU Load (%)';
        y1.title.text = 'Physical Response Time (ms)';
        y.title.color = '#10b981';
        y1.title.color = '#ef4444';
        datasetAxisIds.push('y', 'y', 'y1');
      }
      return { y, y1, datasetAxisIds };
    }

    // 3 metrics
    y.display = true;
    y1.display = true;
    y.title.text = 'CPU & Memory Usage (%)';
    y1.title.text = 'Response Time (ms)';
    y.title.color = '#ffffff';
    y.ticks = { color: '#e5e7eb' };
    y1.title.color = '#ef4444';
    y1.ticks = { color: '#ef4444' };
    datasetAxisIds.push('y', 'y', 'y1');
    return { y, y1, datasetAxisIds };
  }

  buildChartDataForServices(limit = 6) {
    const active = this.getRegisteredServices().slice(0, limit);
    const stats = this.serviceStatistics;
    return {
      labels: active.map(s => s.name),
      datasets: [
        {
          label: 'Response Time (ms)',
          data: active.map(s => stats[s.name]?.avgResponseTime || 0),
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

  // Toggle metric in a centralized place. Returns updated metrics array (mutating caller is fine too).
  toggleMetric(selectedMetrics: string[], metric: string): string[] {
    const idx = selectedMetrics.indexOf(metric);
    if (idx > -1 && selectedMetrics.length > 1) {
      selectedMetrics.splice(idx, 1);
    } else if (idx === -1) {
      selectedMetrics.push(metric);
    }
    return selectedMetrics;
  }

  // Apply axes/dataset mapping to an existing Chart instance based on selected metrics
  applyAxesToChart(systemChart: any, selectedMetrics: string[]): void {
    if (!systemChart) return;
    const axes = this.getAxesConfig(selectedMetrics);
    (systemChart.options.scales as any)['y'] = axes.y;
    (systemChart.options.scales as any)['y1'] = axes.y1;

    const mapping = axes.datasetAxisIds || [];
    (systemChart.data.datasets as any[]).forEach((dataset: any, index: number) => {
      // determine hidden/visible based on mapping and selected metrics
      const metricForIndex = selectedMetrics[index] || '';
      dataset.hidden = !(mapping.length === 0 || mapping[index] ? selectedMetrics.includes(metricForIndex) : true);
      if (mapping && mapping[index]) {
        dataset.yAxisID = mapping[index];
      }
    });

    try {
      systemChart.update();
    } catch (e) {
      // swallow chart update errors in service
    }
  }
}
