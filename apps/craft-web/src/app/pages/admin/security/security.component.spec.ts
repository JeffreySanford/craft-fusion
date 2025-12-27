import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { AdminSecurityComponent } from './security.component';
import { SecurityScanService } from '../../../common/services/security-scan.service';
import { AdminMetricsService } from '../../../common/services/admin-metrics.service';
import { AuthenticationService } from '../../../common/services/authentication.service';
import { of, Subject } from 'rxjs';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { By } from '@angular/platform-browser';

describe('AdminSecurityComponent', () => {
  let component: AdminSecurityComponent;
  let fixture: ComponentFixture<AdminSecurityComponent>;
  let scanServiceSpy: jasmine.SpyObj<SecurityScanService>;
  let metricsServiceSpy: jasmine.SpyObj<AdminMetricsService>;
  let authServiceSpy: jasmine.SpyObj<AuthenticationService>;

  beforeEach(async () => {
    scanServiceSpy = jasmine.createSpyObj('SecurityScanService', ['startScan', 'getLatest', 'watchJob']);
    metricsServiceSpy = jasmine.createSpyObj('AdminMetricsService', ['getMetrics']);
    authServiceSpy = jasmine.createSpyObj('AuthenticationService', ['isLoggedIn$']);

    // default stubs
    scanServiceSpy.getLatest.and.returnValue(of({ summary: 'ok' }));
    metricsServiceSpy.getMetrics.and.returnValue(of({ activeUsers: 2, permissionRequests: 1, connection: 'Secure' } as any));
    (authServiceSpy.isLoggedIn$ as any) = of(true);

    await TestBed.configureTestingModule({
      declarations: [AdminSecurityComponent],
      imports: [MatCardModule, MatIconModule, MatButtonModule, MatProgressBarModule, NoopAnimationsModule],
      providers: [
        { provide: SecurityScanService, useValue: scanServiceSpy },
        { provide: AdminMetricsService, useValue: metricsServiceSpy },
        { provide: AuthenticationService, useValue: authServiceSpy as any }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(AdminSecurityComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should display metrics from AdminMetricsService', () => {
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('.stat-value')?.textContent).toContain('2');
    expect(compiled.querySelector('.feature-grid')).toBeTruthy();
  });

  it('should start a scan and show running job progress', fakeAsync(() => {
    const jobSubj = new Subject<any>();
    scanServiceSpy.startScan.and.returnValue(of({ jobId: 'job-123' }));
    scanServiceSpy.watchJob.and.returnValue(jobSubj.asObservable());

    component.runSCA();
    fixture.detectChanges();

    expect(component.runningJob).toBeTruthy();
    expect(component.runningJob.jobId).toBe('job-123');

    // simulate progress
    jobSubj.next({ jobId: 'job-123', progress: 20, event: 'progress', message: '20%' });
    tick();
    fixture.detectChanges();

    const progressEl = fixture.debugElement.query(By.css('mat-progress-bar'));
    expect(progressEl).toBeTruthy();
    // the progress value is bound to runningJob.progress
    expect(component.runningJob.progress).toBe(20);

    // finish
    jobSubj.next({ jobId: 'job-123', progress: 100, event: 'finished' });
    tick();
    fixture.detectChanges();

    expect(component.runningJob).toBeNull();
  }));
});
