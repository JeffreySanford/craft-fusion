import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { FooterComponent } from './footer.component';
import { FooterModule } from './footer.module';
import { ThemeService } from '../../common/services/theme.service';
import { FooterStateService } from '../../common/services/footer-state.service';
import { HealthService } from '../../common/services/health.service';
import { PerformanceMetricsService } from '../../common/services/performance-metrics.service';
import { AnimationService } from '../../common/services/animation.service';
import { LayoutService } from '../../common/services/layout.service';
import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { of } from 'rxjs';

describe('FooterComponent', () => {
  let component: FooterComponent;
  let fixture: ComponentFixture<FooterComponent>;
  let footerStateService: jasmine.SpyObj<FooterStateService>;
  let themeService: jasmine.SpyObj<ThemeService>;
  let healthService: jasmine.SpyObj<HealthService>;
  let performanceMetricsService: jasmine.SpyObj<PerformanceMetricsService>;
  let animationService: jasmine.SpyObj<AnimationService>;
  let layoutService: jasmine.SpyObj<LayoutService>;

  beforeEach(async () => {
    const footerStateServiceSpy = jasmine.createSpyObj('FooterStateService', 
      ['setExpanded', 'toggleExpanded', 'setCollapsed', 'isCollapsed$'], 
      { expanded$: of(false) });
    
    const themeServiceSpy = jasmine.createSpyObj('ThemeService', [], 
      { currentTheme$: of('light-theme') });
    
    const healthServiceSpy = jasmine.createSpyObj('HealthService', [], 
      { getHealthStatus: of({ status: 'online', timestamp: Date.now() }) });
    
    const perfMetricsServiceSpy = jasmine.createSpyObj('PerformanceMetricsService', [], 
      { getCurrentMetrics: of({ cpuLoad: '20%', memoryUsage: '1200 MB', networkLatency: '50 ms' }) });
    
    const animationServiceSpy = jasmine.createSpyObj('AnimationService', 
      ['shouldAnimationsBeEnabled'], { shouldAnimationsBeEnabled: () => true });
    
    const layoutServiceSpy = jasmine.createSpyObj('LayoutService', [], 
      { breakpoint$: of('md') });

    await TestBed.configureTestingModule({
      imports: [
        FooterModule,
        RouterTestingModule,
        BrowserAnimationsModule
      ],
      providers: [
        { provide: FooterStateService, useValue: footerStateServiceSpy },
        { provide: ThemeService, useValue: themeServiceSpy },
        { provide: HealthService, useValue: healthServiceSpy },
        { provide: PerformanceMetricsService, useValue: perfMetricsServiceSpy },
        { provide: AnimationService, useValue: animationServiceSpy },
        { provide: LayoutService, useValue: layoutServiceSpy }
      ],
      schemas: [CUSTOM_ELEMENTS_SCHEMA]
    }).compileComponents();

    footerStateService = TestBed.inject(FooterStateService) as jasmine.SpyObj<FooterStateService>;
    themeService = TestBed.inject(ThemeService) as jasmine.SpyObj<ThemeService>;
    healthService = TestBed.inject(HealthService) as jasmine.SpyObj<HealthService>;
    performanceMetricsService = TestBed.inject(PerformanceMetricsService) as jasmine.SpyObj<PerformanceMetricsService>;
    animationService = TestBed.inject(AnimationService) as jasmine.SpyObj<AnimationService>;
    layoutService = TestBed.inject(LayoutService) as jasmine.SpyObj<LayoutService>;
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(FooterComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should display correct current year', () => {
    const currentYear = new Date().getFullYear();
    expect(component.currentYear).toBe(currentYear);
  });

  it('should toggle version info when toggle is clicked', () => {
    expect(component.showVersionInfo).toBe(false);
    component.toggleVersionInfo();
    expect(component.showVersionInfo).toBe(true);
    component.toggleVersionInfo();
    expect(component.showVersionInfo).toBe(false);
  });

  it('should toggle expanded state when toggling footer', () => {
    component.toggleFooter();
    expect(footerStateService.toggleExpanded).toHaveBeenCalled();
  });

  it('should return correct system status class', () => {
    component.systemStatus = 'online';
    expect(component.getStatusClass()).toBe('status-online');
    
    component.systemStatus = 'degraded';
    expect(component.getStatusClass()).toBe('status-warning');
    
    component.systemStatus = 'offline';
    expect(component.getStatusClass()).toBe('status-error');
  });

  it('should return correct metric classes based on value', () => {
    component.performanceMetrics = { cpuLoad: '20%', memoryUsage: '1200 MB', networkLatency: '50 ms' };
    expect(component.getCpuLoadClass()).toBe('good');
    expect(component.getMemoryUsageClass()).toBe('good');
    expect(component.getNetworkLatencyClass()).toBe('good');
    
    component.performanceMetrics = { cpuLoad: '60%', memoryUsage: '3000 MB', networkLatency: '150 ms' };
    expect(component.getCpuLoadClass()).toBe('warning');
    expect(component.getMemoryUsageClass()).toBe('warning');
    expect(component.getNetworkLatencyClass()).toBe('warning');
    
    component.performanceMetrics = { cpuLoad: '90%', memoryUsage: '4500 MB', networkLatency: '250 ms' };
    expect(component.getCpuLoadClass()).toBe('critical');
    expect(component.getMemoryUsageClass()).toBe('critical');
    expect(component.getNetworkLatencyClass()).toBe('critical');
  });

  it('should categorize logos correctly', () => {
    const industryLogos = component.getLogosByCategory('industry');
    const federalLogos = component.getLogosByCategory('federal');
    
    expect(industryLogos.length).toBeGreaterThan(0);
    expect(federalLogos.length).toBeGreaterThan(0);
    
    industryLogos.forEach(logo => {
      expect(logo.category).toBe('industry');
    });
    
    federalLogos.forEach(logo => {
      expect(logo.category).toBe('federal');
    });
  });
});
