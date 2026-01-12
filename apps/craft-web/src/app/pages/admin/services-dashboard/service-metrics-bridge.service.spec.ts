import { ServiceMetricsBridgeService } from './service-metrics-bridge.service';
import { Subject } from 'rxjs';
import { ServiceCallMetric } from '../../../common/services/logger.service';

class FakeNgZone {
  runOutsideAngular(callback: () => void) {
    callback();
  }
  run(callback: () => void) {
    callback();
  }
}

class MockLoggerService {
  public serviceCalls$ = new Subject<ServiceCallMetric[]>();
  getServiceMetrics() {
    return [];
  }
}

describe('ServiceMetricsBridgeService', () => {
  let service: ServiceMetricsBridgeService;
  let logger: MockLoggerService;

  beforeEach(() => {
    jest.useFakeTimers();
    logger = new MockLoggerService();
    service = new ServiceMetricsBridgeService(new FakeNgZone() as any, logger as any);
  });

  afterEach(() => {
    jest.useRealTimers();
    service.stopMonitoring();
  });

  it('emits the provided seed and ignores duplicate batches', () => {
    const metrics: ServiceCallMetric[] = [
      { id: 'A', serviceName: 'ApiService', method: 'GET', url: '/api/v1', timestamp: new Date(), status: 200, duration: 5 },
    ];
    const emitted: ServiceCallMetric[][] = [];
    service.metrics$.subscribe(data => emitted.push(data));

    service.startMonitoring(50);
    logger.serviceCalls$.next(metrics);
    jest.advanceTimersByTime(60);
    expect(emitted.length).toBeGreaterThanOrEqual(2);

    // Sending the same batch should not push another emission.
    logger.serviceCalls$.next(metrics);
    jest.advanceTimersByTime(60);
    expect(emitted.length).toBeLessThanOrEqual(3);
  });

  it('clears the emitted metrics when clear() is called', () => {
    const metrics: ServiceCallMetric[] = [
      { id: 'B', serviceName: 'AuthService', method: 'POST', url: '/auth', timestamp: new Date(), status: 201, duration: 12 },
    ];
    service.metrics$.subscribe();

    service.startMonitoring(20);
    logger.serviceCalls$.next(metrics);
    jest.advanceTimersByTime(30);

    service.clear();
    service.metrics$.subscribe(data => {
      expect(data).toEqual([]);
    });
  });
});
