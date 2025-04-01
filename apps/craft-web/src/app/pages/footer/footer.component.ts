import { Component, OnInit, OnDestroy, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import { Subscription } from 'rxjs';
import { ThemeService } from '../../common/services/theme.service';
import { LayoutService } from '../../common/services/layout.service';
import { ApiService } from '../../common/services/api.service';
import { PerformanceMetricsService } from '../../common/services/performance-metrics.service';
import { environment } from '../../../environments/environment';
import Chart from 'chart.js/auto';

@Component({
  selector: 'app-footer',
  templateUrl: './footer.component.html',
  styleUrls: ['./footer.component.scss'],
  standalone: false
})
export class FooterComponent implements OnInit, OnDestroy, AfterViewInit {
  @ViewChild('cpuChart') cpuChartRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('memoryChart') memoryChartRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('networkChart') networkChartRef!: ElementRef<HTMLCanvasElement>;
  
  isExpanded = false;
  currentTheme = 'light-theme';
  currentYear = new Date().getFullYear();
  appVersion = environment.appVersion || '1.0.0';
  apiVersion = '1.0.0';
  environment = environment.production ? 'Production' : 'Development';
  lastUpdated = new Date();
  
  // System stats
  cpuLoad = 0;
  memoryUsage = 0;
  networkUtilization = 0;
  activeUsers = 0;
  uptimeDisplay = '0d 0h 0m';
  systemStatus = 'Operational';
  
  // Charts
  cpuChart: Chart | null = null;
  memoryChart: Chart | null = null;
  networkChart: Chart | null = null;
  
  private themeSubscription: Subscription | null = null;
  private metricsSubscription: Subscription | null = null;
  private chartDataPoints = 10;
  private cpuData: number[] = Array(this.chartDataPoints).fill(0);
  private memoryData: number[] = Array(this.chartDataPoints).fill(0);
  private networkData: number[] = Array(this.chartDataPoints).fill(0);
  
  constructor(
    private themeService: ThemeService,
    private layoutService: LayoutService,
    private apiService: ApiService,
    private metricsService: PerformanceMetricsService
  ) {}
  
  ngOnInit() {
    this.themeSubscription = this.themeService.currentTheme$.subscribe(theme => {
      this.currentTheme = theme;
    });
    
    // Subscribe to system metrics
    this.metricsSubscription = this.metricsService.getMetricsUpdates().subscribe(metrics => {
      // Update stats
      this.cpuLoad = metrics.cpuUsage;
      this.memoryUsage = metrics.memoryUsage;
      this.networkUtilization = metrics.networkUtilization;
      this.activeUsers = metrics.activeUsers;
      this.systemStatus = metrics.systemStatus;
      this.uptimeDisplay = this.formatUptime(metrics.uptime);
      
      // Update chart data
      this.updateChartData(metrics.cpuUsage, metrics.memoryUsage, metrics.networkUtilization);
    });
    
    // Start with random data in development mode
    if (!environment.production) {
      this.simulateMetrics();
    }
  }
  
  ngAfterViewInit() {
    // Initialize charts after view is ready
    setTimeout(() => {
      if (this.isExpanded) {
        this.initializeCharts();
      }
    }, 100);
  }
  
  ngOnDestroy() {
    if (this.themeSubscription) {
      this.themeSubscription.unsubscribe();
    }
    if (this.metricsSubscription) {
      this.metricsSubscription.unsubscribe();
    }
    
    // Destroy charts
    this.destroyCharts();
  }
  toggleFooter(): void {
    this.isExpanded = !this.isExpanded;
    this.layoutService.setFooterExpansion(this.isExpanded);
    
    // Initialize or destroy charts based on expanded state
    if (this.isExpanded) {
      setTimeout(() => this.initializeCharts(), 100);
    } else {
      this.destroyCharts();
    }
  }
  
  toggleExpansion(): void {
    this.isExpanded = !this.isExpanded;
    this.layoutService.setFooterExpansion(this.isExpanded);
  }
  
  onExpandClick(): void {
    this.isExpanded = !this.isExpanded;
    this.layoutService.setFooterExpansion(this.isExpanded);
  }
  
  getStatusClass() {
    switch(this.systemStatus.toLowerCase()) {
      case 'operational':
      case 'online':
      case 'healthy':
        return 'status-healthy';
      case 'degraded':
      case 'warning':
        return 'status-warning';
      case 'critical':
      case 'offline':
      case 'error':
        return 'status-critical';
      default:
        return '';
    }
  }
  
  getIconClass() {
    switch(this.systemStatus.toLowerCase()) {
      case 'operational':
      case 'online':
      case 'healthy':
        return 'status-icon-healthy';
      case 'degraded':
      case 'warning':
        return 'status-icon-warning';
      case 'critical':
      case 'offline':
      case 'error':
        return 'status-icon-critical';
      default:
        return '';
    }
  }
  
  private initializeCharts() {
    if (!this.isExpanded) return;
    
    // Clean up existing charts first
    this.destroyCharts();
    
    // Make sure chart elements are available
    if (
      !this.cpuChartRef?.nativeElement || 
      !this.memoryChartRef?.nativeElement || 
      !this.networkChartRef?.nativeElement
    ) {
      return;
    }
    
    const chartOptions = {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        x: { display: false },
        y: { 
          display: false,
          min: 0,
          max: 100,
          suggestedMax: 100
        }
      },
      plugins: {
        legend: { display: false }
      },
      elements: {
        line: {
          tension: 0.4,
          borderWidth: 2
        },
        point: {
          radius: 0
        }
      },
      animation: {
        duration: 600
      }
    };
    
    const labels = Array(this.chartDataPoints).fill('');
    
    // CPU Chart
    const cpuCtx = this.cpuChartRef.nativeElement.getContext('2d');
    this.cpuChart = new Chart(cpuCtx!, {
      type: 'line',
      data: {
        labels,
        datasets: [{
          data: this.cpuData,
          borderColor: this.getChartColor('cpu'),
          backgroundColor: this.getChartBackgroundColor('cpu'),
          fill: true
        }]
      },
      options: chartOptions
    });
    
    // Memory Chart
    const memCtx = this.memoryChartRef.nativeElement.getContext('2d');
    this.memoryChart = new Chart(memCtx!, {
      type: 'line',
      data: {
        labels,
        datasets: [{
          data: this.memoryData,
          borderColor: this.getChartColor('memory'),
          backgroundColor: this.getChartBackgroundColor('memory'),
          fill: true
        }]
      },
      options: chartOptions
    });
    
    // Network Chart
    const netCtx = this.networkChartRef.nativeElement.getContext('2d');
    this.networkChart = new Chart(netCtx!, {
      type: 'line',
      data: {
        labels,
        datasets: [{
          data: this.networkData,
          borderColor: this.getChartColor('network'),
          backgroundColor: this.getChartBackgroundColor('network'),
          fill: true
        }]
      },
      options: chartOptions
    });
  }
  
  private destroyCharts() {
    if (this.cpuChart) {
      this.cpuChart.destroy();
      this.cpuChart = null;
    }
    if (this.memoryChart) {
      this.memoryChart.destroy();
      this.memoryChart = null;
    }
    if (this.networkChart) {
      this.networkChart.destroy();
      this.networkChart = null;
    }
  }
  
  private updateChartData(cpu: number, memory: number, network: number) {
    // Update data arrays
    this.cpuData.push(cpu);
    this.cpuData.shift();
    
    this.memoryData.push(memory);
    this.memoryData.shift();
    
    this.networkData.push(network);
    this.networkData.shift();
    
    // Update charts if they exist
    if (this.cpuChart) {
      this.cpuChart.data.datasets[0].data = [...this.cpuData];
      this.cpuChart.update('none');
    }
    
    if (this.memoryChart) {
      this.memoryChart.data.datasets[0].data = [...this.memoryData];
      this.memoryChart.update('none');
    }
    
    if (this.networkChart) {
      this.networkChart.data.datasets[0].data = [...this.networkData];
      this.networkChart.update('none');
    }
  }
  
  private getChartColor(type: string): string {
    if (this.currentTheme === 'dark-theme') {
      switch(type) {
        case 'cpu': return '#E91E63';
        case 'memory': return '#2196F3';
        case 'network': return '#4CAF50';
        default: return '#FFFFFF';
      }
    } else {
      switch(type) {
        case 'cpu': return '#D32F2F';
        case 'memory': return '#1976D2';
        case 'network': return '#388E3C';
        default: return '#000000';
      }
    }
  }
  
  private getChartBackgroundColor(type: string): string {
    if (this.currentTheme === 'dark-theme') {
      switch(type) {
        case 'cpu': return 'rgba(233, 30, 99, 0.2)';
        case 'memory': return 'rgba(33, 150, 243, 0.2)';
        case 'network': return 'rgba(76, 175, 80, 0.2)';
        default: return 'rgba(255, 255, 255, 0.2)';
      }
    } else {
      switch(type) {
        case 'cpu': return 'rgba(211, 47, 47, 0.2)';
        case 'memory': return 'rgba(25, 118, 210, 0.2)';
        case 'network': return 'rgba(56, 142, 60, 0.2)';
        default: return 'rgba(0, 0, 0, 0.2)';
      }
    }
  }
  
  private formatUptime(seconds: number): string {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    
    return `${days}d ${hours}h ${minutes}m`;
  }
  
  private simulateMetrics() {
    // Create random data for development testing
    setInterval(() => {
      this.cpuLoad = Math.floor(Math.random() * 60) + 20; // 20-80%
      this.memoryUsage = Math.floor(Math.random() * 40) + 30; // 30-70%
      this.networkUtilization = Math.floor(Math.random() * 60) + 20; // 20-80%
      this.activeUsers = Math.floor(Math.random() * 100) + 50; // 50-150 users
      
      // Update charts
      this.updateChartData(this.cpuLoad, this.memoryUsage, this.networkUtilization);
    }, 2000);
  }
}