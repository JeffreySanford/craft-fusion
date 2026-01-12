import { PerformanceMetricsBridgeService } from './performance-metrics-bridge.service';
import { BehaviorSubject } from 'rxjs';
import { ServiceCallMetric } from '../../../common/services/logger.service';

class FakeNgZone {
  runOutsideAngular(callback: () => void) {
    callback();
  }
  run(callback: () => void) {
    callback();
  }
}

class MockServicesDashboardService {
  private storedMetrics: ServiceCallMetric[] = [];
  public readonly metrics$ = new BehaviorSubject<ServiceCallMetric[]>([]);

  setMetrics(metrics: ServiceCallMetric[]) {
    this.storedMetrics = metrics;
    this.metrics$.next(metrics);
  }

  getLatestServiceMetrics() {
    return [...this.storedMetrics];
  }
}

describe('PerformanceMetricsBridgeService', () => {
  let bridge: PerformanceMetricsBridgeService;
  let dashboard: MockServicesDashboardService;

  beforeEach(() => {
    jest.useFakeTimers();
    dashboard = new MockServicesDashboardService();
    bridge = new PerformanceMetricsBridgeService(new FakeNgZone() as any, dashboard as any);
  });

  afterEach(() => {
    jest.useRealTimers();
    bridge.stopMonitoring();
  });

  it('throttles rapid metrics updates', () => {
    const emitted: ServiceCallMetric[][] = [];
    bridge.metrics$.subscribe(batch => emitted.push(batch));

    const firstBatch: ServiceCallMetric[] = [
      { id: '1', timestamp: new Date(), serviceName: 'ApiService', method: 'GET', url: '/api', status: 200 },
    ];
    dashboard.setMetrics(firstBatch);

    bridge.startMonitoring(50);
    jest.advanceTimersByTime(60);
    const firstEmission = emitted[emitted.length - 1];
    expect(firstEmission).toBeDefined();
    if (firstEmission) {
      expect(firstEmission).toEqual(firstBatch);
    }

    const secondBatch: ServiceCallMetric[] = [
      { id: '2', timestamp: new Date(), serviceName: 'AuthService', method: 'POST', url: '/auth', status: 201 },
    ];
    dashboard.setMetrics(secondBatch);
    dashboard.metrics$.next(secondBatch);
    dashboard.setMetrics([...secondBatch]);
    dashboard.metrics$.next([...secondBatch]);
    jest.advanceTimersByTime(60);

    const secondEmission = emitted[emitted.length - 1];
    expect(secondEmission).toBeDefined();
    if (secondEmission) {
      expect(secondEmission).toEqual(secondBatch);
    }
  });

  it('cleans up the subscription when stopped', () => {
    bridge.startMonitoring();
    bridge.stopMonitoring();
    const privateField = (bridge as any).metricsSubscription;
    expect(privateField).toBeUndefined();
  });
});
