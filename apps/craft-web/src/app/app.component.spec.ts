import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { of } from 'rxjs';
import { BreakpointObserver } from '@angular/cdk/layout';
import { RouterTestingModule } from '@angular/router/testing';
import { AppComponent } from './app.component';
import { HttpClientModule } from '@angular/common/http';
import { LoggerService } from './common/services/logger.service';
import { UserTrackingService } from './common/services/user-tracking.service';
import { AdminStateService } from './common/services/admin-state.service';
import { UserActivityService } from './common/services/user-activity.service';
import { AuthenticationService } from './common/services/authentication.service';
import { FooterStateService } from './common/services/footer-state.service';
import { UserStateService } from './common/services/user-state.service';

describe('AppComponent', () => {
  let component: AppComponent;
  let fixture: ComponentFixture<AppComponent>;

  const breakpointObserverMock = {
    observe: jest.fn().mockReturnValue(of({ matches: false, breakpoints: {} })),
    isMatched: jest.fn().mockReturnValue(false),
  } as unknown as BreakpointObserver;

  const userTrackingServiceMock = {
    getCurrentUser: jest.fn().mockReturnValue(of(null)),
  };

  const adminStateServiceMock = {
    setAdminStatus: jest.fn(),
  };

  const userActivityServiceMock = {
    getActivitySummary: jest.fn().mockReturnValue({ pageViews: 0, clicks: 0, sessionDuration: 0 }),
  };

  const footerStateServiceMock = {
    expanded$: of(false),
  };

  const userStateServiceMock = {
    user$: of(null),
  };

  const authServiceMock = {
    isAdmin$: of(false),
  };

  const loggerMock = {
    info: jest.fn(),
    debug: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    registerService: jest.fn(),
  } as unknown as LoggerService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [AppComponent],
      imports: [HttpClientModule, RouterTestingModule.withRoutes([])],
      providers: [
        { provide: BreakpointObserver, useValue: breakpointObserverMock },
        { provide: LoggerService, useValue: loggerMock },
        { provide: UserTrackingService, useValue: userTrackingServiceMock },
        { provide: AdminStateService, useValue: adminStateServiceMock },
        { provide: UserActivityService, useValue: userActivityServiceMock },
        { provide: AuthenticationService, useValue: authServiceMock },
        { provide: FooterStateService, useValue: footerStateServiceMock },
        { provide: UserStateService, useValue: userStateServiceMock },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(AppComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create the app', () => {
    expect(component).toBeTruthy();
  });

  it('should add user interaction listeners', () => {
    const addEventListenerSpy = jest.spyOn(document, 'addEventListener');
    component['addUserInteractionListener']();
    expect(addEventListenerSpy).toHaveBeenCalledWith('click', component['handleUserInteraction']);
    expect(addEventListenerSpy).toHaveBeenCalledWith('keydown', component['handleUserInteraction']);
  });

  it('should remove user interaction listeners', () => {
    const removeEventListenerSpy = jest.spyOn(document, 'removeEventListener');
    component['removeUserInteractionListener']();
    expect(removeEventListenerSpy).toHaveBeenCalledWith('click', component['handleUserInteraction']);
    expect(removeEventListenerSpy).toHaveBeenCalledWith('keydown', component['handleUserInteraction']);
  });

  it('should handle user interaction', () => {
    const ensureVideoIsPlayingSpy = jest.spyOn(component as any, 'ensureVideoIsPlaying');
    component['handleUserInteraction'].call(component);
    expect(ensureVideoIsPlayingSpy).toHaveBeenCalled();
  });
});
