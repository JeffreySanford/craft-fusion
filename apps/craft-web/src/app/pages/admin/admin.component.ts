import { Component, OnInit, Inject, ElementRef, ViewChild } from '@angular/core';
import { Observable, Subscription, interval, of } from 'rxjs';
import Chart, { Color } from 'chart.js/auto';
import { LoggerService, ServiceCallMetric } from '../../common/services/logger.service';
import { MatPaginator } from '@angular/material/paginator';
import { MatTableDataSource } from '@angular/material/table';
import { LoggerDisplayComponent } from '../../components/logger-display/logger-display.component';
import { UserActivityService } from '../../common/services/user-activity.service';
import { UserStateService } from '../../common/services/user-state.service';
import { trigger, state, style, transition, animate } from '@angular/animations';
import { ApiLoggerService } from '../../common/services/api-logger.service';
import { SocketClientService } from '../../common/services/socket-client.service';

interface PerformanceMetrics {
  memoryUsage: string;
  cpuLoad: string;
  appUptime: string;
  networkLatency: string;
  adminStatus: string; // newly added
}

interface ServiceMetrics {
  securityEvents: number;
  authAttempts: number;
  failedAuths: number;
  activeUsers: number;
  averageLatency: number;
  errorRate: number;
  lastIncident?: Date;
}

interface DisplayMetric {
  color: string;
  icon: string;
  label: string;
  value: string | number;
  unit: string;
  trend: number;
}

// Keep only one interface for endpoint logs
interface ApiEndpointLog {
  path: string;
  method: string;  
  lastContacted: Date | null;
  lastPing: Date | null;
  status: string;
  hitCount: number;
  successCount: number;
  errorCount: number;
  avgResponseTime: number;
  firstSeen: Date;
  // Add data for tracking logs and timeline
  timelineData: {
    timestamp: Date; // Change from number to Date
    responseTime: number;
    status: number;
    requestBody?: any;
    responseBody?: any;
    headers?: any;
  }[];
}

@Component({
  selector: 'app-admin',
  templateUrl: './admin.component.html',
  styleUrls: ['./admin.component.scss'],
  standalone: false,
  animations: [
    trigger('detailExpand', [
      state('collapsed', style({ height: '0px', minHeight: '0', overflow: 'hidden', opacity: 0 })),
      state('expanded', style({ height: '*', opacity: 1 })),
      transition('expanded <=> collapsed', animate('300ms cubic-bezier(0.4, 0.0, 0.2, 1)')),
    ]),
  ]
})
export class AdminComponent implements OnInit {
  @ViewChild('systemMetricsChart') systemMetricsChartRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('serviceMetricsChart') serviceMetricsChartRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild(MatPaginator) paginator!: MatPaginator;

  performanceMetrics: PerformanceMetrics = {
    memoryUsage: 'N/A',
    cpuLoad: 'N/A',
    appUptime: 'N/A',
    networkLatency: 'N/A',
    adminStatus: 'inactive',
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

  private createDefaultMetric(
    serviceName: string,
    method: string,
    url: string,
    duration: number,
    status: number,
    timestamp: number
  ): ServiceCallMetric {
    return {
      id: `${serviceName}-${Date.now()}`,
      serviceName,
      method,
      url,
      duration,
      status,
      timestamp: new Date(timestamp), // Convert number to Date object
      securityEvents: 0,
      authAttempts: 0,
      activeUsers: 0,
      averageLatency: duration,
      errorRate: status >= 400 ? 100 : 0,
      lastIncident: status >= 400 ? new Date() : undefined
    };
  }

  serviceMetrics: ServiceCallMetric[] = [
    this.createDefaultMetric('Authentication', 'POST', '/auth/login', 10, 200, 0),
    this.createDefaultMetric('Auditing', 'POST', '/audit/event', 20, 201, 0),
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
    { name: 'AdminStateService', description: 'Admin state management', active: true },
  ];

  serviceIconMap: { [key: string]: string } = {
    api: 'api',
    auth: 'security',
    'user-state': 'person',
    session: 'watch_later',
    busy: 'hourglass_empty',
    notification: 'notifications',
    logger: 'receipt_long',
    chat: 'chat',
    settings: 'settings',
    admin: 'admin_panel_settings',
  };

  selectedTab = 0;

  // Add navigator property for template access
  navigator = window.navigator;

  selectedMetrics: string[] = ['memory', 'cpu', 'network'];

  // Add a property to track selected API call
  selectedApiCall: ServiceCallMetric | null = null;

  dataSource = new MatTableDataSource<ServiceCallMetric>([]);
  displayedColumns: string[] = ['service', 'method', 'url', 'duration', 'status'];

  // Add color mapping for services
  private serviceColors: { [key: string]: string } = {
    'ApiService': '#FF6B6B',
    'AuthenticationService': '#4ECDC4',
    'UserStateService': '#45B7D1',
    'SessionService': '#96CEB4',
    'BusyService': '#FFEEAD',
    'NotificationService': '#D4A5A5',
    'LoggerService': '#9B59B6',
    'ChatService': '#3498DB',
    'SettingsService': '#FF9F4A',
    'AdminStateService': '#2ECC71'
  };

  // Add new properties for statistics
  private statisticsInterval: any;
  protected serviceStatistics: { [key: string]: any } = {};
  private serviceMetricsMap = new Map<string, ServiceMetrics>();
  private readonly METRICS_UPDATE_INTERVAL = 15000; // 15 seconds

  public selectedLogLevel: string = 'all';
  public autoScroll: boolean = true;
  public logStats: any[] = [];

  private simulationInterval: any;
  private isTabActive = true;

  // Add new property to track selected tab
  @ViewChild('tabGroup') tabGroup: any;

  // Track performance issues
  private lastPerformanceWarning = 0;
  private performanceIssueCount = 0;



  // Track expanded endpoint
  expandedEndpoint: string | null = null;

  // Use only endpointLogs instead of apiServiceInfo 
  endpointLogs: { [key: string]: ApiEndpointLog } = {};

  // Add a property to track timestamp formatting
  timestampFormat: string = 'shortTime';

  // API Logs subscription
  private apiLogsSubscription!: Subscription;

  constructor(
    // Use @Inject with a string token that matches what's registered in your providers
    @Inject('AuthService') private authService: any,
    private logger: LoggerService,
    private userActivity: UserActivityService,
    private userState: UserStateService,
    private apiLogger: ApiLoggerService,
    private socketClient: SocketClientService
  ) {
    // Subscribe to real-time metrics
    this.socketClient.on<any>('metrics:update').subscribe(metric => {
      // Update metrics in the dashboard
      this.logger.info('Received real-time metric', metric);
    });
    // Subscribe to connection status
    this.socketClient.isConnected$.subscribe(connected => {
      this.logger.info('Socket connection status', { connected });
    });
  }

  ngOnInit(): void {
    this.startMetricsMonitoring();
    this.startFrameRateMonitoring();
    this.monitorServiceCalls();
    this.startStatisticsPolling();

    // Add sample API calls data if none are showing
    if (this.serviceMetrics.length === 0) {
      this.generateSampleApiCalls();
    }

    // Initialize logStats with some default values
    this.logStats = [
      { id: 1, icon: 'error', label: 'Errors', value: 0, color: 'red' },
      { id: 2, icon: 'warning', label: 'Warnings', value: 0, color: 'orange' },
      { id: 3, icon: 'info', label: 'Info', value: 0, color: 'blue' },
    ];

    // Add tab change subscription with debug logging
    this.tabGroup?.selectedIndexChange.subscribe((index: number) => {
      console.debug('Tab changed to:', index);
      
      // Service Monitoring tab is index 1
      if (index === 1) {
        console.debug('Entering Service Monitoring tab');
        debugger; // Add breakpoint for tab entry
        
        // Only start monitoring if not already active
        if (!this.isTabActive) {
          this.isTabActive = true;
          this.initializeServiceMonitoring();
        }
      } else {
        this.isTabActive = false;
        this.pauseSimulation();
      }
    });

    // Subscribe to API logs
    this.monitorApiEndpoints();
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
    if (this.statisticsInterval) {
      clearInterval(this.statisticsInterval);
    }
    this.pauseSimulation();
    if (this.simulationInterval) {
      clearInterval(this.simulationInterval);
    }
    // Clean up API logs subscription if it exists
    if (this.apiLogsSubscription) {
      this.apiLogsSubscription.unsubscribe();
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
    const load = Math.max(0, Math.min(100, 100 * (1 - (avgFps - minFps) / (maxFps - minFps))));

    return of(load);
  }

  private measureNetworkLatency(): void {
    const startTime = performance.now();
    // Use HEAD request to backend health endpoint
    fetch('/api/health?' + Date.now(), {
      method: 'HEAD',
      cache: 'no-store',
      signal: AbortSignal.timeout ? AbortSignal.timeout(3000) : undefined
    })
      .then(() => {
        const latency = performance.now() - startTime;
        this.performanceMetrics.networkLatency = `${latency.toFixed(2)} ms`;
        this.updateSystemMetricsChart();
      })
      .catch(() => {
        // Fallback: try to fetch a static asset to check if frontend is responsive
        const assetStart = performance.now();
        fetch('/assets/ping.txt?' + Date.now(), {
          method: 'HEAD',
          cache: 'no-store',
          signal: AbortSignal.timeout ? AbortSignal.timeout(2000) : undefined
        })
          .then(() => {
            const latency = performance.now() - assetStart;
            this.performanceMetrics.networkLatency = `${latency.toFixed(2)} ms (static)`;
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
      });
  }

  getKeys(obj: any): string[] {
    return Object.keys(obj);
  }
  
  private monitorServiceCalls(): void {
    this.serviceMetricsSubscription = this.logger.serviceCalls$.subscribe(metrics => {
      if (metrics && metrics.length > 0) {
        this.serviceMetrics = metrics.slice(-50); // Keep last 50 calls

        // Update API service info
        metrics.forEach(metric => {
          if (!this.endpointLogs[metric.serviceName]) {
            this.endpointLogs[metric.serviceName] = {
              path: metric.url,
              method: metric.method,
              lastContacted: null,
              lastPing: null,
              status: 'active', // Initial status
              hitCount: 0,
              successCount: 0,
              errorCount: 0,
              avgResponseTime: 0,
              firstSeen: new Date(),
              timelineData: []
            };
          }
          
          const serviceInfo = this.endpointLogs[metric.serviceName];
          serviceInfo.lastContacted = new Date(metric.timestamp);
          serviceInfo.lastPing = new Date();
          serviceInfo.hitCount++;
          
          // Track success/error counts
          if ((metric.status ?? 0) >= 200 && (metric.status ?? 0) < 400) {
            serviceInfo.successCount++;
          } else if ((metric.status ?? 0) >= 400) {
            serviceInfo.errorCount++;
          } else if ((metric.status ?? 0) >= 500) {
            serviceInfo.status = 'error';
          } else if ((metric.status ?? 0) === 0) {
            serviceInfo.status = 'inactive';
          } else {
            serviceInfo.status = 'active';
          }
          
          // Calculate running average for response time
          serviceInfo.avgResponseTime = 
            (serviceInfo.avgResponseTime * (serviceInfo.hitCount - 1) + (metric.duration || 0)) / 
            serviceInfo.hitCount;
          
          // Add data point for timeline/sparkline
          serviceInfo.timelineData.push({
            timestamp: new Date(metric.timestamp), // Convert to Date
            responseTime: metric.duration || 0,
            status: metric.status ?? 0
          });
          
          // Keep only the last 50 data points for the timeline
          if (serviceInfo.timelineData.length > 50) {
            serviceInfo.timelineData = serviceInfo.timelineData.slice(-50);
          }
          
          // Add to metrics array as well (for backward compatibility)
        });
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

    // Register our custom legend plugin to add checkmarks
    const enhancedLegendPlugin = {
      id: 'enhancedLegend',
      beforeDraw: (chart: any) => {
        const legendItems = chart.legend.legendItems;
        
        // Add class to legend container for styling
        const legendEl = chart.legend.chart.canvas.parentNode.querySelector('.chart-legend');
        if (legendEl) {
          legendEl.classList.add('enhanced-legend');
        }
        
        // Set active state on legend items based on dataset visibility
        legendItems.forEach((item: any, index: number) => {
          const dataset = chart.data.datasets[index];
          const metricType = index === 0 ? 'memory' : index === 1 ? 'cpu' : 'network';
          
          // Add information to legend item for CSS styling
          item.isActive = this.selectedMetrics.includes(metricType);
          item.metricType = metricType;
        });
      },
      afterUpdate: () => {
        // Add our custom checkmarks after the chart updates
        setTimeout(() => {
          const chartContainer = this.systemMetricsChart.canvas.parentNode;
          const legendItems = chartContainer.querySelectorAll('.chart-legend li');
          
          legendItems.forEach((item: HTMLElement, index: number) => {
            const metricType = index === 0 ? 'memory' : index === 1 ? 'cpu' : 'network';
            const isActive = this.selectedMetrics.includes(metricType);
            
            // Set data attributes for CSS styling 
            item.setAttribute('data-metric-type', metricType);
            item.setAttribute('data-active', isActive.toString());
            
            // Remove existing checkmarks and indicators if any
            const existingCheck = item.querySelector('.legend-checkmark');
            if (existingCheck) {
              existingCheck.remove();
            }
            
            const existingIndicator = item.querySelector('.legend-active-indicator');
            if (existingIndicator) {
              existingIndicator.remove();
            }
            
            // Add checkmark for active items
            if (isActive) {
              const checkmark = document.createElement('span');
              checkmark.className = 'legend-checkmark';
              checkmark.textContent = '✓';
              item.appendChild(checkmark);
              
              // Add patriotic indicator line
              const indicator = document.createElement('div');
              indicator.className = 'legend-active-indicator';
              item.appendChild(indicator);
              
              // Add pulse animation class
              item.classList.add('pulse-animation');
              item.classList.add(`pulse-${metricType}`);
            } else {
              item.classList.remove('pulse-animation');
              item.classList.remove(`pulse-memory`, `pulse-cpu`, `pulse-network`);
            }
            
            // Ensure text is styled properly
            const textEl = item.querySelector('.chartjs-legend-text');
            if (textEl) {
              textEl.classList.add('legend-text');
            }
          });
        }, 10);
      }
    };

    // Add a plugin to display a message when no metrics are selected
    const noDataPlugin = {
      id: 'noDataPlugin',
      afterDraw: (chart: any) => {
        if (this.selectedMetrics.length === 0) {
          // Get the canvas and dimensions
          const ctx = chart.ctx;
          const width = chart.width;
          const height = chart.height;
          
          // Save context
          ctx.save();
          
          // Draw text
          ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.font = '16px Arial';
          ctx.fillText('No metrics selected', width / 2, height / 2 - 20);
          
          ctx.font = '14px Arial';
          ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
          ctx.fillText('Click on the legend items above to display metrics', width / 2, height / 2 + 20);
          
          // Restore context
          ctx.restore();
        }
      }
    };

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
            pointHoverBorderColor: '#3b82f6',
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
            pointHoverBorderColor: '#10b981',
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
            pointHoverBorderColor: '#ef4444',
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        elements: {
          line: {
            tension: 0.4, // Smoother curves
          },
        },
        interaction: {
          mode: 'index',
          intersect: false,
        },
        animation: {
          duration: 800,
          easing: 'easeOutQuart',
        },
        animations: {
          colors: {
            type: 'color',
            duration: 800,
            easing: 'easeOutQuart',
          },
          numbers: {
            type: 'number',
            duration: 800,
            easing: 'easeOutCubic',
            delay: ctx => ctx.dataIndex * 50, // Staggered animation
          },
        },
        transitions: {
          active: {
            animation: {
              duration: 400,
            },
          },
        },
        scales: {
          x: {
            display: true,
            title: {
              display: true,
              text: 'Time (updated every 2 seconds)',
              color: '#e5e7eb',
              font: {
                size: 14,
                weight: 'bold',
              },
            },
            grid: {
              display: true,
              color: 'rgba(255, 255, 255, 0.1)',
            },
            ticks: {
              color: '#e5e7eb',
              maxTicksLimit: 8, // Limit number of ticks to prevent crowding
              callback: function(value, index, ticks) {
                // Use index-based filtering to reduce clutter
                if (ticks.length < 10 || index % Math.ceil(ticks.length / 8) === 0) {
                  return this.getLabelForValue(Number(value));
                }
                return '';
              }
            },
          },
          y: {
            display: true,
            beginAtZero: true,
            max: 100,
            title: {
              display: true,
              text: 'Usage %',
              color: '#e5e7eb',
              font: {
                size: 14,
                weight: 'bold',
              },
            },
            grid: {
              display: true,
              color: 'rgba(255, 255, 255, 0.1)',
            },
            ticks: {
              color: '#e5e7eb',
              callback: function (value) {
                return value + '%';
              },
            },
          },
          y1: {
            position: 'right',
            beginAtZero: true,
            max: 200,
            title: {
              display: true,
              text: 'Latency (ms)',
              color: '#3b82f6', // Changed to blue
              font: {
                size: 14,
                weight: 'bold',
              },
            },
            grid: {
              drawOnChartArea: false,
              color: 'rgba(255, 255, 255, 0.1)',
            },
            ticks: {
              color: '#3b82f6', // Changed to blue
              callback: function (value) {
                return value + ' ms';
              },
            },
          },
        },
        plugins: {
          legend: {
            display: true,
            position: 'top',
            align: 'center',
            labels: {
              usePointStyle: true,
              pointStyle: 'circle',
              padding: 20,
              color: '#e5e7eb',
              font: {
                size: 14,
                weight: 'bold',
              },
              generateLabels: (chart) => {
                const datasets = chart.data.datasets;
                return datasets.map((dataset, i) => {
                  const metricType = i === 0 ? 'memory' : i === 1 ? 'cpu' : 'network';
                  const isActive = this.selectedMetrics.includes(metricType);
                  
                  return {
                    text: dataset.label || '',
                    fillStyle: dataset.borderColor as Color,
                    strokeStyle: dataset.borderColor as Color,
                    lineWidth: 0,
                    hidden: !isActive,
                    index: i,
                    metricType: metricType,
                    isActive: isActive
                  };
                });
              }
            },
            onClick: (e, legendItem, legend) => {
              // Our custom click handler that maintains multi-selection
              if (legendItem && legendItem.index !== undefined) {
                const index = legendItem.index;
                const metricType = index === 0 ? 'memory' : index === 1 ? 'cpu' : 'network';
                
                // Toggle metric visibility
                this.toggleMetric(metricType);
                
                // Prevent default legend click behavior
                if (e.native) {
                  e.native.preventDefault();
                  e.native.stopPropagation();
                }
              }
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
              size: 14,
            },
            bodyColor: '#e5e7eb',
            bodyFont: {
              size: 13,
            },
            borderColor: 'rgba(255, 255, 255, 0.2)',
            borderWidth: 1,
            cornerRadius: 4,
            padding: 10,
            displayColors: true,
            boxPadding: 4,
            callbacks: {
              title: function(tooltipItems) {
                return `Time: ${tooltipItems[0].label}`;
              },
              // Add other callbacks as needed
            }
          },
        },
      },
      plugins: [enhancedLegendPlugin, noDataPlugin], // Add our custom legend plugin
    });
    
    // Initial update based on selected metrics
    this.updateChartLegends();
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
      lazy: false,
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
            backgroundColor: this.registeredServices.map(s => this.getServiceColor(s.name)),
            borderColor: 'rgba(65, 105, 225, 1)',
            borderWidth: 1,
            borderRadius: 4,
            hoverBackgroundColor: 'rgba(65, 105, 225, 1)',
          },
          {
            label: 'Call Count',
            data: Array(this.registeredServices.length).fill(0),
            backgroundColor: callCountGradient,
            borderColor: 'rgba(220, 20, 60, 1)',
            borderWidth: 1,
            borderRadius: 4,
            yAxisID: 'y1',
            hoverBackgroundColor: 'rgba(220, 20, 60, 1)',
          },
          {
            label: 'Error Rate (%)',
            data: this.registeredServices.map(s => 
              this.serviceMetricsMap.get(s.name)?.errorRate || 0
            ),
            yAxisID: 'y3',
            backgroundColor: 'rgba(255, 99, 132, 0.5)'
          },
          {
            label: 'Security Events',
            data: this.registeredServices.map(s => 
              this.serviceMetricsMap.get(s.name)?.securityEvents || 0
            ),
            yAxisID: 'y4',
            backgroundColor: 'rgba(255, 206, 86, 0.5)'
          }
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        animation: {
          duration: 1000,
          easing: 'easeOutQuart',
        },
        animations: {
          colors: {
            type: 'color',
            duration: 1000,
            easing: 'easeInOutQuad',
          },
          numbers: {
            type: 'number',
            duration: 800,
            delay: context => context.dataIndex * 100,
            easing: 'easeOutCubic',
          },
        },
        scales: {
          x: {
            title: { display: true, text: 'Time (seconds)' },
            ticks: {
              callback: value => `${value}s`,
              stepSize: 15,
              color: '#e5e7eb',
              maxRotation: 45,
              minRotation: 45,
            },
            grid: {
              display: false,
              color: 'rgba(255, 255, 255, 0.1)',
            },
          },
          y: {
            beginAtZero: true,
            title: {
              display: true,
              text: 'Avg Response Time (ms)',
              color: '#e5e7eb',
              font: {
                size: 14,
                weight: 'bold',
              },
            },
            grid: {
              color: 'rgba(255, 255, 255, 0.1)',
            },
            ticks: {
              color: '#e5e7eb',
              callback: function (value) {
                return value + ' ms';
              },
            },
          },
          y1: {
            position: 'right',
            beginAtZero: true,
            grid: {
              drawOnChartArea: false,
              color: 'rgba(255, 255, 255, 0.1)',
            },
            title: {
              display: true,
              text: 'Call Count',
              color: '#e5e7eb',
              font: {
                size: 14,
                weight: 'bold',
              },
            },
            ticks: {
              color: '#e5e7eb',
              precision: 0,
            },
          },
          y2: {
            position: 'right',
            beginAtZero: true,
            max: 100,
            grid: {
              drawOnChartArea: false,
            },
            title: {
              display: true,
              text: 'Success Rate (%)',
              color: '#e5e7eb',
              font: {
                size: 14,
                weight: 'bold',
              }
            },
            ticks: {
              color: '#e5e7eb',
              callback: (tickValue: string | number) => `${tickValue}%`
            }
          },
          y3: {
            position: 'right',
            beginAtZero: true,
            max: 100,
            title: {
              display: true,
              text: 'Error Rate (%)'
            }
          },
          y4: {
            position: 'right',
            beginAtZero: true,
            title: {
              display: true,
              text: 'Security Events'
            }
          }
        },
        plugins: {
          legend: {
            position: 'top',
            labels: {
              color: '#e5e7eb',
              font: {
                size: 12,
              },
              usePointStyle: true,
              pointStyle: 'rectRounded',
            },
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
              label: function (tooltipItem) {
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
              },
            },
          },
        },
      },
    });
  }

  protected getSuccessRateColor(rate: number): string {
    // Color gradient from red (0%) to green (100%)
    const red = Math.round(255 * (1 - rate / 100));
    const green = Math.round(255 * (rate / 100));
    return `${red}, ${green}, 0`;
  }

  private startStatisticsPolling(): void {
    if (this.statisticsInterval) {
      clearInterval(this.statisticsInterval);
    }
    this.statisticsInterval = setInterval(() => {
      if (this.isTabActive) {
        this.updateServiceStatistics();
      }
    }, this.METRICS_UPDATE_INTERVAL);
  }

  private updateServiceStatistics(): void {
    if (!this.isTabActive) return;
    
    // Limit the metrics to process
    const maxMetricsToProcess = 50;
    const activeServices = this.registeredServices.filter(s => s.active);
    const now = Date.now();
    
    // Process each service with throttling
    activeServices.forEach((service, index) => {
      setTimeout(() => {
        const recentMetrics = this.serviceMetrics
          .filter(m => 
            m.serviceName.toLowerCase() === service.name.toLowerCase() &&
            (now - m.timestamp.getTime()) < 60000 // Only look at last minute
          )
          .slice(-maxMetricsToProcess); // Limit number of metrics
        
        this.updateServiceMetricsForService(service, recentMetrics, now);
      }, index * 50); // Stagger updates
    });

    // Throttle chart updates
    if (!this._lastChartUpdate || (now - this._lastChartUpdate) > 2000) {
      this._lastChartUpdate = now;
      requestAnimationFrame(() => this.updateServiceMetricsChart());
    }
  }

  private updateServiceMetricsForService(service: any, metrics: ServiceCallMetric[], now: number): void {
    console.debug(`Updating metrics for ${service.name}`);
    
    // Calculate basic metrics
    if (metrics.length > 0) {
      const avgTime = metrics.reduce((sum, m) => sum + (m.duration || 0), 0) / metrics.length;
      const successCount = metrics.filter(m => m.status !== undefined && m.status >= 200 && m.status < 300).length;
      const successRate = (successCount / metrics.length) * 100;
      const throughput = metrics.length / 5;

      // Update service statistics with smooth transition
      this.updateServiceStats(service.name, {
        avgResponseTime: avgTime,
        callCount: throughput,
        successRate: successRate,
        lastUpdate: now
      });
    } else if (this.isSimulatingData) {
      // Generate simulated data
      this.updateServiceStats(service.name, {
        avgResponseTime: Math.random() * 200 + 50,
        callCount: Math.floor(Math.random() * 50),
        successRate: Math.random() * 30 + 70,
        lastUpdate: now
      });
    }
  }

  private updateServiceStats(serviceName: string, stats: any): void {
    const prevStats = this.serviceStatistics[serviceName];
    const smoothFactor = 0.3;
    
    this.serviceStatistics[serviceName] = {
      avgResponseTime: prevStats ? 
        this.smoothTransition(prevStats.avgResponseTime, stats.avgResponseTime, smoothFactor) : 
        stats.avgResponseTime,
      callCount: stats.callCount,
      successRate: prevStats ? 
        this.smoothTransition(prevStats.successRate, stats.successRate, smoothFactor) : 
        stats.successRate,
      lastUpdate: stats.lastUpdate
    };
  }

  private smoothTransition(oldValue: number, newValue: number, factor: number): number {
    return oldValue + (newValue - oldValue) * factor;
  }

  private adjustColorOpacity(color: string, opacity: number): string {
    if (color.startsWith('#')) {
      const r = parseInt(color.slice(1, 3), 16);
      const g = parseInt(color.slice(3, 5), 16);
      const b = parseInt(color.slice(5, 7), 16);
      return `rgba(${r}, ${g}, ${b}, ${opacity})`;
    }
    return color;
  }

  toggleDataSimulation(): void {
    this.isSimulatingData = !this.isSimulatingData;
    this.logger.info(`Admin dashboard: ${this.isSimulatingData ? 'Enabled' : 'Disabled'} data simulation`);

    if (this.isSimulatingData && this.isTabActive) {
      this.generateSampleApiCalls();
      this.resumeSimulation();
    } else {
      this.pauseSimulation();
    }
  }

  private pauseSimulation(): void {
    if (this.simulationInterval) {
      clearInterval(this.simulationInterval);
      this.simulationInterval = null;
    }
  }

  private resumeSimulation(): void {
    if (this.isSimulatingData && !this.simulationInterval) {
      this.addSimulatedApiCall();
    }
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

  clearLogs() {
    this.logger.clearLogs();
    
    // Reset log stats
    this.logStats = [
      { id: 1, icon: 'error', label: 'Errors', value: 0, color: 'red' },
      { id: 2, icon: 'warning', label: 'Warnings', value: 0, color: 'orange' },
      { id: 3, icon: 'info', label: 'Info', value: 0, color: 'blue' },
    ];
  }

  getServiceMetrics(): DisplayMetric[] {
    return this.serviceMetrics.map(metric => {
      const errorRate = metric.errorRate || 0;
      const authAttempts = metric.authAttempts || 0;
      const trend = Math.random() * 20 - 10; // Simulated trend between -10 and +10

      return {
        color: errorRate > 20 ? '#ef4444' : errorRate > 10 ? '#f59e0b' : '#10b981',
        icon: this.getMetricIcon(metric),
        label: this.getMetricLabel(metric),
        value: this.getMetricValue(metric),
        unit: this.getMetricUnit(metric),
        trend: trend
      };
    });
  }

  private getMetricIcon(metric: ServiceCallMetric): string {
    // Default icon based on status code
    if (!metric.status || metric.status >= 500) return 'error';
    if (metric.status >= 400) return 'warning';
    if (metric.status >= 300) return 'swap_horiz';
    return 'check_circle';
  }

  private getMetricLabel(metric: ServiceCallMetric): string {
    // Default label based on status code
    if (!metric.status || metric.status >= 500) return 'Server Error';
    if (metric.status >= 400) return 'Client Error';
    if (metric.status >= 300) return 'Redirect';
    return 'Success';
  }

  private getMetricValue(metric: ServiceCallMetric): number {
    // Use duration as the default metric value
    return metric.duration || 0;
  }

  private getMetricUnit(metric: ServiceCallMetric): string {
    // All metrics are time-based
    return 'ms';
  }

  getServiceStatistics(serviceName: string) {
    return this.serviceStatistics[serviceName];
  }

  get selectedLogLevelValue() {
    return this.selectedLogLevel;
  }

  get autoScrollValue() {
    return this.autoScroll;
  }

  get logStatsValue() {
    return this.logStats;
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
    
    // Handle special case: Don't allow removing the last metric
    if (idx > -1 && this.selectedMetrics.length > 1) {
      this.selectedMetrics.splice(idx, 1);
      this.logger.info(`Disabled ${metric} metric tracking`);
    } else if (idx === -1) {
      this.selectedMetrics.push(metric);
      this.logger.info(`Enabled ${metric} metric tracking`);
    } else {
      // If trying to remove the last metric, show feedback (could add a toast here)
      console.log('Cannot disable the last active metric');
    }
    
    this.updateChartLegends();
  }

  private updateChartLegends(): void {
    if (!this.systemMetricsChart) return;
    
    const metrics = this.selectedMetrics;
    
    // Configure Y axes based on selected metrics
    this.configureYAxes(metrics);
    
    // Update visibility of dataset based on selection
    this.systemMetricsChart.data.datasets.forEach((dataset: any, index: number) => {
      const metricType = index === 0 ? 'memory' : index === 1 ? 'cpu' : 'network';
      dataset.hidden = !metrics.includes(metricType);
    });
    
    // Apply the changes by updating the chart
    this.systemMetricsChart.update();
  }

  private configureYAxes(metrics: string[]): void {
    // Hide all Y axes by default
    this.systemMetricsChart.options.scales.y.display = false;
    this.systemMetricsChart.options.scales.y1.display = false;
    
    // Reset titles
    this.systemMetricsChart.options.scales.y.title.text = '';
    this.systemMetricsChart.options.scales.y1.title.text = '';
    
    // Reset axes colors
    this.systemMetricsChart.options.scales.y.title.color = '#e5e7eb';
    this.systemMetricsChart.options.scales.y.ticks.color = '#e5e7eb';
    this.systemMetricsChart.options.scales.y1.title.color = '#e5e7eb';
    this.systemMetricsChart.options.scales.y1.ticks.color = '#e5e7eb';
    
    if (metrics.length === 0) {
      // No metrics selected - show default
      this.systemMetricsChart.options.scales.y.display = true;
      this.systemMetricsChart.options.scales.y1.display = false;
      this.systemMetricsChart.options.scales.y.title.text = 'No metrics selected';
      return;
    }
    
    if (metrics.length === 1) {
      // Single metric selected - configure axis specifically
      const metric = metrics[0];
      
      if (metric === 'memory') {
        this.configureSingleMetricAxis('memory', 'Memory Usage (%)', '#3b82f6');
      } 
      else if (metric === 'cpu') {
        this.configureSingleMetricAxis('cpu', 'CPU Load (%)', '#10b981');
      } 
      else if (metric === 'network') {
        this.configureSingleMetricAxis('network', 'Network Latency (ms)', '#ef4444');
      }
    } 
    else if (metrics.length === 2) {
      // Two metrics selected - logical axis assignment
      this.configureDoubleMetricAxes(metrics);
    } 
    else if (metrics.length === 3) {
      // All three metrics selected - use standard configuration
      this.configureTripleMetricAxes();
    }
  }

  private configureSingleMetricAxis(metric: string, label: string, color: string): void {
    // When only one metric is active, make it the primary axis
    this.systemMetricsChart.options.scales.y.display = true;
    this.systemMetricsChart.options.scales.y1.display = false;
    
    this.systemMetricsChart.options.scales.y.title.text = label;
    this.systemMetricsChart.options.scales.y.title.color = color;
    this.systemMetricsChart.options.scales.y.ticks.color = color;
    
    // For Network metric specifically, change the label to be more descriptive
    if (metric === 'network') {
      this.systemMetricsChart.options.scales.y.title.text = 'Physical Response Time (ms)';
    }
    
    // Set appropriate Y axis IDs for datasets
    this.systemMetricsChart.data.datasets.forEach((dataset: any, index: number) => {
      dataset.yAxisID = 'y';  // For single metric, use primary Y axis
    });
  }

  private configureDoubleMetricAxes(metrics: string[]): void {
    // When two metrics are active, use both axes sensibly
    this.systemMetricsChart.options.scales.y.display = true;
    this.systemMetricsChart.options.scales.y1.display = true;
    
    // Determine which metrics are selected
    const hasMemory = metrics.includes('memory');
    const hasCpu = metrics.includes('cpu');
    const hasNetwork = metrics.includes('network');
    
    if (hasMemory && hasCpu) {
      this.systemMetricsChart.options.scales.y.title.text = 'CPU Load (%)';
      this.systemMetricsChart.options.scales.y1.title.text = 'Memory Usage (%)';
      this.systemMetricsChart.options.scales.y.title.color = '#10b981';
      this.systemMetricsChart.options.scales.y1.title.color = '#3b82f6';
      this.systemMetricsChart.options.scales.y.ticks.color = '#10b981';
      this.systemMetricsChart.options.scales.y1.ticks.color = '#3b82f6';
      
      this.systemMetricsChart.data.datasets[0].yAxisID = 'y1'; // Memory on right
      this.systemMetricsChart.data.datasets[1].yAxisID = 'y';  // CPU on left
      this.systemMetricsChart.data.datasets[2].yAxisID = 'y1'; // Network (not visible)
    } 
    else if (hasMemory && hasNetwork) {
      this.systemMetricsChart.options.scales.y.title.text = 'Memory Usage (%)';
      this.systemMetricsChart.options.scales.y1.title.text = 'Physical Response Time (ms)';
      this.systemMetricsChart.options.scales.y.title.color = '#3b82f6';
      this.systemMetricsChart.options.scales.y1.title.color = '#ef4444';
      this.systemMetricsChart.options.scales.y.ticks.color = '#3b82f6';
      this.systemMetricsChart.options.scales.y1.ticks.color = '#ef4444';
      
      this.systemMetricsChart.data.datasets[0].yAxisID = 'y';  // Memory on left
      this.systemMetricsChart.data.datasets[1].yAxisID = 'y';  // CPU (not visible)
      this.systemMetricsChart.data.datasets[2].yAxisID = 'y1'; // Network on right
    } 
    else if (hasCpu && hasNetwork) {
      this.systemMetricsChart.options.scales.y.title.text = 'CPU Load (%)';
      this.systemMetricsChart.options.scales.y1.title.text = 'Physical Response Time (ms)';
      this.systemMetricsChart.options.scales.y.title.color = '#10b981';
      this.systemMetricsChart.options.scales.y1.title.color = '#ef4444';
      this.systemMetricsChart.options.scales.y.ticks.color = '#10b981';
      this.systemMetricsChart.options.scales.y1.ticks.color = '#ef4444';
      
      this.systemMetricsChart.data.datasets[0].yAxisID = 'y';  // Memory (not visible)
      this.systemMetricsChart.data.datasets[1].yAxisID = 'y';  // CPU on left
      this.systemMetricsChart.data.datasets[2].yAxisID = 'y1'; // Network on right
    }
  }

  private configureTripleMetricAxes(): void {
    // All three metrics - use standard configuration
    this.systemMetricsChart.options.scales.y.display = true;
    this.systemMetricsChart.options.scales.y1.display = true;
    
    // Left axis for percentage metrics (CPU, Memory)
    this.systemMetricsChart.options.scales.y.title.text = 'CPU & Memory Usage (%)';
    this.systemMetricsChart.options.scales.y.title.color = '#ffffff';
    this.systemMetricsChart.options.scales.y.ticks.color = '#e5e7eb';
    
    // Right axis for physical metrics (network latency)
    this.systemMetricsChart.options.scales.y1.title.text = 'Response Time (ms)';
    this.systemMetricsChart.options.scales.y1.title.color = '#ef4444';
    this.systemMetricsChart.options.scales.y1.ticks.color = '#ef4444';
    
    // Reset datasets to default Y axes
    this.systemMetricsChart.data.datasets[0].yAxisID = 'y';  // Memory on percentage axis
    this.systemMetricsChart.data.datasets[1].yAxisID = 'y';  // CPU on percentage axis
    this.systemMetricsChart.data.datasets[2].yAxisID = 'y1'; // Network on physical metrics axis
  }

  // Add a method to generate sample API calls for demonstration
  private generateSampleApiCalls(): void {
    const now = Date.now();
    const sampleCalls: ServiceCallMetric[] = [
      this.createDefaultMetric('AuthenticationService', 'POST', '/api/auth/login', 120.5, 200, now - 5000),
      this.createDefaultMetric('UserService', 'GET', '/api/users/profile', 85.2, 200, now - 4000),
      // ...continue with other sample calls using createDefaultMetric
    ];

    this.serviceMetrics = sampleCalls;
    this.dataSource.data = this.serviceMetrics;

    if (this.isSimulatingData) {
      setTimeout(() => {
        this.addSimulatedApiCall();
      }, 3000);
    }
  }

  // Method to add simulated API calls periodically
  private addSimulatedApiCall(): void {
    if (!this.isSimulatingData || !this.isTabActive) return;

    // Limit the size of the metrics array
    if (this.serviceMetrics.length > 100) {
      // Remove half of the older entries
      this.serviceMetrics = this.serviceMetrics.slice(-50);
      this.dataSource.data = this.serviceMetrics;
    }

    // Create fewer random API calls
    const services = ['AuthenticationService', 'UserService', 'AdminService'];
    const methods = ['GET', 'POST'];
    const endpoints = ['/api/auth/validate', '/api/users/profile', '/api/admin/status'];
    const statusCodes = [200, 201, 204];

    const newCall = this.createDefaultMetric(
      services[Math.floor(Math.random() * services.length)],
      methods[Math.floor(Math.random() * methods.length)],
      endpoints[Math.floor(Math.random() * endpoints.length)],
      Math.random() * 200 + 50, // Less range
      statusCodes[Math.floor(Math.random() * statusCodes.length)],
      Date.now()
    );

    this.serviceMetrics.push(newCall);
    this.dataSource.data = this.serviceMetrics;

    // Don't update chart on every call - it's too expensive
    // Let the regular polling handle chart updates

    // Use longer interval (8-12 seconds)
    this.simulationInterval = setTimeout(() => {
      this.addSimulatedApiCall();
    }, 8000 + Math.random() * 4000);
  }

  // Method to handle row selection
  selectApiCall(call: ServiceCallMetric): void {
    this.selectedApiCall = call;
  }

  getServiceColor(serviceName: string): string {
    return this.serviceColors[serviceName] || '#808080';
  }

  // Add method to get service health status
  getServiceHealth(serviceName: string): string {
    const metrics = this.serviceMetricsMap.get(serviceName);
    if (!metrics) return 'unknown';

    if (metrics.errorRate > 20) return 'critical';
    if (metrics.errorRate > 10) return 'warning';
    if (metrics.securityEvents > 5) return 'warning';
    return 'healthy';
  }

  private initializeServiceMonitoring(): void {
    console.debug('Initializing service monitoring');
    
    // If we're already monitoring, don't set up multiple intervals
    if (this.statisticsInterval) {
      console.debug('Service monitoring already initialized');
      return;
    }

    // Use requestAnimationFrame for initial load to prevent blocking UI
    requestAnimationFrame(() => {
      // Single lightweight update without chart refresh
      this.updateServiceStatsLite();
      
      // Set up polling with longer interval and better error handling
      this.statisticsInterval = window.setInterval(() => {
        if (!this.isTabActive) {
          console.debug('Tab inactive, skipping update');
          return;
        }

        const startTime = performance.now();
        
        try {
          // Use the lightweight version for regular updates
          this.updateServiceStatsLite();
          
          const duration = performance.now() - startTime;
          if (duration > 100) {
            const now = Date.now();
            // Only log warnings every 30 seconds to reduce spam
            if (now - this.lastPerformanceWarning > 30000) {
              this.lastPerformanceWarning = now;
              this.performanceIssueCount++;
              console.warn(`⚠️ Service monitoring performance issue #${this.performanceIssueCount} - Update took ${duration.toFixed(2)}ms`);
            }
          }
        } catch (error) {
          console.error('Error in service monitoring update:', error);
          // If we encounter too many errors, disable simulation mode
          if (this.isSimulatingData && this.performanceIssueCount > 5) {
            console.error('Too many errors, disabling simulation mode');
            this.isSimulatingData = false;
            this.pauseSimulation();
          }
        }
      }, this.METRICS_UPDATE_INTERVAL);
    });
  }

  // Add a lightweight version of the stats update that doesn't trigger heavy chart updates
  private updateServiceStatsLite(): void {
    if (!this.isTabActive) return;
    
    // Only process active services we need
    const activeServices = this.registeredServices
      .filter(s => s.active)
      .slice(0, 5); // Limit to 5 most important services for performance
    
    const now = Date.now();
    
    // Update services directly without chunking
    activeServices.forEach(service => {
      // Get only recent and minimal metrics data
      const recentMetrics = this.serviceMetrics
        .filter(m => 
          m.serviceName.toLowerCase() === service.name.toLowerCase() &&
          (now - m.timestamp.getTime()) < 30000 // Only look at last 30 seconds
        )
        .slice(-10); // Only use the 10 most recent calls
      
      if (recentMetrics.length > 0) {
        const avgTime = recentMetrics.reduce((sum, m) => sum + (m.duration || 0), 0) / recentMetrics.length;
        const successCount = recentMetrics.filter(m => m.status !== undefined && m.status < 400).length;
        const successRate = recentMetrics.length ? (successCount / recentMetrics.length) * 100 : 100;
        
        // Minimal stats update
        this.serviceStatistics[service.name] = {
          avgResponseTime: avgTime,
          callCount: recentMetrics.length,
          successRate: successRate,
          lastUpdate: now
        };
      } else if (this.isSimulatingData) {
        // Minimal simulation with less frequency
        this.serviceStatistics[service.name] = {
          avgResponseTime: Math.random() * 100 + 20,
          callCount: Math.floor(Math.random() * 10),
          successRate: 85 + Math.random() * 15,
          lastUpdate: now
        };
      }
    });
    
    // Only update chart if it's been a while (3+ seconds)
    if (this._lastChartUpdate && (now - this._lastChartUpdate) < 3000) {
      return; // Skip chart update if too recent
    }
    
    this._lastChartUpdate = now;
    
    // Use requestIdleCallback or setTimeout with zero delay
    // This schedules the update when the browser isn't busy
    if ('requestIdleCallback' in window) {
      (window as any).requestIdleCallback(() => {
        if (this.isTabActive) this.updateServiceMetricsChart();
      });
    } else {
      setTimeout(() => {
        if (this.isTabActive) this.updateServiceMetricsChart();
      }, 0);
    }
  }

  private _lastChartUpdate = 0;

  // Optimize chart update to be less intensive
  private updateServiceMetricsChart(): void {
    if (!this.serviceMetricsChart || !this.isTabActive) return;

    const activeServices = this.registeredServices.filter(s => s.active).slice(0, 6); // Limit displayed services
    const stats = this.serviceStatistics;
    
    // Prepare minimal data for chart
    const chartData = {
      labels: activeServices.map(s => s.name),
      datasets: [{
        label: 'Response Time (ms)',
        data: activeServices.map(s => stats[s.name]?.avgResponseTime || 0),
        backgroundColor: activeServices.map(s => this.getServiceColor(s.name)),
        borderWidth: 1,
        yAxisID: 'y'
      }]
    };

    // Update with no animation for better performance
    this.serviceMetricsChart.data = chartData;
    this.serviceMetricsChart.update('none');
  }

  // Generate sparkline SVG for API service
  generateSparklineSVG(timelineData: any[]): string {
    if (!timelineData || timelineData.length < 2) {
      return '';
    }
    
    const width = 100;
    const height = 30;
    const padding = 2;
    const availableWidth = width - (padding * 2);
    const availableHeight = height - (padding * 2);
    
    // Get time range and response time range
    const timeValues = timelineData.map(d => d.timestamp.getTime());
    const responseValues = timelineData.map(d => d.responseTime);
    
    const minTime = Math.min(...timeValues);
    const maxTime = Math.max(...timeValues);
    const minResponse = Math.min(...responseValues);
    const maxResponse = Math.max(...responseValues);
    
    // Generate points for the sparkline
    const points = timelineData.map((d, i) => {
      const x = padding + (availableWidth * (d.timestamp.getTime() - minTime) / (maxTime - minTime));
      const y = height - padding - (availableHeight * (d.responseTime - minResponse) / (maxResponse - minResponse));
      return `${x},${y}`;
    }).join(' ');
    
    // Generate the SVG
    return `
      <svg width="${width}" height="${height}" class="sparkline">
        <polyline 
          fill="none" 
          stroke="url(#sparklineGradient)" 
          stroke-width="1.5" 
          points="${points}" 
        />
        <defs>
            <stop offset="0%" style="stop-color:#3b82f6;stop-opacity:0.8" />
            <stop offset="50%" style="stop-color:#10b981;stop-opacity:0.8" />
            <stop offset="100%" style="stop-color:#ef4444;stop-opacity:0.8" />
          </linearGradient>
        </defs>
      </svg>
    `;
  }

  // Generate detailed sparkline SVG - enhanced version of existing function
  generateDetailedSparklineSVG(timelineData: any[]): string {
    if (!timelineData || timelineData.length < 2) {
      return this.generateEmptySparkline();
    }
    
    const width = 250;
    const height = 80;
    const padding = 5;
    const innerWidth = width - 2 * padding;
    const innerHeight = height - 2 * padding;
    
    // Extract response times and normalize them
    const responseTimes = timelineData.map(data => data.responseTime);
    const maxResponseTime = Math.max(...responseTimes, 1);
    const normalizedResponseTimes = responseTimes.map(time => 1 - Math.min(time / maxResponseTime, 1));
    
    // Extract status codes
    const statuses = timelineData.map(data => data.status);
    
    // Get time range and response time range
    const timeValues = timelineData.map(d => d.timestamp.getTime());
    const minTime = Math.min(...timeValues);
    const maxTime = Math.max(...timeValues);
    const minResponse = 0; // Start at 0 for better visualization
    const maxResponse = Math.max(...responseTimes) * 1.1; // Add 10% headroom
    
    // Generate path for response time line
    const pathData = timelineData.map((d, index) => {
      const x = padding + (innerWidth * (d.timestamp.getTime() - minTime) / (maxTime - minTime));
      const y = height - padding - (innerHeight * (d.responseTime - minResponse) / (maxResponse - minResponse));
      return `${x},${y}`;
    }).join(' ');
    
    // Generate dots for status codes
    let dotsHtml = '';
    timelineData.forEach((d, index) => {
      const x = padding + (innerWidth * (d.timestamp.getTime() - minTime) / (maxTime - minTime));
      const y = height - padding - (innerHeight * (d.responseTime - minResponse) / (maxResponse - minResponse));
      const status = statuses[index];
      
      // Determine color based on status code
      let dotColor = '#10B981'; // Green for 2xx
      if (status >= 400) {
        dotColor = '#EF4444'; // Red for 4xx, 5xx
      } else if (status >= 300) {
        dotColor = '#F59E0B'; // Yellow for 3xx
      }
      
      dotsHtml += `<circle cx="${x}" cy="${y}" r="3" fill="${dotColor}" stroke="rgba(255,255,255,0.3)" stroke-width="1"></circle>`;
    });
    
    // Generate area fill
    const areaData = pathData + ` L ${padding + innerWidth},${height - padding} L ${padding},${height - padding} Z`;
    
    // Create the SVG
    const svg = `
      <svg width="${width}" height="${height}" class="sparkline-detailed" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="areaGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stop-color="rgba(59, 130, 246, 0.5)" />
            <stop offset="100%" stop-color="rgba(59, 130, 246, 0)" />
          </linearGradient>
        </defs>
        <path d="${areaData}" fill="url(#areaGradient)" />
        <path d="${pathData}" fill="none" stroke="#3B82F6" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
        ${dotsHtml}
      </svg>
    `;
    
    return svg;
  }

  // Generate empty sparkline when no data is available
  private generateEmptySparkline(): string {
    const width = 250;
    const height = 80;
    
    return `
      <svg width="${width}" height="${height}" class="sparkline-detailed empty" xmlns="http://www.w3.org/2000/svg">
        <text x="${width/2}" y="${height/2}" text-anchor="middle" fill="#9CA3AF" font-size="12">No data available</text>
      </svg>
    `;
  }

  // Method to monitor API endpoints via logs instead of direct service tracking
  private monitorApiEndpoints(): void {
    this.apiLogsSubscription = this.apiLogger.getLogStream().subscribe(logEntry => {
      if (!logEntry) return;
      
      // Extract endpoint path from URL
      const urlObj = new URL(logEntry.request.url, window.location.origin);
      const endpoint = urlObj.pathname;
      
      // Get HTTP method
      const method = logEntry.request.method || 'GET';
      
      // Calculate response time
      const responseTime = logEntry.responseTime || 0;
      
      // Get status code
      const statusCode = logEntry.response?.status || 0;
      
      // Get current timestamp
      const timestamp = Date.now();
      
      // Initialize endpoint data if it doesn't exist
      if (!this.endpointLogs[endpoint]) {
        this.endpointLogs[endpoint] = {
          path: endpoint,
          method: method,
          lastContacted: new Date(),
          lastPing: new Date(),
          status: statusCode >= 200 && statusCode < 400 ? 'active' : 'error',
          hitCount: 0,
          successCount: 0,
          errorCount: 0,
          avgResponseTime: 0,
          firstSeen: new Date(),
          timelineData: []
        };
      }
      
      // Update endpoint data
      const endpointLog = this.endpointLogs[endpoint];
      endpointLog.hitCount++;
      endpointLog.lastContacted = new Date();
      endpointLog.method = method; // Update method in case it changed
      
      // Update success/error counts
      if (statusCode >= 200 && statusCode < 400) {
        endpointLog.successCount++;
        endpointLog.status = 'active';
      } else {
        endpointLog.errorCount++;
        endpointLog.status = 'error';
      }
      
      // Update average response time with rolling average
      endpointLog.avgResponseTime = 
        (endpointLog.avgResponseTime * (endpointLog.hitCount - 1) + responseTime) / endpointLog.hitCount;
      
      // Add to timeline data (keep last 50 entries)
      endpointLog.timelineData.push({
        timestamp: new Date(timestamp), // Convert to Date object to match the type
        responseTime,
        status: statusCode,
        requestBody: logEntry.request.body,
        responseBody: logEntry.response?.body,
        headers: logEntry.request.headers
      });
      
      // Limit timeline data to last 50 entries
      if (endpointLog.timelineData.length > 50) {
        endpointLog.timelineData.shift();
      }
    });
  }
  
  // Update method to work with endpointLogs
  // Calculate success rate percentage
  getSuccessRate(serviceInfo: ApiEndpointLog): number {
    if (!serviceInfo || serviceInfo.hitCount === 0) {
      return 100;
    }
    return (serviceInfo.successCount / serviceInfo.hitCount) * 100;
  }
  
  // Get minimum response time for an endpoint
  getMinResponseTime(endpointKey: string): number {
    if (!this.endpointLogs[endpointKey] || 
        !this.endpointLogs[endpointKey].timelineData || 
        this.endpointLogs[endpointKey].timelineData.length === 0) {
      return 0;
    }
    
    const timeline = this.endpointLogs[endpointKey].timelineData;
    return Math.min(...timeline.map(item => item.responseTime));
  }

  // Get maximum response time for an endpoint
  getMaxResponseTime(endpointKey: string): number {
    if (!this.endpointLogs[endpointKey] || 
        !this.endpointLogs[endpointKey].timelineData || 
        this.endpointLogs[endpointKey].timelineData.length === 0) {
      return 0;
    }
    
    const timeline = this.endpointLogs[endpointKey].timelineData;
    return Math.max(...timeline.map(item => item.responseTime));
  }
  
  // Get total success count across all endpoints
  getTotalSuccessCount(): number {
    return Object.values(this.endpointLogs).reduce((total, endpoint) => {
      return total + (endpoint.successCount || 0);
    }, 0);
  }

  // Get total hit count across all endpoints
  getTotalHitCount(): number {
    return Object.values(this.endpointLogs).reduce((total, endpoint) => {
      return total + (endpoint.hitCount || 0);
    }, 0);
  }

  // Get total error count across all endpoints
  getTotalErrorCount(): number {
    return Object.values(this.endpointLogs).reduce((total, endpoint) => {
      return total + (endpoint.errorCount || 0);
    }, 0);
  }
  
  // Toggle endpoint details expansion
  toggleEndpointDetails(endpointKey: string): void {
    if (this.expandedEndpoint === endpointKey) {
      this.expandedEndpoint = null;
    } else {
      this.expandedEndpoint = endpointKey;
    }
  }
  
  // Get color for endpoint method
  getEndpointMethodColor(method: string):string {
    switch (method.toUpperCase()) {
      case 'GET': return '#10b981'; // Green
      case 'POST': return '#3b82f6'; // Blue
      case 'PUT': return '#f59e0b'; // Orange
      case 'DELETE': return '#ef4444'; // Red
      case 'PATCH': return '#8b5cf6'; // Purple
      default: return '#6b7280'; // Gray
    }
  }
  
  // Get icon for endpoint method
  getEndpointMethodIcon(method: string): string {
    switch (method.toUpperCase()) {
      case 'GET': return 'download';
      case 'POST': return 'add_circle';
      case 'PUT': return 'update';
      case 'DELETE': return 'delete';
      case 'PATCH': return 'edit';
      default: return 'api';
    }
  }
  
  // Get status color based on success rate
  getStatusColor(successRate: number): string {
    if (successRate >= 95) return '#10b981'; // Green for high success rate
    if (successRate >= 80) return '#f59e0b'; // Orange for medium success rate
    return '#ef4444'; // Red for low success rate
  }
  
  // Get status class for service
  getServiceStatusClass(endpointKey: string): string {
    if (!this.endpointLogs[endpointKey]) return 'status-unknown';
    
    const successRate = this.getSuccessRate(this.endpointLogs[endpointKey]);
    if (successRate >= 95) return 'status-healthy';
    if (successRate >= 80) return 'status-warning';
    return 'status-error';
  }
  
  // Get service status text
  getServiceStatusText(endpointKey: string): string {
    if (!this.endpointLogs[endpointKey]) return 'Unknown';
    
    const successRate = this.getSuccessRate(this.endpointLogs[endpointKey]);
    if (successRate >= 95) return 'Healthy';
    if (successRate >= 80) return 'Warning';
    return 'Error';
  }

  // Add these methods that were referenced in the template
  toggleTimestampFormat(): void {
    this.timestampFormat = this.timestampFormat === 'shortTime' ? 'mediumTime' : 'shortTime';
  }

  getEndpointDetails(endpointKey: string): any {
    if (!this.endpointLogs[endpointKey]) {
      return null;
    }
    
    // Get the last entry in the timeline data
    const timelineData = this.endpointLogs[endpointKey].timelineData;
    if (timelineData && timelineData.length > 0) {
      return timelineData[timelineData.length - 1];
    }
    
    return null;
  }

  getFormattedHeaders(headers: any): string {
    if (!headers) {
      return 'No headers available';
    }
    
    try {
      return JSON.stringify(headers, null, 2);
    } catch (error) {
      return 'Unable to format headers';
    }
  }

  getFormattedJson(data: any): string {
    if (!data) {
      return 'No data available';
    }
    
    try {
      return JSON.stringify(data, null, 2);
    } catch (error) {
      return 'Unable to format data';
    }
  }
}
