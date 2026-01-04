import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AdminComponent } from './admin.component';
import { AdminMaterialModule } from './admin-material.module';
import { DataSimulationService } from '../../common/services/data-simulation.service';
import { ServicesDashboardService } from './services-dashboard/services-dashboard.service';
import { LoggerService } from '../../common/services/logger.service';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { MatTabChangeEvent } from '@angular/material/tabs';

class MockServicesDashboardService {
  metrics$ = new BehaviorSubject([]);
  startMonitoring = jest.fn();
  stopMonitoring = jest.fn();
  startStatisticsPolling = jest.fn();
  stopStatisticsPolling = jest.fn();
  startSimulation = jest.fn();
  stopSimulation = jest.fn();
  getRegisteredServices() {
    return [];
  }
}

class MockLoggerService {
  debug = jest.fn();
  info = jest.fn();
  warn = jest.fn();
}

class MockDataSimulationService {
  isSimulating$ = new BehaviorSubject(false);
  toggleSimulating = jest.fn();
}

describe('AdminComponent', () => {
  let component: AdminComponent;
  let fixture: ComponentFixture<AdminComponent>;
  let servicesDashboard: MockServicesDashboardService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AdminMaterialModule],
      declarations: [AdminComponent],
      providers: [
        { provide: ServicesDashboardService, useClass: MockServicesDashboardService },
        { provide: LoggerService, useClass: MockLoggerService },
        { provide: DataSimulationService, useClass: MockDataSimulationService },
        { provide: 'AuthService', useClass: class { isAdmin$ = new BehaviorSubject(true); isAdmin = true; } },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();

    fixture = TestBed.createComponent(AdminComponent);
    component = fixture.componentInstance;
    servicesDashboard = TestBed.inject(ServicesDashboardService) as unknown as MockServicesDashboardService;
  });

  it('should render five tabs including Performance', () => {
    fixture.detectChanges();
    const labelElements = fixture.nativeElement.querySelectorAll('.mdc-tab__text-label') as NodeListOf<HTMLElement>;
    const texts = Array.from(labelElements).map(el => el.textContent?.trim() ?? '');
    expect(labelElements.length).toBe(4);
    expect(texts.some(text => text.includes('Performance'))).toBe(true);
  });
});
