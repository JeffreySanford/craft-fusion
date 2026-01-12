import { Injectable, NgZone, OnDestroy } from '@angular/core';
import { BehaviorSubject, Subscription } from 'rxjs';
import { auditTime } from 'rxjs/operators';
import { LoggerService, ServiceCallMetric } from '../../../common/services/logger.service';

const DEFAULT_THROTTLE_MS = 2000;
const MAX_EMITTED_METRICS = 120;

@Injectable({
  providedIn: 'root',
})
export class ServiceMetricsBridgeService implements OnDestroy {
  private readonly metricsSubject = new BehaviorSubject<ServiceCallMetric[]>([]);
  public readonly metrics$ = this.metricsSubject.asObservable();

  private loggerSubscription: Subscription | undefined;
  private isMonitoring = false;
  private lastEmittedId: string | undefined;

  constructor(private readonly ngZone: NgZone, private readonly logger: LoggerService) {}

  startMonitoring(throttleMs = DEFAULT_THROTTLE_MS): void {
    if (this.isMonitoring) {
      return;
    }
    this.isMonitoring = true;

    const seed = this.logger.getServiceMetrics().slice(-MAX_EMITTED_METRICS);
    if (seed.length) {
      const fresh = this.extractNewMetrics(seed);
      if (fresh.length) {
        this.emitMetrics(fresh);
      }
    }

    this.ngZone.runOutsideAngular(() => {
      this.loggerSubscription = this.logger.serviceCalls$
        .pipe(auditTime(throttleMs))
        .subscribe(metrics => {
          const snapshot = metrics?.slice(0, MAX_EMITTED_METRICS) ?? [];
          const fresh = this.extractNewMetrics(snapshot);
          if (fresh.length === 0) {
            return;
          }
          this.emitMetrics(fresh);
        });
    });
  }

  stopMonitoring(): void {
    this.isMonitoring = false;
    if (this.loggerSubscription) {
      this.loggerSubscription.unsubscribe();
      this.loggerSubscription = undefined;
    }
  }

  clear(): void {
    this.lastEmittedId = undefined;
    this.metricsSubject.next([]);
  }

  getLatestMetrics(limit = 50): ServiceCallMetric[] {
    const current = this.metricsSubject.getValue();
    if (!current || current.length === 0) {
      return [];
    }
    return current.slice(-limit).reverse();
  }

  ngOnDestroy(): void {
    this.stopMonitoring();
  }

  private emitMetrics(metrics: ServiceCallMetric[]): void {
    const latest = metrics.at(-1);
    if (latest?.id) {
      this.lastEmittedId = latest.id;
    }
    this.ngZone.run(() => {
      this.metricsSubject.next(metrics);
    });
  }

  private extractNewMetrics(metrics: ServiceCallMetric[]): ServiceCallMetric[] {
    if (!metrics.length) {
      return [];
    }
    const newMetrics: ServiceCallMetric[] = [];
    for (const metric of metrics) {
      if (metric.id === this.lastEmittedId) {
        break;
      }
      newMetrics.push(metric);
    }

    return newMetrics.reverse();
  }
}
