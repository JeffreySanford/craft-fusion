import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router, ActivatedRoute } from '@angular/router';
import { BreakpointObserver } from '@angular/cdk/layout';
import { AppComponent } from './app.component';
import { SidebarComponent } from './pages/sidebar/sidebar.component';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { MaterialIconsComponent } from './pages/landing/material-icons/material-icons.component';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { AdminStateService } from './common/services/admin-state.service';
import { UserActivityService } from './common/services/user-activity.service';
import { LoggerService } from './common/services/logger.service';
import { AuthService } from './common/services/auth/auth.service';
import { FooterStateService } from './common/services/footer-state.service';
import { SidebarStateService } from './common/services/sidebar-state.service';
import { UserStateService } from './common/services/user-state.service';
import { 
  MockAdminStateService, 
  MockUserActivityService, 
  MockLoggerService, 
  MockAuthService, 
  MockAuthenticationService,
  MockFooterStateService, 
  MockSidebarStateService, 
  MockUserStateService,
  mockRouter,
  mockActivatedRoute,
  MockBreakpointObserver
} from './testing/test-mocks';
import { AuthenticationService } from './common/services/authentication.service';

describe('AppComponent', () => {
  let component: AppComponent;
  let fixture: ComponentFixture<AppComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [AppComponent, SidebarComponent, MaterialIconsComponent],
      imports: [HttpClientTestingModule],
      providers: [
        { provide: Router, useValue: mockRouter },
        { provide: ActivatedRoute, useValue: mockActivatedRoute },
        { provide: BreakpointObserver, useClass: MockBreakpointObserver },
        { provide: AdminStateService, useClass: MockAdminStateService },
        { provide: UserActivityService, useClass: MockUserActivityService },
        { provide: LoggerService, useClass: MockLoggerService },
        { provide: AuthService, useClass: MockAuthService },
        { provide: AuthenticationService, useClass: MockAuthenticationService },
        { provide: FooterStateService, useClass: MockFooterStateService },
        { provide: SidebarStateService, useClass: MockSidebarStateService },
        { provide: UserStateService, useClass: MockUserStateService },
      ],
      schemas: [NO_ERRORS_SCHEMA]
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