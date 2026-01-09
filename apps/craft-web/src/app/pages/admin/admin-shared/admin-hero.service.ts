import { Injectable, NgZone, OnDestroy } from '@angular/core';
import { BehaviorSubject, combineLatest, Subscription } from 'rxjs';
import { auditTime, map } from 'rxjs/operators';
import { LoggerService, LogLevel } from '../../../common/services/logger.service';
import { ServicesDashboardService, ServiceMetricsSummary } from '../services-dashboard/services-dashboard.service';

export interface HeroMetrics {
  activeServices: {
    current: number;
    total: number;
    delta: number;
  };
  successRate: {
    value: number;
    delta: number;
    flaggedCount: number;
  };
  errors: {
    count: number;
    warnings: number;
    lastError?: Date;
  };
  health: {
    online: boolean;
    wsConnected: boolean;
  };
  responseTime: {
    avg: number;
    p95: number;
  };
  alerts: {
    critical: number;
    warnings: number;
  };
  dataMode: {
    isSimulating: boolean;
    simulatingMetrics: string[];
  };
  lastUpdate: Date;
}

const DEFAULT_THROTTLE_MS = 2500;

@Injectable({
  providedIn: 'root',
})
export class AdminHeroService implements OnDestroy {
  private readonly heroMetricsSubject = new BehaviorSubject<HeroMetrics>(this.getInitialMetrics());
  public readonly heroMetrics$ = this.heroMetricsSubject.asObservable();

  private subscriptions: Subscription[] = [];
  private previousActiveCount = 0;
  private previousSuccessRate = 0;

  constructor(
    private readonly ngZone: NgZone,
    private readonly logger: LoggerService,
    private readonly servicesDashboard: ServicesDashboardService,
  ) {}

  setSimulationMode(isSimulating: boolean): void {
    const current = this.heroMetricsSubject.value;
    this.heroMetricsSubject.next({
      ...current,
      dataMode: {
        isSimulating,
        simulatingMetrics: isSimulating 
          ? ['Service Calls', 'Response Times', 'Success Rates', 'Error Events']
          : [],
      },
    });
  }

  startMonitoring(throttleMs = DEFAULT_THROTTLE_MS): void {
    this.stopMonitoring();
    this.emitCurrentMetrics();

    this.ngZone.runOutsideAngular(() => {
      const sub = combineLatest([
        this.servicesDashboard.metrics$,
        this.logger.logAdded$,
      ])
        .pipe(
          auditTime(throttleMs),
          map(() => this.computeMetrics()),
        )
        .subscribe(metrics => {
          this.ngZone.run(() => {
            this.heroMetricsSubject.next(metrics);
          });
        });

      this.subscriptions.push(sub);
    });
  }

  stopMonitoring(): void {
    this.subscriptions.forEach(sub => sub.unsubscribe());
    this.subscriptions = [];
  }

  ngOnDestroy(): void {
    this.stopMonitoring();
  }

  private emitCurrentMetrics(): void {
    const metrics = this.computeMetrics();
    this.heroMetricsSubject.next(metrics);
  }

  private computeMetrics(): HeroMetrics {
    const current = this.heroMetricsSubject.value;
    const services = this.servicesDashboard.getRegisteredServices();
    const stats: ServiceMetricsSummary[] = services
      .map(service => this.servicesDashboard.getServiceStatistics(service.name))
      .filter((entry): entry is ServiceMetricsSummary => Boolean(entry));

    // Active services
    const activeCount = services.filter(s => s.active).length;
    const activeDelta = activeCount - this.previousActiveCount;
    this.previousActiveCount = activeCount;

    // Success rate
    const avgSuccess = stats.length
      ? stats.reduce((sum, entry) => sum + (entry.successRate ?? 100), 0) / stats.length
      : 100;
    const successDelta = avgSuccess - this.previousSuccessRate;
    this.previousSuccessRate = avgSuccess;
    const flaggedServices = stats.filter(entry => (entry.successRate ?? 0) < 85).length;

    // Errors and warnings
    const logCounts = { error: 0, warn: 0, lastError: undefined as Date | undefined };
    this.logger.getLogs().forEach(log => {
      if (log.level === LogLevel.ERROR) {
        logCounts.error++;
        if (!logCounts.lastError || log.timestamp > logCounts.lastError) {
          logCounts.lastError = log.timestamp;
        }
      } else if (log.level === LogLevel.WARN) {
        logCounts.warn++;
      }
    });

    // Response time
    const recentMetrics = this.servicesDashboard.getLatestServiceMetrics(50);
    const durations = recentMetrics
      .map(m => m.duration)
      .filter((d): d is number => typeof d === 'number' && d > 0);
    const avgResponseTime = durations.length
      ? durations.reduce((sum, d) => sum + d, 0) / durations.length
      : 0;
    const sortedDurations = [...durations].sort((a, b) => a - b);
    const p95Index = Math.floor(sortedDurations.length * 0.95);
    // eslint-disable-next-line security/detect-object-injection
    const p95ResponseTime = sortedDurations[p95Index] ?? avgResponseTime;

    // Alerts (currently from errors/warnings, can be extended with security service)
    const criticalAlerts = logCounts.error;
    const warningAlerts = logCounts.warn;

    return {
      activeServices: {
        current: activeCount,
        total: services.length,
        delta: activeDelta,
      },
      successRate: {
        value: avgSuccess,
        delta: successDelta,
        flaggedCount: flaggedServices,
      },
      errors: {
        count: logCounts.error,
        warnings: logCounts.warn,
        ...(logCounts.lastError && { lastError: logCounts.lastError }),
      },
      health: {
        online: navigator.onLine,
        wsConnected: true, // TODO: Add actual WebSocket state from SocketClientService
      },
      responseTime: {
        avg: avgResponseTime,
        p95: p95ResponseTime,
      },
      alerts: {
        critical: criticalAlerts,
        warnings: warningAlerts,
      },
      dataMode: current.dataMode,
      lastUpdate: new Date(),
    };
  }

  private getInitialMetrics(): HeroMetrics {
    return {
      activeServices: { current: 0, total: 0, delta: 0 },
      successRate: { value: 100, delta: 0, flaggedCount: 0 },
      errors: { count: 0, warnings: 0 },
      health: { online: navigator.onLine, wsConnected: false },
      responseTime: { avg: 0, p95: 0 },
      alerts: { critical: 0, warnings: 0 },
      dataMode: { isSimulating: false, simulatingMetrics: [] },
      lastUpdate: new Date(),
    };
  }
}
