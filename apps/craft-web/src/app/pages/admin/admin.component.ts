import { Component, OnInit, OnDestroy, Inject, inject } from '@angular/core';
import { Router } from '@angular/router';
import { LoggerService, ServiceCallMetric } from '../../common/services/logger.service';
import { DataSimulationService } from '../../common/services/data-simulation.service';
import { ServicesDashboardService } from './services-dashboard/services-dashboard.service';
import { AuthenticationService } from '../../common/services/authentication.service';
import { trigger, state, style, transition, animate } from '@angular/animations';
import { SocketClientService } from '../../common/services/socket-client.service';
import { MatTabChangeEvent } from '@angular/material/tabs';

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
export class AdminComponent implements OnInit, OnDestroy {
  public autoScroll = true;
  public isSimulatingData = false;
  public selectedTab = 0;
  public selectedLogLevel = 'all';

  private readonly METRICS_UPDATE_INTERVAL = 15000;

  private socketClient = inject(SocketClientService);
  private router = inject(Router);
  private servicesDashboard = inject(ServicesDashboardService);

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
    const skipRedirect = Boolean((globalThis as any).__SKIP_ADMIN_REDIRECT);
    this.authService.isAdmin$.subscribe((isAdmin: boolean) => {
      if (!isAdmin && !skipRedirect) {
        this.logger.warn('Admin component: User does not have admin permissions, redirecting');
        this.router.navigate(['/home']);
      }
    });

    // Start lightweight polling for stats; full live monitoring is enabled/disabled
    // based on the simulation toggle so we don't double-process simulated metrics.
    this.servicesDashboard.startStatisticsPolling(this.METRICS_UPDATE_INTERVAL);

    this.dataSimulationService.isSimulating$.subscribe(isSim => {
      this.isSimulatingData = isSim;
      if (this.isSimulatingData) {
        // enable simulation and disable live monitoring
        this.servicesDashboard.startSimulation();
        this.servicesDashboard.stopMonitoring();
      } else {
        // disable simulation and switch to live monitoring
        this.servicesDashboard.stopSimulation();
        this.servicesDashboard.startMonitoring();
      }
    });
  }

  onTabChange(_event: MatTabChangeEvent): void {
    void _event;
    // No tab-specific monitoring; tabs share the same shell now.
  }

  ngOnDestroy(): void {
    this.pauseSimulation();
    this.servicesDashboard.stopSimulation();
    this.servicesDashboard.stopMonitoring();
    this.servicesDashboard.stopStatisticsPolling();
  }

  toggleDataSimulation(): void {
    this.dataSimulationService.toggleSimulating();
    const next = !this.isSimulatingData;
    this.logger.info(`Admin dashboard: ${next ? 'Enabled' : 'Disabled'} data simulation`);
  }

  clearMetrics(): void {
    this.servicesDashboard.clearAllMetrics();
    this.logger.info('Requested clear of all service metrics');
  }

  clearLogs(): void {
    this.servicesDashboard.clearLogs();
    this.logger.clearLogs();
    this.logger.info('Requested clear of application logs');
  }

  private pauseSimulation(): void {
    this.servicesDashboard.stopSimulation();
  }
}
