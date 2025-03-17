import { Component, OnInit, OnDestroy, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import { Observable, Subscription, interval, of } from 'rxjs';
import Chart from 'chart.js/auto';
import { LoggerService, ServiceCallMetric } from '../../common/services/logger.service';
import { MatPaginator } from '@angular/material/paginator';
import { MatTableDataSource } from '@angular/material/table';

interface PerformanceMetrics {
  memoryUsage: string;
  cpuLoad: string;
  appUptime: string;
  networkLatency: string;
  adminStatus: string; // newly added
}

@Component({
  selector: 'app-admin',
  templateUrl: './admin.component.html',
  styleUrls: ['./admin.component.scss'],
standalone: false
})
export class AdminComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('systemMetricsChart') systemMetricsChartRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('serviceMetricsChart') serviceMetricsChartRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild(MatPaginator) paginator!: MatPaginator;

  performanceMetrics: PerformanceMetrics = {
    memoryUsage: 'N/A',
    cpuLoad: 'N/A',
    appUptime: 'N/A',
    networkLatency: 'N/A',
    adminStatus: 'inactive'
  };
  
  private systemMetricsChart: any;
  private serviceMetricsChart: any;
  private metricsSubscription!: Subscription;
  private serviceMetricsSubscription!: Subscription;
  private appStartTime = performance.now();
  private frameRateSamples: number[] = [];
  private lastFrameTime = 0;
  private frameRateUpdateInterval: any;
  
  isSimulatingData = false;
  serviceMetrics: ServiceCallMetric[] = [
    {
      serviceName: 'Authentication', method: 'POST', url: '/auth/login', duration: 10, status: 200,
      timestamp: 0
    },
    {
      serviceName: 'Auditing', method: 'POST', url: '/audit/event', duration: 20, status: 201,
      timestamp: 0
    }
  ];
  
  registeredServices = [
    { name: 'ApiService', description: 'Core API communication', active: true },
    { name: 'AuthenticationService', description: 'User authentication', active: true },
    { name: 'UserStateService', description: 'User state management', active: true },
    { name: 'SessionService', description: 'Session management', active: true },
    { name: 'BusyService', description: 'Loading state management', active: false },
    { name: 'NotificationService', description: 'User notifications', active: true },
    { name: 'LoggerService', description: 'Application logging', active: true },
    { name: 'ChatService', description: 'Chat functionality', active: false },
    { name: 'SettingsService', description: 'Application settings', active: true },
    { name: 'AdminStateService', description: 'Admin state management', active: true }
  ];
  
  serviceIconMap: {[key: string]: string} = {
    'api': 'api',
    'auth': 'security',
    'user-state': 'person',
    'session': 'watch_later',
    'busy': 'hourglass_empty',
    'notification': 'notifications',
    'logger': 'receipt_long',
    'chat': 'chat',
    'settings': 'settings',
    'admin': 'admin_panel_settings'
  };
  
  selectedTab = 0;

  // Add navigator property for template access
  navigator = window.navigator;

  selectedMetrics: string[] = ['cpu', 'memory', 'network'];

  // Add a property to track selected API call
  selectedApiCall: ServiceCallMetric | null = null;

  dataSource = new MatTableDataSource<ServiceCallMetric>([]);
  displayedColumns: string[] = ['service', 'method', 'url', 'duration', 'status'];

  constructor(private logger: LoggerService) {
    this.logger.info('Admin component initialized');
  }

  ngOnInit(): void {
    this.startMetricsMonitoring();
    this.startFrameRateMonitoring();
    this.monitorServiceCalls();
    
    // Add sample API calls data if none are showing
    if (this.serviceMetrics.length === 0) {
      this.generateSampleApiCalls();
    }
  }

  ngAfterViewInit(): void {
    this.dataSource.paginator = this.paginator;
    setTimeout(() => {
      this.initializeSystemMetricsChart();
      this.initializeServiceMetricsChart();
    }, 500);
  }

  ngOnDestroy(): void {
    if (this.metricsSubscription) {
      this.metricsSubscription.unsubscribe();
    }
    if (this.serviceMetricsSubscription) {
      this.serviceMetricsSubscription.unsubscribe();
    }
    if (this.frameRateUpdateInterval) {
      cancelAnimationFrame(this.frameRateUpdateInterval);
    }
    if (this.systemMetricsChart) {
      this.systemMetricsChart.destroy();
    }
    if (this.serviceMetricsChart) {
      this.serviceMetricsChart.destroy();
    }
  }

  private startMetricsMonitoring(): void {
    this.metricsSubscription = interval(2000).subscribe(() => {
      this.updateSystemMetrics();
    });
  }

  private startFrameRateMonitoring(): void {
    this.lastFrameTime = performance.now();
    this.frameRateUpdateInterval = requestAnimationFrame(this.updateFrameRate.bind(this));
  }

  private updateFrameRate(): void {
    const now = performance.now();
    const delta = now - this.lastFrameTime;
    this.lastFrameTime = now;
    
    // Calculate FPS (1000ms / delta between frames)
    const fps = 1000 / delta;
    this.frameRateSamples.push(fps);
    
    // Keep only the most recent samples
    if (this.frameRateSamples.length > 30) {
      this.frameRateSamples.shift();
    }
    
    // Continue monitoring
    this.frameRateUpdateInterval = requestAnimationFrame(this.updateFrameRate.bind(this));
  }

  private updateSystemMetrics(): void {
    // Memory usage
    if ((performance as any).memory) {
      const memory = (performance as any).memory;
      const totalJSHeapSize = memory.totalJSHeapSize;
      const usedJSHeapSize = memory.usedJSHeapSize;
      const memoryUsagePercentage = (usedJSHeapSize / totalJSHeapSize) * 100;
      this.performanceMetrics.memoryUsage = `${memoryUsagePercentage.toFixed(2)}%`;
    }

    // CPU load
    this.getRealCPULoad().subscribe(cpuLoad => {
      if (cpuLoad !== undefined && !isNaN(cpuLoad)) {
        this.performanceMetrics.cpuLoad = `${cpuLoad.toFixed(2)}%`;
      }
      this.updateSystemMetricsChart();
    });
    
    // Uptime
    const currentTime = performance.now();
    const uptimeMs = currentTime - this.appStartTime;
    const uptimeSec = uptimeMs / 1000;
    const uptimeMin = uptimeSec / 60;
    const uptimeHours = uptimeMin / 60;
    
    if (uptimeHours >= 1) {
      this.performanceMetrics.appUptime = `${uptimeHours.toFixed(2)} hours`;
    } else if (uptimeMin >= 1) {
      this.performanceMetrics.appUptime = `${uptimeMin.toFixed(2)} minutes`;
    } else {
      this.performanceMetrics.appUptime = `${uptimeSec.toFixed(2)} seconds`;
    }

    // Network latency
    this.measureNetworkLatency();
  }

  private getRealCPULoad(): Observable<number> {
    if (this.isSimulatingData) {
      return of(Math.random() * 80 + 10); // Random between 10-90%
    }
    
    // Calculate using FPS
    if (this.frameRateSamples.length === 0) {
      return of(0);
    }
    
    const avgFps = this.frameRateSamples.reduce((sum, fps) => sum + fps, 0) / this.frameRateSamples.length;
    const maxFps = 60;
    const minFps = 10;
    const load = Math.max(0, Math.min(100, 100 * (1 - ((avgFps - minFps) / (maxFps - minFps)))));
    
    return of(load);
  }

  private measureNetworkLatency(): void {
    const startTime = performance.now();
    
    fetch('/assets/ping.txt?' + Date.now(), { 
      method: 'HEAD',
      cache: 'no-store'
    })
    .then(() => {
      const latency = performance.now() - startTime;
      this.performanceMetrics.networkLatency = `${latency.toFixed(2)} ms`;
      this.updateSystemMetricsChart();
    })
    .catch(() => {
      // Fallback or simulated data
      if (this.isSimulatingData) {
        const simulatedLatency = Math.random() * 100 + 20; // Random between 20-120ms
        this.performanceMetrics.networkLatency = `${simulatedLatency.toFixed(2)} ms`;
      } else {
        this.performanceMetrics.networkLatency = 'N/A';
      }
      this.updateSystemMetricsChart();
    });
  }

  private monitorServiceCalls(): void {
    this.serviceMetricsSubscription = this.logger.serviceCalls$.subscribe(metrics => {
      if (metrics && metrics.length > 0) {
        this.serviceMetrics = metrics.slice(-50); // Keep last 50 calls
      } else if (this.isSimulatingData) {
        // If no real data but simulation is on, generate sample data
        this.generateSampleApiCalls();
      }
      this.dataSource.data = this.serviceMetrics;
      this.updateServiceMetricsChart();
    });
  }

  private initializeSystemMetricsChart(): void {
    if (!this.systemMetricsChartRef?.nativeElement) return;
    
    const ctx = this.systemMetricsChartRef.nativeElement.getContext('2d');
    if (!ctx) return;
    
    // Add gradient backgrounds for more visual appeal
    const memoryGradient = ctx.createLinearGradient(0, 0, 0, 400);
    memoryGradient.addColorStop(0, 'rgba(54, 162, 235, 0.3)');
    memoryGradient.addColorStop(1, 'rgba(54, 162, 235, 0)');
    
    const cpuGradient = ctx.createLinearGradient(0, 0, 0, 400);
    cpuGradient.addColorStop(0, 'rgba(75, 192, 192, 0.3)');
    cpuGradient.addColorStop(1, 'rgba(75, 192, 192, 0)');
    
    const latencyGradient = ctx.createLinearGradient(0, 0, 0, 400);
    latencyGradient.addColorStop(0, 'rgba(255, 99, 132, 0.3)');
    latencyGradient.addColorStop(1, 'rgba(255, 99, 132, 0)');
    
    // Register custom animations to Chart.js if not already registered
    if (!Chart.defaults.animations.patrioticEasing) {
      Chart.defaults.animations.patrioticEasing = {
        properties: ['color', 'number'],
        type: 'number',
        fn: (from: any, to: any, factor: number): any => from + (to - from) * factor,
        from: 0,
        to: 1,
        duration: 1200,
        easing: 'easeOutQuart'
      };
    }
    
    this.systemMetricsChart = new Chart(ctx, {
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
            tension: 0.4,
            borderWidth: 2,
            pointRadius: 3,
            pointHoverRadius: 6,
            pointBackgroundColor: '#3b82f6',
            pointBorderColor: '#fff',
            pointBorderWidth: 2,
            pointHoverBackgroundColor: '#fff',
            pointHoverBorderColor: '#3b82f6'
          },
          {
            label: 'CPU Load',
            data: [],
            borderColor: '#10b981',
            backgroundColor: cpuGradient,
            fill: true,
            tension: 0.4,
            borderWidth: 2,
            pointRadius: 3,
            pointHoverRadius: 6,
            pointBackgroundColor: '#10b981',
            pointBorderColor: '#fff',
            pointBorderWidth: 2,
            pointHoverBackgroundColor: '#fff',
            pointHoverBorderColor: '#10b981'
          },
          {
            label: 'Network Latency',
            data: [],
            borderColor: '#ef4444',
            backgroundColor: latencyGradient,
            fill: true,
            tension: 0.4,
            yAxisID: 'y1',
            borderWidth: 2,
            pointRadius: 3,
            pointHoverRadius: 6,
            pointBackgroundColor: '#ef4444',
            pointBorderColor: '#fff',
            pointBorderWidth: 2,
            pointHoverBackgroundColor: '#fff',
            pointHoverBorderColor: '#ef4444'
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        elements: {
          line: {
            tension: 0.4 // Smoother curves
          }
        },
        interaction: {
          mode: 'index',
          intersect: false
        },
        animation: {
          duration: 800,
          easing: 'easeOutQuart'
        },
        animations: {
          colors: {
            type: 'color',
            duration: 800,
            easing: 'easeOutQuart'
          },
          numbers: {
            type: 'number',
            duration: 800,
            easing: 'easeOutCubic',
            delay: (ctx) => ctx.dataIndex * 50 // Staggered animation
          }
        },
        transitions: {
          active: {
            animation: {
              duration: 400
            }
          }
        },
        scales: {
          x: {
            display: true,
            title: {
              display: true,
              text: 'Time (seconds)',
              color: '#e5e7eb',
              font: {
                size: 14,
                weight: 'bold'
              }
            },
            grid: {
              display: true,
              color: 'rgba(255, 255, 255, 0.1)'
            },
            ticks: {
              color: '#e5e7eb',
              callback: (value) => `${value}s`,
              stepSize: 15
            }
          },
          y: {
            beginAtZero: true,
            max: 100,
            title: {
              display: true,
              text: 'Usage %',
              color: '#e5e7eb',
              font: {
                size: 14,
                weight: 'bold'
              }
            },
            grid: {
              display: true,
              color: 'rgba(255, 255, 255, 0.1)'
            },
            ticks: {
              color: '#e5e7eb',
              callback: function(value) {
                return value + '%';
              }
            }
          },
          y1: {
            position: 'right',
            beginAtZero: true,
            max: 200,
            title: {
              display: true,
              text: 'Latency (ms)',
              color: '#e5e7eb',
              font: {
                size: 14,
                weight: 'bold'
              }
            },
            grid: {
              drawOnChartArea: false,
              color: 'rgba(255, 255, 255, 0.1)'
            },
            ticks: {
              color: '#e5e7eb',
              callback: function(value) {
                return value + ' ms';
              }
            }
          }
        },
        plugins: {
          legend: {
            position: 'top',
            labels: {
              color: '#e5e7eb',
              font: {
                size: 12
              },
              usePointStyle: true,
              pointStyle: 'circle'
            }
          },
          tooltip: {
            enabled: true,
            mode: 'index',
            intersect: false,
            backgroundColor: 'rgba(17, 25, 40, 0.8)',
            titleColor: '#fff',
            titleFont: {
              weight: 'bold',
              size: 14
            },
            bodyColor: '#e5e7eb',
            bodyFont: {
              size: 13
            },
            borderColor: 'rgba(255, 255, 255, 0.2)',
            borderWidth: 1,
            cornerRadius: 4,
            padding: 10,
            displayColors: true,
            boxPadding: 4
          }
        }
      }
    });
  }

  private updateSystemMetricsChart(): void {
    if (!this.systemMetricsChart) return;
    
    const currentTime = new Date().toLocaleTimeString();
    const memoryValue = parseFloat(this.performanceMetrics.memoryUsage) || 0;
    const cpuValue = parseFloat(this.performanceMetrics.cpuLoad) || 0;
    const latencyValue = parseFloat(this.performanceMetrics.networkLatency) || 0;
    
    // Add new data point
    this.systemMetricsChart.data.labels.push(currentTime);
    this.systemMetricsChart.data.datasets[0].data.push(memoryValue);
    this.systemMetricsChart.data.datasets[1].data.push(cpuValue);
    this.systemMetricsChart.data.datasets[2].data.push(latencyValue);
    
    // Limit the number of visible data points with smooth transition
    const maxPoints = 30;
    if (this.systemMetricsChart.data.labels.length > maxPoints) {
      this.systemMetricsChart.data.labels.shift();
      this.systemMetricsChart.data.datasets.forEach((dataset: any) => {
        dataset.data.shift();
      });
    }
    
    // Update with smooth animation
    this.systemMetricsChart.update({
      duration: 300,
      easing: 'easeInOutCubic',
      lazy: false
    });
  }

  private initializeServiceMetricsChart(): void {
    if (!this.serviceMetricsChartRef?.nativeElement) return;
    
    const ctx = this.serviceMetricsChartRef.nativeElement.getContext('2d');
    if (!ctx) return;
    
    // Create beautiful gradients for the charts
    const responseTimeGradient = ctx.createLinearGradient(0, 0, 0, 250);
    responseTimeGradient.addColorStop(0, 'rgba(65, 105, 225, 0.8)');
    responseTimeGradient.addColorStop(1, 'rgba(65, 105, 225, 0.2)');
    
    const callCountGradient = ctx.createLinearGradient(0, 0, 0, 250);
    callCountGradient.addColorStop(0, 'rgba(220, 20, 60, 0.8)');
    callCountGradient.addColorStop(1, 'rgba(220, 20, 60, 0.2)');
    
    this.serviceMetricsChart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: this.registeredServices.map(s => s.name),
        datasets: [
          {
            label: 'Avg Response Time (ms)',
            data: Array(this.registeredServices.length).fill(0),
            backgroundColor: responseTimeGradient,
            borderColor: 'rgba(65, 105, 225, 1)',
            borderWidth: 1,
            borderRadius: 4,
            hoverBackgroundColor: 'rgba(65, 105, 225, 1)'
          },
          {
            label: 'Call Count',
            data: Array(this.registeredServices.length).fill(0),
            backgroundColor: callCountGradient,
            borderColor: 'rgba(220, 20, 60, 1)',
            borderWidth: 1,
            borderRadius: 4,
            yAxisID: 'y1',
            hoverBackgroundColor: 'rgba(220, 20, 60, 1)'
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        animation: {
          duration: 1000,
          easing: 'easeOutQuart'
        },
        animations: {
          colors: {
            type: 'color',
            duration: 1000,
            easing: 'easeInOutQuad'
          },
          numbers: {
            type: 'number',
            duration: 800,
            delay: (context) => context.dataIndex * 100,
            easing: 'easeOutCubic'
          }
        },
        scales: {
          x: {
            title: { display: true, text: 'Time (seconds)' },
            ticks: {
              callback: (value) => `${value}s`,
              stepSize: 15,
              color: '#e5e7eb',
              maxRotation: 45,
              minRotation: 45
            },
            grid: {
              display: false,
              color: 'rgba(255, 255, 255, 0.1)'
            }
          },
          y: {
            beginAtZero: true,
            title: {
              display: true,
              text: 'Avg Response Time (ms)',
              color: '#e5e7eb',
              font: {
                size: 14,
                weight: 'bold'
              }
            },
            grid: {
              color: 'rgba(255, 255, 255, 0.1)'
            },
            ticks: {
              color: '#e5e7eb',
              callback: function(value) {
                return value + ' ms';
              }
            }
          },
          y1: {
            position: 'right',
            beginAtZero: true,
            grid: {
              drawOnChartArea: false,
              color: 'rgba(255, 255, 255, 0.1)'
            },
            title: {
              display: true,
              text: 'Call Count',
              color: '#e5e7eb',
              font: {
                size: 14,
                weight: 'bold'
              }
            },
            ticks: {
              color: '#e5e7eb',
              precision: 0
            }
          }
        },
        plugins: {
          legend: {
            position: 'top',
            labels: {
              color: '#e5e7eb',
              font: {
                size: 12
              },
              usePointStyle: true,
              pointStyle: 'rectRounded'
            }
          },
          tooltip: {
            backgroundColor: 'rgba(17, 25, 40, 0.9)',
            titleColor: '#fff',
            bodyColor: '#e5e7eb',
            borderColor: 'rgba(255, 255, 255, 0.2)',
            borderWidth: 1,
            cornerRadius: 4,
            displayColors: true,
            callbacks: {
              label: function(tooltipItem) {
                let label = tooltipItem.dataset.label || '';
                if (label) {
                  label += ': ';
                }
                if (tooltipItem.datasetIndex === 0) {
                  label += tooltipItem.formattedValue + ' ms';
                } else {
                  label += tooltipItem.formattedValue + ' calls';
                }
                return label;
              }
            }
          }
        }
      }
    });
  }

  private updateServiceMetricsChart(): void {
    if (!this.serviceMetricsChart) return;
    
    // Aggregate service call metrics by service name
    const serviceStats: {[serviceName: string]: {totalTime: number, count: number}} = {};
    
    this.serviceMetrics.forEach(metric => {
      if (!serviceStats[metric.serviceName]) {
        serviceStats[metric.serviceName] = { totalTime: 0, count: 0 };
      }
      
      if (metric.duration) {
        serviceStats[metric.serviceName].totalTime += metric.duration;
        serviceStats[metric.serviceName].count += 1;
      }
    });
    
    // Update chart data
    this.registeredServices.forEach((service, index) => {
      const stats = serviceStats[service.name] || { totalTime: 0, count: 0 };
      const avgTime = stats.count > 0 ? stats.totalTime / stats.count : 0;
      
      this.serviceMetricsChart.data.datasets[0].data[index] = avgTime;
      this.serviceMetricsChart.data.datasets[1].data[index] = stats.count;
    });
    
    this.serviceMetricsChart.update();
  }

  toggleDataSimulation(): void {
    this.isSimulatingData = !this.isSimulatingData;
    this.logger.info(`Admin dashboard: ${this.isSimulatingData ? 'Enabled' : 'Disabled'} data simulation`);
    
    if (this.isSimulatingData) {
      // Generate initial data if empty
      if (this.serviceMetrics.length === 0) {
        this.generateSampleApiCalls();
      } else {
        // Start adding simulated calls
        this.addSimulatedApiCall();
      }
      
      // When simulating, change some calls to "in process" status (code 1)
      const processingIndex = Math.floor(Math.random() * this.serviceMetrics.length);
      if (processingIndex < this.serviceMetrics.length) {
        this.serviceMetrics[processingIndex].status = 1; // Assuming 1 represents 'in process'
        this.serviceMetrics[processingIndex].duration = 3000; // Long duration for visual effect
      }
    }
    
    this.dataSource.data = this.serviceMetrics;
    // Force refresh the metrics display
    this.updateSystemMetricsChart();
    this.updateServiceMetricsChart();
  }

  toggleServiceStatus(service: any): void {
    service.active = !service.active;
    this.logger.info(`Service ${service.name} is now ${service.active ? 'active' : 'inactive'}`);
  }

  clearMetrics(): void {
    this.logger.clearMetrics();
    this.serviceMetrics = [];
    this.dataSource.data = this.serviceMetrics;
    this.updateServiceMetricsChart();
    this.logger.info('All service metrics cleared');
  }

  // Parse float helper for template
  parseFloat(value: string): number {
    return parseFloat(value) || 0;
  }
  
  // Methods needed for API activity table
  getPercentage(duration?: number): number {
    if (!duration) {
      return 0;
    }
    // Scale to percentage (500ms = 100%)
    return Math.min(100, (duration / 500) * 100);
  }
  
  getDurationClass(duration?: number): string {
    if (!duration) {
      return '';
    }
    if (duration < 100) {
      return 'duration-fast';
    } else if (duration < 300) {
      return 'duration-medium';
    }
    return 'duration-slow';
  }
  
  getStatusClass(status?: number): string {
    if (!status) {
      return 'status-unknown';
    }
    
    // Add handling for "in process" status
    if (status === 1) {
      return 'status-in-process';
    }
    
    if (status >= 200 && status < 300) {
      return 'status-success';
    } else if (status >= 300 && status < 400) {
      return 'status-redirect';
    } else if (status >= 400 && status < 500) {
      return 'status-client-error';
    } else if (status >= 500) {
      return 'status-server-error';
    }
    return 'status-unknown';
  }

  // Dynamically update chart Y-axis label
  // Removed duplicate function implementation

  toggleMetric(metric: string): void {
    const idx = this.selectedMetrics.indexOf(metric);
    if (idx > -1) {
      this.selectedMetrics.splice(idx, 1);
    } else {
      this.selectedMetrics.push(metric);
    }
    this.updateChartLegends();
  }

  private updateChartLegends(): void {
    const c = this.selectedMetrics.length;
    let label = '';

    if (c === 1) {
      const onlyMetric = this.selectedMetrics[0];
      if (onlyMetric === 'cpu') {
        label = 'CPU (%)';
      } else if (onlyMetric === 'memory') {
        label = 'Memory (GB)';
      } else if (onlyMetric === 'network') {
        label = 'Latency (ms)';
      }
    }

    this.systemMetricsChart.options.scales.y.title.text = label;
    this.systemMetricsChart.options.scales.y1.title.text = label;
    this.systemMetricsChart.update();
  }

  // Add a method to generate sample API calls for demonstration
  private generateSampleApiCalls(): void {
    const now = Date.now();
    const sampleCalls: ServiceCallMetric[] = [
      {
        serviceName: 'AuthenticationService', 
        method: 'POST', 
        url: '/api/auth/login', 
        duration: 120.5, 
        status: 200,
        timestamp: now - 5000
      },
      {
        serviceName: 'UserService', 
        method: 'GET', 
        url: '/api/users/profile', 
        duration: 85.2, 
        status: 200,
        timestamp: now - 4000
      },
      {
        serviceName: 'ProductService', 
        method: 'GET', 
        url: '/api/products?page=1&limit=10', 
        duration: 320.7, 
        status: 200,
        timestamp: now - 3000
      },
      {
        serviceName: 'OrderService', 
        method: 'POST', 
        url: '/api/orders/create', 
        duration: 450.1, 
        status: 201,
        timestamp: now - 2000
      },
      {
        serviceName: 'PaymentService', 
        method: 'PUT', 
        url: '/api/payments/process/12345', 
        duration: 210.3, 
        status: 200,
        timestamp: now - 1000
      },
      {
        serviceName: 'NotificationService', 
        method: 'POST', 
        url: '/api/notifications/send', 
        duration: 75.8, 
        status: 204,
        timestamp: now
      },
      {
        serviceName: 'AdminService', 
        method: 'DELETE', 
        url: '/api/admin/cache', 
        duration: 180.4, 
        status: 200,
        timestamp: now - 500
      },
      {
        serviceName: 'SearchService', 
        method: 'GET', 
        url: '/api/search?q=product&filter=new', 
        duration: 520.6, 
        status: 200,
        timestamp: now - 1500
      }
    ];
    
    this.serviceMetrics = sampleCalls;
    this.dataSource.data = this.serviceMetrics;
    
    // If simulation is on, periodically add new calls
    if (this.isSimulatingData) {
      setTimeout(() => {
        this.addSimulatedApiCall();
      }, 3000);
    }
  }
  
  // Method to add simulated API calls periodically
  private addSimulatedApiCall(): void {
    if (!this.isSimulatingData) return;
    
    const services = ['AuthenticationService', 'UserService', 'ProductService', 'OrderService', 
                     'PaymentService', 'NotificationService', 'AdminService', 'SearchService'];
                     
    const methods = ['GET', 'POST', 'PUT', 'DELETE'];
    
    const endpoints = [
      '/api/auth/validate',
      '/api/users/preferences',
      '/api/products/featured',
      '/api/orders/recent',
      '/api/payments/status',
      '/api/notifications/read',
      '/api/admin/status',
      '/api/search/trending'
    ];
    
    const statusCodes = [200, 201, 204, 400, 401, 403, 404, 500];
    
    // Create a random API call
    const newCall: ServiceCallMetric = {
      serviceName: services[Math.floor(Math.random() * services.length)],
      method: methods[Math.floor(Math.random() * methods.length)],
      url: endpoints[Math.floor(Math.random() * endpoints.length)],
      duration: Math.random() * 500 + 50, // Between 50-550ms
      status: statusCodes[Math.floor(Math.random() * statusCodes.length)],
      timestamp: Date.now()
    };
    
    // Add to existing metrics
    this.serviceMetrics.push(newCall);
    if (this.serviceMetrics.length > 50) {
      this.serviceMetrics.shift(); // Remove oldest if we have more than 50
    }
    
    this.dataSource.data = this.serviceMetrics;
    
    // Update the chart
    this.updateServiceMetricsChart();
    
    // Schedule next simulated call
    setTimeout(() => {
      this.addSimulatedApiCall();
    }, 2000 + Math.random() * 3000); // Random interval between 2-5 seconds
  }

  // Method to handle row selection
  selectApiCall(call: ServiceCallMetric): void {
    this.selectedApiCall = call;
  }
}
