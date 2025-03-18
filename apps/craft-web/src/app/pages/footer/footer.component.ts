import { Component, OnInit, OnDestroy, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, Subscription, interval, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import Chart from 'chart.js/auto';
import { LoggerService, ServiceCallMetric } from '../../common/services/logger.service';
import { AdminStateService } from '../../common/services/admin-state.service';
import { FooterStateService } from '../../common/services/footer-state.service';

@Component({
  selector: 'app-footer',
  templateUrl: './footer.component.html',
  styleUrls: ['./footer.component.scss'],
  standalone: false
})
export class FooterComponent implements OnInit, OnDestroy, AfterViewInit {
  @ViewChild('performanceChart') performanceChartRef!: ElementRef<HTMLCanvasElement>;
  performanceMetrics = {
    memoryUsage: 'N/A',
    cpuLoad: 'N/A',
    appUptime: 'N/A',
    networkLatency: 'N/A'
  };
  private performanceSubscription!: Subscription;
  private appStartTime: number;
  private chart: any;
  private chartInitialized = false;
  private metricsBuffer: Array<{time: string, memory: number, cpu: number, latency: number}> = [];
  isSimulatingData = false; // Try to use actual data by default
  chartBorderColor = 'green'; // Default to green for real data
  frameRateSamples: number[] = [];
  lastFrameTime = 0;
  frameRateUpdateInterval: any;
  isAdmin = false;
  expanded = false;

  logoLinks = [
    { src: 'assets/images/compressed/nodejs-new-pantone-white.png', alt: 'Node.js' },
    { src: 'assets/images/mongo.svg', alt: 'MongoDB' }, // Ensure the correct file extension
    { src: 'assets/images/compressed/angular.png', alt: 'Angular' },
    { src: 'assets/images/compressed/us-army-logo.png', alt: 'United States Army (DOD)', class: 'army' },
    { src: 'assets/images/compressed/US-GOVT-DLA.png', alt: 'Defense Logistics Agency', class: 'DLA' },
    { src: 'assets/images/compressed/US-GOVT-DVA-Seal.png', alt: 'Department of Veterans Affairs', class: 'DVA' },
    { src: 'assets/images/compressed/US-GOVT-DTIC.png', alt: 'Defense Technical Information Center', class: 'DTIC' }
  ];

  // Registry of all available services for monitoring
  registeredServices = [
    { name: 'ApiService', description: 'Core API communication' },
    { name: 'AuthenticationService', description: 'User authentication' },
    { name: 'UserStateService', description: 'User state management' },
    { name: 'SessionService', description: 'Session management' },
    { name: 'BusyService', description: 'Loading state management' },
    { name: 'NotificationService', description: 'User notifications' },
    { name: 'LoggerService', description: 'Application logging' },
    { name: 'ChatService', description: 'Chat functionality' },
    { name: 'SettingsService', description: 'Application settings' }
  ];

  serviceMetrics: ServiceCallMetric[] = [];
  metricUpdateSubscription?: Subscription;
  serviceIconMap: {[key: string]: string} = {
    'api': 'api',
    'auth': 'security',
    'user-state': 'person',
    'session': 'watch_later',
    'busy': 'hourglass_empty',
    'notification': 'notifications',
    'logger': 'receipt_long',
    'chat': 'chat',
    'settings': 'settings'
  };

  constructor(
    private router: Router, 
    private logger: LoggerService,
    private adminStateService: AdminStateService,
    private footerStateService: FooterStateService
  ) {
    this.appStartTime = performance.now();
    this.logger.info('Footer component initialized');
  }

  ngOnInit() {
    this.startPerformanceMonitoring();
    this.collectNavigatorInfo();
    this.startFrameRateMonitoring();
    this.startServiceMetricsMonitoring();
    
    // Subscribe to admin state
    this.adminStateService.isAdmin$.subscribe(isAdmin => {
      this.isAdmin = isAdmin;
    });
  }

  ngAfterViewInit() {
    // Delay chart initialization to ensure DOM is ready
    setTimeout(() => {
      this.initializeChart();
    }, 500);

    // Increase update frequency
    interval(500).subscribe(() => {
      this.updateChartData();
    });
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
  }

  private startPerformanceMonitoring() {
    console.log('Starting performance monitoring');
    const performanceInterval = interval(3000); // Emit every 3 seconds
    this.performanceSubscription = performanceInterval.subscribe(() => {
      this.updatePerformanceMetrics();
    });
  }

  private stopPerformanceMonitoring() {
    console.log('Stopping performance monitoring');
    if (this.performanceSubscription) {
      this.performanceSubscription.unsubscribe();
    }
  }

  private updatePerformanceMetrics() {
    if ((performance as any).memory) {
      const memory = (performance as any).memory;
      const totalJSHeapSize = memory.totalJSHeapSize;
      const usedJSHeapSize = memory.usedJSHeapSize;
      const memoryUsagePercentage = (usedJSHeapSize / totalJSHeapSize) * 100;
      this.performanceMetrics.memoryUsage = `${memoryUsagePercentage.toFixed(2)}%`;
    } else {
      this.performanceMetrics.memoryUsage = 'N/A';
    }

    // Get actual CPU load
    this.getCPUload().subscribe(cpuLoad => {
      if (cpuLoad !== undefined && !isNaN(cpuLoad)) {
        this.performanceMetrics.cpuLoad = `${cpuLoad.toFixed(2)}%`;
      } else {
        this.performanceMetrics.cpuLoad = 'N/A';
      }
      this.updateChart();
    }, () => {
      this.performanceMetrics.cpuLoad = 'N/A';
      this.updateChart();
    });
    
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
    
    // Update chart border color based on metrics
    this.updateChartBorderColor();
  }

  private measureNetworkLatency() {
    // Use actual network request to measure latency
    const startTime = performance.now();
    
    // Create a tiny request to measure network latency
    fetch('/assets/documents/ping.txt?' + new Date().getTime(), { 
      method: 'HEAD',
      cache: 'no-store'
    })
    .then(() => {
      const latency = performance.now() - startTime;
      this.performanceMetrics.networkLatency = `${latency.toFixed(2)} ms`;
      this.updateChart();
    })
    .catch(() => {
      // Fallback to RTCPeerConnection method if fetch fails
      const peerConnection = new RTCPeerConnection({ iceServers: [] });
      peerConnection.createDataChannel('latencyCheck');
      
      peerConnection.createOffer().then(offer => {
        return peerConnection.setLocalDescription(offer);
      }).then(() => {
        const latency = performance.now() - startTime;
        this.performanceMetrics.networkLatency = `${latency.toFixed(2)} ms`;
        peerConnection.close();
        this.updateChart();
      }).catch(() => {
        this.performanceMetrics.networkLatency = 'N/A';
        peerConnection.close();
        this.updateChart();
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
    return new Observable<number>(observer => {
      const startMeasure = this.measureCPU();
      setTimeout(() => {
        const endMeasure = this.measureCPU();
        const idleDifference = endMeasure.idle - startMeasure.idle;
        const totalDifference = endMeasure.total - startMeasure.total;
        const cpuLoad = 100 - (100 * idleDifference / totalDifference);
        const currentTime = new Date().toLocaleString();
        console.log(`Simulated CPU Load at ${currentTime}: ${cpuLoad.toFixed(2)}%`);
        observer.next(cpuLoad);
        observer.complete();
      }, 1000);
    });
  }

  private measureCPU() {
    const cpus = navigator.hardwareConcurrency || 4;
    const idle = cpus * 100; // Simulate idle time
    const total = cpus * 100; // Simulate total time
    return { idle, total };
  }

  private getRealCPULoad(): Observable<number> {
    // Estimate CPU load based on frame rate
    if (this.frameRateSamples.length === 0) {
      return of(0);
    }
    
    // Calculate average FPS from samples
    const avgFps = this.frameRateSamples.reduce((sum, fps) => sum + fps, 0) / this.frameRateSamples.length;
    
    // Map FPS to CPU load (lower FPS = higher CPU load)
    // Assume 60 FPS is ideal (0% load) and 10 FPS is maximum load (100%)
    const maxFps = 60;
    const minFps = 10;
    const load = Math.max(0, Math.min(100, 100 * (1 - ((avgFps - minFps) / (maxFps - minFps)))));
    
    return of(load);
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
      wakeLock: navigator.wakeLock
    };

    console.log('Navigator Info:', navigatorInfo);
  }

  private initializeChart() {
    try {
      if (!this.performanceChartRef || !this.performanceChartRef.nativeElement) {
        console.error('Canvas element reference is not available');
        return;
      }

      const canvas = this.performanceChartRef.nativeElement;
      const ctx = canvas.getContext('2d');
      
      if (!ctx) {
        console.error('Failed to get canvas context for performance chart');
        return;
      }
      
      this.chart = new Chart(ctx, {
        type: 'line',
        data: {
          labels: [],
          datasets: [
            {
              label: 'Memory Usage',
              data: [],
              borderColor: 'blue',
              fill: false
            },
            {
              label: 'CPU Load',
              data: [],
              borderColor: 'green',
              fill: false
            },
            {
              label: 'Network Latency',
              data: [],
              borderColor: 'red',
              fill: false
            }
          ]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          scales: {
            x: {
              display: true,
              title: {
                display: true,
                text: 'Time'
              }
            },
            y: {
              beginAtZero: true,
              max: 100
            }
          }
        }
      });
      
      this.chartInitialized = true;
      console.log('Chart initialized successfully');
      
      // Process any buffered metrics
      if (this.metricsBuffer.length > 0) {
        this.metricsBuffer.forEach(metric => {
          this.chart.data.labels.push(metric.time);
          this.chart.data.datasets[0].data.push(metric.memory);
          this.chart.data.datasets[1].data.push(metric.cpu);
          this.chart.data.datasets[2].data.push(metric.latency);
        });
        this.chart.update();
        this.metricsBuffer = [];
      }
    } catch (error) {
      console.error('Error initializing chart:', error);
    }
  }

  private updateChart() {
    // Clean up and improve chart update logic
    const currentTime = new Date().toLocaleTimeString();
    const memoryValue = parseFloat(this.performanceMetrics.memoryUsage) || 0;
    const cpuValue = parseFloat(this.performanceMetrics.cpuLoad) || 0;
    const latencyValue = parseFloat(this.performanceMetrics.networkLatency) || 0;
    
    if (!this.chartInitialized) {
      // Buffer metrics until chart is ready
      this.metricsBuffer.push({
        time: currentTime,
        memory: memoryValue,
        cpu: cpuValue,
        latency: latencyValue
      });
      return;
    }
    
    if (!this.chart || !this.chart.data) {
      return;
    }
    
    try {
      // Add new data
      this.chart.data.labels.push(currentTime);
      this.chart.data.datasets[0].data.push(memoryValue);
      this.chart.data.datasets[1].data.push(cpuValue);
      this.chart.data.datasets[2].data.push(latencyValue);
      
      // Keep chart readable with limited points
      if (this.chart.data.labels.length > 10) {
        this.chart.data.labels.shift();
        this.chart.data.datasets.forEach((dataset: { data: any[]; }) => dataset.data.shift());
      }
      
      this.chart.update('quiet'); // Use quiet mode for better performance
    } catch (error) {
      this.logger.error(`Error updating chart: ${error}`);
    }
  }

  private updateChartBorderColor() {
    // Default to blue if we're simulating data
    if (this.isSimulatingData) {
      this.chartBorderColor = 'blue';
      return;
    }
    
    // Check for "hot" metrics
    const memoryUsage = parseFloat(this.performanceMetrics.memoryUsage);
    const cpuLoad = parseFloat(this.performanceMetrics.cpuLoad);
    const networkLatency = parseFloat(this.performanceMetrics.networkLatency);
    
    // Determine color based on highest threshold exceeded
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
    
    // Calculate FPS (1000ms / delta between frames)
    const fps = 1000 / delta;
    this.frameRateSamples.push(fps);
    
    // Keep only the most recent 30 samples
    if (this.frameRateSamples.length > 30) {
      this.frameRateSamples.shift();
    }
    
    // Continue monitoring
    this.frameRateUpdateInterval = requestAnimationFrame(this.updateFrameRate.bind(this));
  }

  toggleDataSimulation() {
    this.isSimulatingData = !this.isSimulatingData;
    console.log(`${this.isSimulatingData ? 'Enabled' : 'Disabled'} data simulation`);
    
    // Update border color based on whether we're simulating data
    this.updateChartBorderColor();
  }

  private startServiceMetricsMonitoring() {
    this.metricUpdateSubscription = this.logger.serviceCalls$.subscribe(metrics => {
      this.serviceMetrics = metrics.slice(-20); // Keep last 20 calls
      
      if (this.chartInitialized) {
        this.updateServiceMetricsChart();
      }
    });
  }

  private updateServiceMetricsChart() {
    if (!this.chart || this.isSimulatingData) return;
    
    // Get average response times by service
    const serviceResponseTimes: {[key: string]: {total: number, count: number}} = {};
    
    this.serviceMetrics.forEach(metric => {
      if (metric.duration) {
        if (!serviceResponseTimes[metric.serviceName]) {
          serviceResponseTimes[metric.serviceName] = { total: 0, count: 0 };
        }
        serviceResponseTimes[metric.serviceName].total += metric.duration;
        serviceResponseTimes[metric.serviceName].count += 1;
      }
    });
    
    // Update the third dataset with service response times
    const serviceData = Object.keys(serviceResponseTimes).map(service => {
      const avg = serviceResponseTimes[service].total / serviceResponseTimes[service].count;
      return {
        service,
        avgTime: avg
      };
    });
    
    // If we have service data, update the network latency dataset
    if (serviceData.length > 0) {
      const avgServiceResponseTime = serviceData.reduce((sum, item) => sum + item.avgTime, 0) / serviceData.length;
      // Scale to a percentage value (assuming 500ms is 100%)
      const scaledValue = Math.min(100, (avgServiceResponseTime / 500) * 100);
      
      // Update the latency value
      this.performanceMetrics.networkLatency = `${avgServiceResponseTime.toFixed(2)} ms`;
      
      // This will trigger chart update via existing mechanism
      this.updateChart();
    }
  }

  private updateChartData(): void {
    if (this.isSimulatingData) {
      // Force near-zero response times and quicker intervals
      this.performanceMetrics.networkLatency = '1 ms';
      this.chart.update('active');
    }
  }

  onPanelToggled(isExpanded: boolean): void {
    this.expanded = isExpanded;
    this.footerStateService.setExpanded(isExpanded);
    this.logger.info(`Footer panel ${isExpanded ? 'expanded' : 'collapsed'}`);
  }
}