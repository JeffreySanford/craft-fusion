import { TestBed } from '@angular/core/testing';
import { firstValueFrom } from 'rxjs';
import { AdminHeroService } from './admin-hero.service';
import { LoggerService, LogLevel } from '../../../common/services/logger.service';
import { ServicesDashboardService } from '../services-dashboard/services-dashboard.service';
import { of } from 'rxjs';

describe('AdminHeroService', () => {
  let service: AdminHeroService;
  let loggerService: any;
  let servicesDashboard: any;

  beforeEach(() => {
    const loggerSpy = {
      getLogs: jest.fn(),
      logAdded$: of({} as any),
    } as any;
    
    const dashboardSpy = {
      getRegisteredServices: jest.fn(),
      getServiceStatistics: jest.fn(),
      getLatestServiceMetrics: jest.fn(),
      metrics$: of([]),
    } as any;

    TestBed.configureTestingModule({
      providers: [
        AdminHeroService,
        { provide: LoggerService, useValue: loggerSpy },
        { provide: ServicesDashboardService, useValue: dashboardSpy },
      ],
    });

    service = TestBed.inject(AdminHeroService);
    loggerService = TestBed.inject(LoggerService);
    servicesDashboard = TestBed.inject(ServicesDashboardService);

    // Set up defaults
    loggerService.getLogs.mockReturnValue([]);
    servicesDashboard.getRegisteredServices.mockReturnValue([]);
    servicesDashboard.getLatestServiceMetrics.mockReturnValue([]);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should emit initial metrics on creation', async () => {
    const metrics = await firstValueFrom(service.heroMetrics$);
    expect(metrics).toBeDefined();
    expect(metrics.activeServices).toBeDefined();
    expect(metrics.successRate).toBeDefined();
    expect(metrics.errors).toBeDefined();
    expect(metrics.health).toBeDefined();
    expect(metrics.responseTime).toBeDefined();
    expect(metrics.alerts).toBeDefined();
    expect(metrics.dataMode).toBeDefined();
    expect(metrics.dataMode.isSimulating).toBe(false);
  });

  it('should compute active services correctly', async () => {
    servicesDashboard.getRegisteredServices.mockReturnValue([
      { name: 'Service1', description: 'Test', active: true },
      { name: 'Service2', description: 'Test', active: true },
      { name: 'Service3', description: 'Test', active: false },
    ]);

    service.startMonitoring(100);

    await new Promise(resolve => setTimeout(resolve, 150));
    
    const metrics = await firstValueFrom(service.heroMetrics$);
    expect(metrics.activeServices.current).toBe(2);
    expect(metrics.activeServices.total).toBe(3);
  });

  it('should compute success rate with delta', async () => {
    servicesDashboard.getRegisteredServices.mockReturnValue([
      { name: 'Service1', description: 'Test', active: true },
    ]);
    servicesDashboard.getServiceStatistics.mockReturnValue({
      avgResponseTime: 100,
      callCount: 10,
      successRate: 95,
      lastUpdate: Date.now(),
    });

    service.startMonitoring(100);

    await new Promise(resolve => setTimeout(resolve, 150));
    
    const metrics = await firstValueFrom(service.heroMetrics$);
    expect(metrics.successRate.value).toBe(95);
    expect(metrics.successRate.delta).toBeDefined();
  });

  it('should count errors and warnings correctly', async () => {
    loggerService.getLogs.mockReturnValue([
      { timestamp: new Date(), level: LogLevel.ERROR, message: 'Error 1' },
      { timestamp: new Date(), level: LogLevel.ERROR, message: 'Error 2' },
      { timestamp: new Date(), level: LogLevel.WARN, message: 'Warning 1' },
    ]);

    service.startMonitoring(100);

    await new Promise(resolve => setTimeout(resolve, 150));
    
    const metrics = await firstValueFrom(service.heroMetrics$);
    expect(metrics.errors.count).toBe(2);
    expect(metrics.errors.warnings).toBe(1);
    expect(metrics.errors.lastError).toBeDefined();
  });

  it('should compute response time metrics', async () => {
    servicesDashboard.getLatestServiceMetrics.mockReturnValue([
      { id: '1', timestamp: new Date(), serviceName: 'Test', method: 'GET', url: '/test', duration: 100 },
      { id: '2', timestamp: new Date(), serviceName: 'Test', method: 'GET', url: '/test', duration: 200 },
      { id: '3', timestamp: new Date(), serviceName: 'Test', method: 'GET', url: '/test', duration: 300 },
    ]);

    service.startMonitoring(100);

    await new Promise(resolve => setTimeout(resolve, 150));
    
    const metrics = await firstValueFrom(service.heroMetrics$);
    expect(metrics.responseTime.avg).toBeCloseTo(200, 0);
    expect(metrics.responseTime.p95).toBeGreaterThan(0);
  });

  it('should stop monitoring and clean up subscriptions', () => {
    service.startMonitoring();
    expect((service as any).subscriptions.length).toBeGreaterThan(0);

    service.stopMonitoring();
    expect((service as any).subscriptions.length).toBe(0);
  });

  it('should clean up on destroy', () => {
    jest.spyOn(service, 'stopMonitoring');
    service.ngOnDestroy();
    expect(service.stopMonitoring).toHaveBeenCalled();
  });

  it('should update simulation mode correctly', async () => {
    service.setSimulationMode(true);

    const metrics = await firstValueFrom(service.heroMetrics$);
    expect(metrics.dataMode.isSimulating).toBe(true);
    expect(metrics.dataMode.simulatingMetrics.length).toBeGreaterThan(0);
    expect(metrics.dataMode.simulatingMetrics).toContain('Service Calls');
  });

  it('should clear simulation metrics when switching to live mode', async () => {
    service.setSimulationMode(true);
    service.setSimulationMode(false);

    const metrics = await firstValueFrom(service.heroMetrics$);
    expect(metrics.dataMode.isSimulating).toBe(false);
    expect(metrics.dataMode.simulatingMetrics.length).toBe(0);
  });
});
