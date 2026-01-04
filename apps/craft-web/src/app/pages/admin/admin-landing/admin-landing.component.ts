import { Component, OnInit, OnDestroy } from '@angular/core';
import { Subscription } from 'rxjs';
import { LogEntry, LoggerService, LogLevel } from '../../../common/services/logger.service';
import { ServicesDashboardService, ServiceMetricsSummary } from '../services-dashboard/services-dashboard.service';

interface OverviewTile {
  label: string;
  value: string;
  subLabel: string;
  icon: string;
  status: 'ok' | 'warning' | 'critical';
  detail?: string;
}

@Component({
  selector: 'app-admin-landing',
  templateUrl: './admin-landing.component.html',
  styleUrls: ['./admin-landing.component.scss'],
  standalone: false,
})
export class AdminLandingComponent implements OnInit, OnDestroy {
  navigator = window.navigator;
  tiles: OverviewTile[] = [];

  private statsSub?: Subscription;
  private logsSub?: Subscription;
  private previousSuccessRate: number | null = null;

  constructor(
    private servicesDashboard: ServicesDashboardService,
    private loggerService: LoggerService,
  ) {}

  ngOnInit(): void {
    this.refreshTiles();
    this.statsSub = this.servicesDashboard.metrics$.subscribe(() => this.refreshTiles());
    this.logsSub = this.loggerService.logAdded$.subscribe(() => this.refreshTiles());
  }

  ngOnDestroy(): void {
    this.statsSub?.unsubscribe();
    this.logsSub?.unsubscribe();
  }

  private refreshTiles(): void {
    const services = this.servicesDashboard.getRegisteredServices();
    const stats: ServiceMetricsSummary[] = services
      .map(service => this.servicesDashboard.getServiceStatistics(service.name))
      .filter((entry): entry is ServiceMetricsSummary => Boolean(entry));

    const avgSuccess = stats.length
      ? stats.reduce((sum, entry) => sum + (entry.successRate ?? 100), 0) / stats.length
      : 100;
    const delta = this.previousSuccessRate === null ? 0 : avgSuccess - this.previousSuccessRate;
    this.previousSuccessRate = avgSuccess;

    const flaggedServices = stats.filter(entry => (entry.successRate ?? 0) < 85).length;
    const lastUpdate = stats.reduce((max, entry) => Math.max(max, entry.lastUpdate ?? 0), 0);
    const lastUpdatedLabel = lastUpdate ? new Date(lastUpdate).toLocaleTimeString() : 'N/A';

    const logCounts = { error: 0, warn: 0 };
    this.loggerService.getLogs().forEach((log: LogEntry) => {
      if (log.level === LogLevel.ERROR) logCounts.error++;
      else if (log.level === LogLevel.WARN) logCounts.warn++;
    });

    const activeServices = services.filter(service => service.active).length;

    this.tiles = [
      {
        label: 'Active services',
        value: `${activeServices}/${services.length}`,
        subLabel: `Updated ${lastUpdatedLabel}`,
        icon: 'cloud_done',
        status: activeServices === services.length ? 'ok' : 'warning',
      },
      {
        label: 'Success rate',
        value: `${Math.round(avgSuccess)}%`,
        subLabel: `Δ ${delta >= 0 ? '+' : ''}${delta.toFixed(1)}% vs prior`,
        icon: 'thumb_up',
        status: avgSuccess >= 95 ? 'ok' : avgSuccess >= 85 ? 'warning' : 'critical',
        detail: flaggedServices ? `${flaggedServices} service${flaggedServices === 1 ? '' : 's'} flagged` : 'All services healthy',
      },
      {
        label: 'Errors logged',
        value: `${logCounts.error}`,
        subLabel: `${logCounts.warn} warnings in queue`,
        icon: 'error_outline',
        status: logCounts.error > 0 ? 'critical' : logCounts.warn > 0 ? 'warning' : 'ok',
      },
      {
        label: 'Connection',
        value: this.navigator.onLine ? 'Live data' : 'Offline',
        subLabel: this.navigator.onLine ? 'Streaming measurements' : 'Simulation only',
        icon: 'wifi',
        status: this.navigator.onLine ? 'ok' : 'warning',
      },
    ];
  }
}
