import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router, ActivatedRoute } from '@angular/router';
import { BreakpointObserver } from '@angular/cdk/layout';
import { AppComponent } from './app.component';
import { HttpClientModule } from '@angular/common/http';
import { AuthService } from './common/services/auth/auth.service';
import { DeepSeekService } from './common/services/deepseek-local.service';
import { RecordService } from './projects/table/services/record.service';
import { AuthenticationService } from './common/services/authentication.service';
import { MockAuthService, MockDeepSeekService, MockRecordService, MockAuthenticationService, MockBreakpointObserver } from './testing/test-mocks';
import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';

describe('AppComponent', () => {
  let component: AppComponent;
  let fixture: ComponentFixture<AppComponent>;
  let mockRouter: jest.Mocked<Router>;
  let mockActivatedRoute: jest.Mocked<ActivatedRoute>;

  beforeEach(async () => {
    mockRouter = {
      navigate: jest.fn(),
      events: { subscribe: jest.fn() }
    } as unknown as jest.Mocked<Router>;

    mockActivatedRoute = {
      snapshot: {
        paramMap: {
          get: jest.fn()
        }
      }
    } as unknown as jest.Mocked<ActivatedRoute>;

    await TestBed.configureTestingModule({
      declarations: [AppComponent],
      imports: [HttpClientModule],
      providers: [
        { provide: Router, useValue: mockRouter },
        { provide: ActivatedRoute, useValue: mockActivatedRoute },
        { provide: BreakpointObserver, useClass: MockBreakpointObserver },
        { provide: AuthService, useClass: MockAuthService },
        { provide: DeepSeekService, useClass: MockDeepSeekService },
        { provide: RecordService, useClass: MockRecordService },
        { provide: AuthenticationService, useClass: MockAuthenticationService }
      ],
      schemas: [CUSTOM_ELEMENTS_SCHEMA]
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