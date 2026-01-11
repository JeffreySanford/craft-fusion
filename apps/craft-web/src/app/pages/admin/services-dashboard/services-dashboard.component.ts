import { Component, OnInit, AfterViewInit, OnDestroy, ViewChild, ElementRef } from '@angular/core';
import Chart from 'chart.js/auto';
import { ServicesDashboardService } from './services-dashboard.service';
export interface ServiceInfo {
  id: string;
  name: string;
  status: 'active' | 'inactive' | 'error';
  description: string;
  lastActivity: Date | null;
  responseTime: number;
  type: string;
  endpoints: number;
  memoryUsage: number;
}

@Component({
  selector: 'app-services-dashboard',
  templateUrl: './services-dashboard.component.html',
  styleUrls: ['./services-dashboard.component.scss'],
  // This component is part of the Admin NgModule (AOT requires non-standalone here)
  standalone: false,
})
export class ServicesDashboardComponent implements OnInit, AfterViewInit, OnDestroy {
  services: ServiceInfo[] = [];
  coreServices: ServiceInfo[] = [];
  featureServices: ServiceInfo[] = [];
  thirdPartyServices: ServiceInfo[] = [];

  get activeServicesCount(): number {
    return this.services.filter(s => s.status === 'active').length;
  }

  get errorServicesCount(): number {
    return this.services.filter(s => s.status === 'error').length;
  }

  get inactiveServicesCount(): number {
    return this.services.filter(s => s.status === 'inactive').length;
  }

  displayedColumns: string[] = ['name', 'status', 'lastActivity', 'responseTime', 'endpoints', 'memoryUsage'];
  @ViewChild('serviceMetricsCanvas') serviceMetricsCanvas!: ElementRef<HTMLCanvasElement>;
  private serviceChart: Chart | null = null;
  private refreshIntervalId: number | undefined;

  constructor(private servicesDashboard: ServicesDashboardService) {}

  ngOnInit(): void {
    this.loadServices();
  }

  ngAfterViewInit(): void {
    this.createChart();
    this.refreshIntervalId = window.setInterval(() => this.refreshChartData(), 2000);
  }

  ngOnDestroy(): void {
    if (this.refreshIntervalId !== undefined) {
      clearInterval(this.refreshIntervalId);
      this.refreshIntervalId = undefined;
    }
    if (this.serviceChart) {
      this.serviceChart.destroy();
      this.serviceChart = null;
    }
  }

  loadServices(): void {
    this.services = [
      {
        id: '1',
        name: 'Authentication Service',
        status: 'active',
        description: 'Manages user authentication',
        lastActivity: new Date(),
        responseTime: 120,
        type: 'core',
        endpoints: 6,
        memoryUsage: 42,
      },
    ];

    this.coreServices = this.services.filter(s => s.type === 'core');
    this.featureServices = this.services.filter(s => s.type === 'feature');
    this.thirdPartyServices = this.services.filter(s => s.type === 'third-party');
  }

  getStatusClass(status: string): string {
    switch (status) {
      case 'active':
        return 'status-active';
      case 'error':
        return 'status-error';
      case 'inactive':
        return 'status-inactive';
      default:
        return '';
    }
  }

  formatLastActivity(date: Date | null): string {
    if (!date) return 'Never';
    return date.toLocaleString();
  }

  private createChart(): void {
    try {
      const canvas = this.serviceMetricsCanvas.nativeElement;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      this.serviceChart = new Chart(ctx, {
        type: 'bar',
        data: this.servicesDashboard.buildChartDataForServices(6) as any,
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { display: true },
          },
          scales: {
            x: { display: true },
            y: { beginAtZero: true },
          },
        },
      });
    } catch (e) {
      console.error('Failed to create service metrics chart', e);
    }
  }

  private refreshChartData(): void {
    if (!this.serviceChart) return;
    const data = this.servicesDashboard.buildChartDataForServices(6) as any;
    this.serviceChart.data = data;
    this.serviceChart.update('none' as any);
  }
}
