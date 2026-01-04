import { Injectable, NgZone, OnDestroy } from '@angular/core';
import { BehaviorSubject, Subscription } from 'rxjs';
import { auditTime } from 'rxjs/operators';
import { ServicesDashboardService } from '../services-dashboard/services-dashboard.service';
import { ServiceCallMetric } from '../../../common/services/logger.service';

const DEFAULT_THROTTLE_MS = 1200;

@Injectable({
  providedIn: 'root',
})
export class PerformanceMetricsBridgeService implements OnDestroy {
  private readonly metricsSubject = new BehaviorSubject<ServiceCallMetric[]>([]);
  public readonly metrics$ = this.metricsSubject.asObservable();

  private metricsSubscription: Subscription | undefined;

  constructor(
    private readonly ngZone: NgZone,
    private readonly servicesDashboard: ServicesDashboardService,
  ) {}

  startMonitoring(throttleMs = DEFAULT_THROTTLE_MS): void {
    this.stopMonitoring();
    this.emitCurrentMetrics();

    this.ngZone.runOutsideAngular(() => {
      this.metricsSubscription = this.servicesDashboard.metrics$
        .pipe(auditTime(throttleMs))
        .subscribe(metrics => this.emitCurrentMetrics(metrics));
    });
  }

  stopMonitoring(): void {
    if (this.metricsSubscription) {
      this.metricsSubscription.unsubscribe();
      this.metricsSubscription = undefined;
    }
  }

  ngOnDestroy(): void {
    this.stopMonitoring();
  }

  private emitCurrentMetrics(metrics?: ServiceCallMetric[]): void {
    const payload = metrics ?? this.servicesDashboard.getLatestServiceMetrics();
    this.ngZone.run(() => {
      this.metricsSubject.next(payload);
    });
  }
}
