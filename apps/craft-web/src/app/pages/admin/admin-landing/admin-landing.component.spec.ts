import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AdminLandingComponent } from './admin-landing.component';
import { ServicesDashboardService, ServiceMetricsSummary } from '../services-dashboard/services-dashboard.service';
import { LoggerService, LogEntry, LogLevel } from '../../../common/services/logger.service';
import { BehaviorSubject } from 'rxjs';
import { NO_ERRORS_SCHEMA } from '@angular/core';

describe('AdminLandingComponent', () => {
  let component: AdminLandingComponent;
  let fixture: ComponentFixture<AdminLandingComponent>;
  const dummyMetrics$ = new BehaviorSubject([]);

  const mockServices = [
    { name: 'ServiceA', active: true },
    { name: 'ServiceB', active: false },
  ];

  const mockServicesDashboard = {
    metrics$: dummyMetrics$.asObservable(),
    getRegisteredServices: () => mockServices,
    getServiceStatistics: (name: string) => {
      const entry: ServiceMetricsSummary = {
        avgResponseTime: name === 'ServiceA' ? 120 : 230,
        callCount: 10,
        successRate: name === 'ServiceA' ? 98 : 82,
        lastUpdate: Date.now(),
      };
      return entry;
    },
  };

  const mockLogs: LogEntry[] = [
    { timestamp: new Date(), level: LogLevel.INFO, message: 'info' },
    { timestamp: new Date(), level: LogLevel.ERROR, message: 'boom' },
  ];

  const mockLogger = {
    logAdded$: new BehaviorSubject<LogEntry | null>(null),
    getLogs: () => mockLogs,
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [AdminLandingComponent],
      providers: [
        { provide: ServicesDashboardService, useValue: mockServicesDashboard },
        { provide: LoggerService, useValue: mockLogger },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();

    fixture = TestBed.createComponent(AdminLandingComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should populate hero tiles from services and logs', () => {
    expect(component.tiles.length).toBe(4);
    const successTile = component.tiles.find(tile => tile.label === 'Success rate');
    expect(successTile?.status).toBe('warning');
    expect(successTile?.detail).toContain('flagged');
  });
});
