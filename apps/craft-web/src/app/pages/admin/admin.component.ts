import { Component, OnInit, Inject, ElementRef, ViewChild, inject } from '@angular/core';
import { MatPaginator } from '@angular/material/paginator';
import { MatTableDataSource } from '@angular/material/table';
import { Subscription } from 'rxjs';
import { Router } from '@angular/router';
import { LoggerService, ServiceCallMetric } from '../../common/services/logger.service';
import { DataSimulationService } from '../../common/services/data-simulation.service';
import { ServicesDashboardService } from './services-dashboard/services-dashboard.service';
import { AdminHelperService } from './admin-shared/admin-helper.service';
import { AuthenticationService } from '../../common/services/authentication.service';
import { trigger, state, style, transition, animate } from '@angular/animations';
import { SocketClientService } from '../../common/services/socket-client.service';

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
  ],
})
export class AdminComponent implements OnInit {
  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild('serviceMetricsChart') serviceMetricsChartRef?: ElementRef;
  @ViewChild('systemMetricsChart') systemMetricsChartRef?: ElementRef;
  @ViewChild('tabGroup') tabGroup: any;

  public autoScroll = true;
  public navigator = window.navigator;

  // logStats moved to LogsDashboard; handled by logs component/service
  public selectedMetrics: string[] = ['memory', 'cpu', 'network'];
  public isSimulatingData = false;
  public selectedApiCall: ServiceCallMetric | null = null;
  public selectedTab = 0;
  public selectedLogLevel = 'all';
  public dataSource = new MatTableDataSource<ServiceCallMetric>([]);
  public displayedColumns: string[] = ['service', 'method', 'url', 'duration', 'status'];

  private serviceMetricsSubscription!: Subscription;

  private statisticsInterval: number | undefined;
  private systemMetricsChart: any;
  private serviceMetricsChart: any;
  private isTabActive = true;

  protected serviceStatistics: { [key: string]: any } = {};
  private readonly METRICS_UPDATE_INTERVAL = 15000;

  public expandedEndpoint: string | null = null;
  public timestampFormat = 'shortTime';

  get registeredServices() {
    return this.servicesDashboard.getRegisteredServices();
  }

  private socketClient = inject(SocketClientService);
  private router = inject(Router);
  private servicesDashboard = inject(ServicesDashboardService);

  private adminHelper = inject(AdminHelperService);

  constructor(
    @Inject('AuthService') private authService: AuthenticationService,
    private logger: LoggerService,
    private dataSimulationService: DataSimulationService,
  ) {
    this.socketClient.on<ServiceCallMetric>('metrics:update').subscribe(metric => {
      this.logger.info('Received real-time metric', metric);
    });
    this.socketClient.isConnected$.subscribe(connected => {
      this.logger.info('Socket connection status', { connected });
    });
  }

  ngOnInit(): void {
    this.authService.isAdmin$.subscribe((isAdmin: boolean) => {
      if (!isAdmin) {
        this.logger.warn('Admin component: User does not have admin permissions, redirecting');
        this.router.navigate(['/home']);
        return;
      }
    });

    // Start centralized monitoring in ServicesDashboardService
    this.servicesDashboard.startMonitoring();
    this.servicesDashboard.startStatisticsPolling(this.METRICS_UPDATE_INTERVAL);

    // subscribe to flattened metrics for table/chart updates
    this.serviceMetricsSubscription = this.servicesDashboard.metrics$.subscribe(metrics => {
      this.dataSource.data = metrics.slice(-50).reverse();
      this.updateServiceMetricsChart();
    });

    // Subscribe to shared simulation state
    this.dataSimulationService.isSimulating$.subscribe(isSim => {
      this.isSimulatingData = isSim;
      if (this.isSimulatingData && this.isTabActive) {
        this.servicesDashboard.startSimulation();
      } else {
        this.servicesDashboard.stopSimulation();
      }
    });

    // logStats moved to LogsDashboard

    this.tabGroup?.selectedIndexChange.subscribe((index: number) => {
      console.debug('Tab changed to:', index);
      if (index === 1) {
        console.debug('Entering Service Monitoring tab');
        if (!this.isTabActive) {
          this.isTabActive = true;
          this.servicesDashboard.startMonitoring();
        }
      } else {
        this.isTabActive = false;
        this.pauseSimulation();
        this.servicesDashboard.stopMonitoring();
      }
    });
  }

  ngAfterViewInit(): void {
    this.dataSource.paginator = this.paginator;
  }

  ngOnDestroy(): void {
    if (this.serviceMetricsSubscription) {
      this.serviceMetricsSubscription.unsubscribe();
    }
    if (this.statisticsInterval !== undefined) {
      clearInterval(this.statisticsInterval);
    }
    this.pauseSimulation();
    this.servicesDashboard.stopSimulation();

    this.servicesDashboard.stopMonitoring();
  }
  getKeys(obj: any): string[] {
    return Object.keys(obj || {});
  }

  private updateServiceMetricsChart(): void {
    if (!this.serviceMetricsChartRef?.nativeElement) return;
    const ctx = this.serviceMetricsChartRef.nativeElement.getContext('2d');
    if (!ctx) return;
    if (this.serviceMetricsChart) {
      try {
        this.serviceMetricsChart.data = this.servicesDashboard.buildChartDataForServices();
        this.serviceMetricsChart.update();
        return;
      } catch (e) {}
    }
    this.serviceMetricsChart = this.servicesDashboard.createServiceMetricsChart(ctx);
  }

  protected getSuccessRateColor(rate: number): string {
    return this.adminHelper.getSuccessRateColor(rate);
  }

  getServiceStatistics(serviceName: string) {
    return this.servicesDashboard.getServiceStatistics(serviceName);
  }

  getServiceColor(serviceName: string): string {
    return this.servicesDashboard.getServiceColor(serviceName);
  }

  toggleDataSimulation(): void {
    // Delegate to centralized DataSimulationService so footer and admin share state
    this.dataSimulationService.toggleSimulating();
    const next = !this.isSimulatingData;
    this.logger.info(`Admin dashboard: ${next ? 'Enabled' : 'Disabled'} data simulation`);
  }

  private pauseSimulation(): void {
    this.servicesDashboard.stopSimulation();
  }

  toggleServiceStatus(service: any): void {
    // Delegate toggling to the service for centralized state
    this.servicesDashboard.toggleServiceActive(service.name);
    this.logger.info(`Toggled service ${service.name} active state`);
  }

  clearMetrics(): void {
    // Centralize clearing behavior in ServicesDashboardService
    this.servicesDashboard.clearAllMetrics();
    // metrics$ subscription will update the table/chart when metricsSubject emits []
    this.logger.info('Requested clear of all service metrics');
  }

  clearLogs() {
    // Delegate log clearing to the dashboard (which calls LoggerService)
    this.servicesDashboard.clearLogs();
    this.logger.info('Requested clear of application logs');
  }

  parseFloat(value: string): number {
    return parseFloat(value) || 0;
  }

  toggleMetric(metric: string): void {
    this.servicesDashboard.toggleMetric(this.selectedMetrics, metric);
    this.logger.info(`Toggled metric ${metric}`);
    this.servicesDashboard.applyAxesToChart(this.systemMetricsChart, this.selectedMetrics);
  }

  // Chart legend handling moved to ServicesDashboardService

  selectApiCall(call: ServiceCallMetric): void {
    this.selectedApiCall = call;
  }

  getServiceHealth(serviceName: string): string {
    const stats = this.servicesDashboard.getServiceStatistics(serviceName) as any;
    if (!stats) return 'unknown';

    const successRate = stats.successRate ?? 100;
    if (successRate < 60) return 'critical';
    if (successRate < 85) return 'warning';
    return 'healthy';
  }

  // monitoring moved to ServicesDashboardService

  // updateServiceStatsLite moved to ServicesDashboardService
}
