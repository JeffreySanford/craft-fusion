import { Component, OnInit, OnDestroy, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, Subscription, interval, of } from 'rxjs';
import Chart from 'chart.js/auto';
import { LoggerService, ServiceCallMetric } from '../../common/services/logger.service';
import { ThemeService } from '../../services/theme.service';
import { DataSimulationService } from '../../common/services/data-simulation.service';
import { FooterStateService } from '../../common/services/footer-state.service';
import { ServiceMetricsBridgeService } from '../admin/services-dashboard/service-metrics-bridge.service';

@Component({
  selector: 'app-footer',
  templateUrl: './footer.component.html',
  styleUrls: ['./footer.component.scss'],
  standalone: false,
})
export class FooterComponent implements OnInit, OnDestroy, AfterViewInit {
  @ViewChild('performanceChart') performanceChartRef!: ElementRef<HTMLCanvasElement>;
  performanceMetrics = {
    memoryUsage: 'N/A',
    cpuLoad: 'N/A',
    appUptime: 'N/A',
    networkLatency: 'N/A',
  };
  private performanceSubscription!: Subscription;
  private appStartTime: number;
  private chart: Chart | null = null;
  private chartInitialized = false;
  private metricsBuffer: Array<{ time: string; memory: number; cpu: number; latency: number }> = [];
  isSimulatingData = false;                                     
  chartBorderColor = 'green';                                  
  frameRateSamples: number[] = [];
  lastFrameTime = 0;
  frameRateUpdateInterval: number | null = null;
  isAdmin = false;
  expanded = false;
  currentTheme: string | null = null;
  private themeSub?: Subscription;

  logoLinks = [
    { src: 'assets/images/compressed/nodejs-new-pantone-white.png', alt: 'Node.js' },
    { src: 'assets/images/mongo.svg', alt: 'MongoDB' },                                     
    { src: 'assets/images/compressed/angular.png', alt: 'Angular' },
    { src: 'assets/images/compressed/us-army-logo.png', alt: 'United States Army (DOD)', class: 'army' },
    { src: 'assets/images/compressed/US-GOVT-DLA.png', alt: 'Defense Logistics Agency', class: 'DLA' },
    { src: 'assets/images/compressed/US-GOVT-DVA-Seal.png', alt: 'Department of Veterans Affairs', class: 'DVA' },
    { src: 'assets/images/compressed/US-GOVT-DTIC.png', alt: 'Defense Technical Information Center', class: 'DTIC' },
  ];

  registeredServices = [
    { name: 'ApiService', description: 'Core API communication' },
    { name: 'AuthenticationService', description: 'User authentication' },
    { name: 'UserStateService', description: 'User state management' },
    { name: 'SessionService', description: 'Session management' },
    { name: 'BusyService', description: 'Loading state management' },
    { name: 'NotificationService', description: 'User notifications' },
    { name: 'LoggerService', description: 'Application logging' },
    { name: 'SettingsService', description: 'Application settings' },
  ];

  serviceMetrics: ServiceCallMetric[] = [];
  metricUpdateSubscription?: Subscription;
  serviceIconMap: { [key: string]: string } = {
    api: 'api',
    auth: 'security',
    'user-state': 'person',
    session: 'watch_later',
    busy: 'hourglass_empty',
    notification: 'notifications',
    logger: 'receipt_long',
    settings: 'settings',
  };

  private networkConnectionFailed = false;
  private consecutiveFailures = 0;
  private normalPingInterval = 10000;                                
  private currentPingInterval = 10000;                                
  private maxConsecutiveFailures = 3;                                      

  constructor(
    private router: Router,
    private logger: LoggerService,
    private dataSimulationService: DataSimulationService,
    private footerStateService: FooterStateService,
    private themeService: ThemeService,
    private metricsBridge: ServiceMetricsBridgeService,
  ) {
    this.appStartTime = performance.now();
    this.logger.info('Footer component initialized');
  }

  ngOnInit() {
    this.startPerformanceMonitoring();
    this.collectNavigatorInfo();
    this.startFrameRateMonitoring();
    this.metricUpdateSubscription = this.metricsBridge.metrics$.subscribe(metrics => {
      this.serviceMetrics = metrics.slice(-20);
      this.updateServiceMetricsChart();
    });

    this.dataSimulationService.isSimulating$.subscribe(isSim => {
      this.isSimulatingData = isSim;
      this.updateChartBorderColor();
    });

    this.themeSub = this.themeService.currentTheme$.subscribe(t => {
      this.currentTheme = t;
    });

    this.logger.info('Footer component initialized', {}, 'FooterComponent');
  }

  cycleTheme(): void {
    this.themeService.cycleTheme();
  }

  ngAfterViewInit() {

    setTimeout(() => {
      this.initializeChart();
    }, 500);

    interval(500).subscribe(() => {
      this.updateChartData();
    });

    this.logger.info('Footer chart initialized');
  }

  ngOnDestroy() {
    this.stopPerformanceMonitoring();
    this.stopFrameRateMonitoring();
    if (this.metricUpdateSubscription) {
      this.metricUpdateSubscription.unsubscribe();
    }
    if (this.chart) {
      this.chart.destroy();
    }

    this.logger.info('Footer component destroyed');
  }

  private lastUsedPingInterval: number = 3000;                                

  private startPerformanceMonitoring() {
    this.logger.info('Starting performance monitoring');

    const performanceInterval = interval(this.currentPingInterval);
    this.lastUsedPingInterval = this.currentPingInterval;

    this.performanceSubscription = performanceInterval.subscribe(() => {
      this.updatePerformanceMetrics();

      if (this.performanceSubscription && this.currentPingInterval !== this.lastUsedPingInterval) {

        this.performanceSubscription.unsubscribe();

        const newInterval = interval(this.currentPingInterval);
        this.lastUsedPingInterval = this.currentPingInterval;
        this.performanceSubscription = newInterval.subscribe(() => {
          this.updatePerformanceMetrics();
        });

        this.logger.debug(`Updated performance monitoring interval to ${this.currentPingInterval}ms`);
      }
    });
  }

  private stopPerformanceMonitoring() {
    this.logger.info('Stopping performance monitoring');
    if (this.performanceSubscription) {
      this.performanceSubscription.unsubscribe();
    }
  }

  private updatePerformanceMetrics() {
    const perfAny = performance as any;
    if (perfAny && perfAny.memory) {
      const memory = perfAny.memory;
      const totalJSHeapSize = memory.totalJSHeapSize;
      const usedJSHeapSize = memory.usedJSHeapSize;
      const memoryUsagePercentage = (usedJSHeapSize / totalJSHeapSize) * 100;
      this.performanceMetrics.memoryUsage = `${memoryUsagePercentage.toFixed(2)}%`;
    } else {
      this.performanceMetrics.memoryUsage = 'N/A';
    }

    this.getCPUload().subscribe(
      cpuLoad => {
        if (cpuLoad !== undefined && !isNaN(cpuLoad)) {
          this.performanceMetrics.cpuLoad = `${cpuLoad.toFixed(2)}%`;
        } else {
          this.performanceMetrics.cpuLoad = 'N/A';
        }
        this.updateChart();
      },
      () => {
        this.performanceMetrics.cpuLoad = 'N/A';
        this.updateChart();
      },
    );

    const currentTime = performance.now();
    const uptimeMs = currentTime - this.appStartTime;
    const uptimeSec = uptimeMs / 1000;
    const uptimeMin = uptimeSec / 60;
    const uptimeHours = uptimeMin / 60;
    const uptimeDays = uptimeHours / 24;

    if (uptimeDays >= 1) {
      this.performanceMetrics.appUptime = `${uptimeDays.toFixed(2)} days`;
    } else if (uptimeHours >= 1) {
      this.performanceMetrics.appUptime = `${uptimeHours.toFixed(2)} hours`;
    } else if (uptimeMin >= 1) {
      this.performanceMetrics.appUptime = `${uptimeMin.toFixed(2)} minutes`;
    } else {
      this.performanceMetrics.appUptime = `${uptimeSec.toFixed(2)} seconds`;
    }

    this.measureNetworkLatency();

    this.updateChartBorderColor();
  }

  private measureNetworkLatency() {

    if (this.consecutiveFailures >= this.maxConsecutiveFailures) {
      this.performanceMetrics.networkLatency = 'N/A';
      return;
    }

    const startTime = performance.now();
    const pingUrl = `/api/health?cache=${Date.now()}`;

    fetch(pingUrl, {
      method: 'HEAD',
      cache: 'no-store',
      headers: { pragma: 'no-cache' },
      signal: AbortSignal.timeout(3000),                    
    })
      .then(() => {
        const latency = performance.now() - startTime;
        this.performanceMetrics.networkLatency = `${latency.toFixed(2)} ms`;
        if (this.networkConnectionFailed) {
          this.logger.info('Network connection restored after previous failures');
        }
        this.networkConnectionFailed = false;
        this.consecutiveFailures = 0;
        this.currentPingInterval = this.normalPingInterval;
        this.updateChart();
      })
      .catch(() => {

        const assetStart = performance.now();
        fetch(`/assets/ping.txt?cache=${Date.now()}`, { method: 'HEAD', cache: 'no-store', signal: AbortSignal.timeout(2000) })
          .then(() => {
            const latency = performance.now() - assetStart;
            this.performanceMetrics.networkLatency = `${latency.toFixed(2)} ms (static)`;
            if (this.networkConnectionFailed) {
              this.logger.info('Frontend asset reachable, but backend health check failed');
            }
            this.networkConnectionFailed = false;
            this.consecutiveFailures = 0;
            this.currentPingInterval = this.normalPingInterval;
            this.updateChart();
          })
          .catch(error => {
            this.consecutiveFailures++;
            if (!this.networkConnectionFailed) {
              this.logger.warn('Network connectivity issue detected', {
                error: error.message || 'Connection refused',
                consecutiveFailures: this.consecutiveFailures,
              });
            }
            this.networkConnectionFailed = true;
            this.performanceMetrics.networkLatency = 'N/A';
            if (this.consecutiveFailures >= this.maxConsecutiveFailures) {
              this.currentPingInterval = Math.min(30000, this.currentPingInterval * 2);
              this.logger.debug(`Reducing ping frequency due to consecutive failures, new interval: ${this.currentPingInterval}ms`);
            }
          });
      });
  }

  getMemoryUsageClass() {
    const usage = parseFloat(this.performanceMetrics.memoryUsage);
    if (usage < 50) {
      return 'green-text';
    } else if (usage < 75) {
      return 'yellow-text';
    } else {
      return 'red-text';
    }
  }

  getCPUload(): Observable<number> {
    if (this.isSimulatingData) {
      return this.getSimulatedCPULoad();
    } else {
      return this.getRealCPULoad();
    }
  }

  private getSimulatedCPULoad(): Observable<number> {

    return of(15);                                        
  }

  private measureCPU() {
    const cpus = navigator.hardwareConcurrency || 4;
    const idle = cpus * 100;                      
    const total = cpus * 100;                       
    return { idle, total };
  }

  private getRealCPULoad(): Observable<number> {

    return of(20);                                        
  }

  getCpuLoadClass() {
    const load = parseFloat(this.performanceMetrics.cpuLoad);
    if (load < 50) {
      return 'green-text';
    } else if (load < 75) {
      return 'yellow-text';
    } else {
      return 'red-text';
    }
  }

  getNetworkLatencyClass(): string {
    const latency = parseFloat(this.performanceMetrics.networkLatency);
    if (latency < 100) {
      return 'green-text';
    } else if (latency < 200) {
      return 'yellow-text';
    } else {
      return 'red-text';
    }
  }

  navigateToResume(): void {
    this.router.navigate(['/resume']);
  }

  sendEmail(): void {
    window.location.href = 'mailto:jeffreysanford@gmail.com';
  }

  openGitHub(): void {
    window.open('https://github.com/JeffreySanford/craft-fusion/', '_blank');
  }

  navigateToAdminDashboard(): void {
    this.router.navigate(['/admin']);
  }

  private collectNavigatorInfo() {
    const navigatorInfo = {
      appCodeName: navigator.appCodeName,
      appName: navigator.appName,
      appVersion: navigator.appVersion,
      hardwareConcurrency: navigator.hardwareConcurrency,
      language: navigator.language,
      languages: navigator.languages,
      platform: navigator.platform,
      userAgent: navigator.userAgent,
      vendor: navigator.vendor,
      onLine: navigator.onLine,
      cookieEnabled: navigator.cookieEnabled,
      maxTouchPoints: navigator.maxTouchPoints,
      pdfViewerEnabled: navigator.pdfViewerEnabled,
      product: navigator.product,
      productSub: navigator.productSub,
      doNotTrack: navigator.doNotTrack,
      geolocation: navigator.geolocation,
      mediaDevices: navigator.mediaDevices,
      mediaSession: navigator.mediaSession,
      permissions: navigator.permissions,
      storage: navigator.storage,
      wakeLock: navigator.wakeLock,
    };

    this.logger.info('Navigator Info:', navigatorInfo);
  }

  private initializeChart() {
    try {
      if (!this.performanceChartRef || !this.performanceChartRef.nativeElement) {
        this.logger.error('Canvas element reference is not available');
        return;
      }

      const canvas = this.performanceChartRef.nativeElement;
      const ctx = canvas.getContext('2d');

      if (!ctx) {
        this.logger.error('Failed to get canvas context for performance chart');
        return;
      }

      const createGradient = (startColor: string, endColor: string) => {
        const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
        gradient.addColorStop(0, startColor);
        gradient.addColorStop(1, endColor);
        return gradient;
      };

      const memoryGradient = createGradient('rgba(59, 130, 246, 0.45)', 'rgba(59, 130, 246, 0.05)');
      const cpuGradient = createGradient('rgba(16, 185, 129, 0.35)', 'rgba(16, 185, 129, 0.04)');
      const latencyGradient = createGradient('rgba(239, 68, 68, 0.45)', 'rgba(239, 68, 68, 0.05)');

      this.chart = new Chart(ctx, {
        type: 'line',
        data: {
          labels: [],
          datasets: [
            {
              label: 'Memory Usage',
              data: [],
              borderColor: '#3b82f6',
              backgroundColor: memoryGradient,
              fill: true,
              borderWidth: 2,
              tension: 0.35,
              pointRadius: 3,
              pointHoverRadius: 5,
            },
            {
              label: 'CPU Load',
              data: [],
              borderColor: '#10b981',
              backgroundColor: cpuGradient,
              fill: true,
              borderWidth: 2,
              tension: 0.35,
              pointRadius: 3,
              pointHoverRadius: 5,
            },
            {
              label: 'Network Latency',
              data: [],
              borderColor: '#ef4444',
              backgroundColor: latencyGradient,
              fill: true,
              borderWidth: 2,
              tension: 0.35,
              pointRadius: 3,
              pointHoverRadius: 5,
            },
          ],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              position: 'top',
              labels: {
                color: '#d1d5db',
                  font: {
                    weight: 500,
                  },
              },
            },
            tooltip: {
              backgroundColor: 'rgba(15, 23, 42, 0.92)',
              bodyColor: '#f8fafc',
              titleColor: '#f8fafc',
              borderWidth: 0,
              callbacks: {
                label: context => {
                  const parsedValue =
                    typeof context.parsed === 'number' ? context.parsed : context.parsed?.y ?? 0;
                  return `${context.dataset.label}: ${parsedValue.toFixed(2)}`;
                },
              },
            },
          },
          interaction: {
            intersect: false,
            mode: 'index',
          },
          scales: {
            x: {
              display: true,
              title: {
                display: true,
                text: 'Time',
                color: '#cbd5f5',
              },
              ticks: {
                color: '#e5e7eb',
              },
              grid: {
                color: 'rgba(148, 163, 184, 0.2)',
              },
            },
            y: {
              beginAtZero: true,
              suggestedMax: 120,
              ticks: {
                color: '#e5e7eb',
              },
              grid: {
                color: 'rgba(148, 163, 184, 0.15)',
              },
            },
          },
        },
      });

      this.chartInitialized = true;
      this.logger.info('Chart initialized successfully');

      if (this.metricsBuffer.length > 0) {
        const data = this.chart!.data as any;
        data.labels = data.labels || [];
        data.datasets = data.datasets || [{ data: [] }, { data: [] }, { data: [] }];

        this.metricsBuffer.forEach(metric => {
          (data.labels as any[]).push(metric.time);
          (data.datasets[0].data as any[]).push(metric.memory);
          (data.datasets[1].data as any[]).push(metric.cpu);
          (data.datasets[2].data as any[]).push(metric.latency);
        });
        this.chart!.update();
        this.metricsBuffer = [];
      }
    } catch (error) {
      this.logger.error('Error initializing chart:', error);
    }
  }

  private updateChart() {

    const currentTime = new Date().toLocaleTimeString();
    const memoryValue = parseFloat(this.performanceMetrics.memoryUsage) || 0;
    const cpuValue = parseFloat(this.performanceMetrics.cpuLoad) || 0;
    const latencyValue = parseFloat(this.performanceMetrics.networkLatency) || 0;

    if (!this.chartInitialized) {

      this.metricsBuffer.push({
        time: currentTime,
        memory: memoryValue,
        cpu: cpuValue,
        latency: latencyValue,
      });
      return;
    }

    if (!this.chart || !this.chart.data) {
      return;
    }

    try {

      (this.chart.data.labels as any).push(currentTime);
      (this.chart.data.datasets as any)[0].data.push(memoryValue);
      (this.chart.data.datasets as any)[1].data.push(cpuValue);
      (this.chart.data.datasets as any)[2].data.push(latencyValue);

      if ((this.chart.data.labels as any).length > 10) {
        (this.chart.data.labels as any).shift();
        (this.chart.data.datasets as any).forEach((dataset: any) => dataset.data.shift());
      }

      this.chart.update();
    } catch (error) {
      this.logger.error(`Error updating chart: ${error}`);
    }
  }

  private updateChartBorderColor() {

    if (this.isSimulatingData) {
      this.chartBorderColor = 'blue';
      return;
    }

    const memoryUsage = parseFloat(this.performanceMetrics.memoryUsage);
    const cpuLoad = parseFloat(this.performanceMetrics.cpuLoad);
    const networkLatency = parseFloat(this.performanceMetrics.networkLatency);

    if (memoryUsage > 90 || cpuLoad > 90 || networkLatency > 300) {
      this.chartBorderColor = 'red';
    } else if (memoryUsage > 75 || cpuLoad > 75 || networkLatency > 200) {
      this.chartBorderColor = 'orange';
    } else if (memoryUsage > 60 || cpuLoad > 60 || networkLatency > 150) {
      this.chartBorderColor = 'yellow';
    } else {
      this.chartBorderColor = 'green';
    }
  }

  private startFrameRateMonitoring() {
    this.lastFrameTime = performance.now();
    this.frameRateUpdateInterval = requestAnimationFrame(this.updateFrameRate.bind(this));
  }

  private stopFrameRateMonitoring() {
    if (this.frameRateUpdateInterval) {
      cancelAnimationFrame(this.frameRateUpdateInterval);
    }
  }

  private updateFrameRate() {
    const now = performance.now();
    const delta = now - this.lastFrameTime;
    this.lastFrameTime = now;

    const fps = 1000 / delta;
    this.frameRateSamples.push(fps);

    if (this.frameRateSamples.length > 10) {
      this.frameRateSamples.shift();
    }

    this.frameRateUpdateInterval = requestAnimationFrame(this.updateFrameRate.bind(this));
  }

  toggleDataSimulation() {

    this.dataSimulationService.toggleSimulating();
  }

  private updateServiceMetricsChart() {
    if (!this.chart || this.isSimulatingData) return;

    const serviceResponseTimes = new Map<string, { total: number; count: number }>();

    this.serviceMetrics.forEach(metric => {
      const svc = metric.serviceName || 'unknown';
      if (metric.duration) {
        const entry = serviceResponseTimes.get(svc) ?? { total: 0, count: 0 };
        entry.total += metric.duration;
        entry.count += 1;
        serviceResponseTimes.set(svc, entry);
      }
    });

    const serviceData = Array.from(serviceResponseTimes.entries()).map(([service, entry]) => {
      const avg = entry.total / entry.count;
      return {
        service,
        avgTime: avg,
      };
    });

    if (serviceData.length > 0) {
      const avgServiceResponseTime = serviceData.reduce((sum, item) => sum + item.avgTime, 0) / serviceData.length;

      this.performanceMetrics.networkLatency = `${avgServiceResponseTime.toFixed(2)} ms`;

      this.updateChart();
    }
  }

  private updateChartData(): void {
    if (this.isSimulatingData) {

      this.performanceMetrics.networkLatency = '1 ms';
      if (this.chart) this.chart.update();
    }
  }

  onPanelToggled(isExpanded: boolean): void {
    this.expanded = isExpanded;
    this.footerStateService.setExpanded(isExpanded);
    this.logger.info(`Footer panel ${isExpanded ? 'expanded' : 'collapsed'}`, {}, 'FooterComponent');
  }
}
