import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HeaderComponent } from './header.component';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatMenuModule } from '@angular/material/menu';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { of, BehaviorSubject } from 'rxjs';
import { AuthenticationService } from '../../common/services/authentication.service';
import { ThemeService, ThemeName } from '../../common/services/theme.service';
import { LoggerService } from '../../common/services/logger.service';
import { Router } from '@angular/router';
import { MockLoggerService, mockRouter } from '../../testing/test-mocks';

describe('HeaderComponent', () => {
  let component: HeaderComponent;
  let fixture: ComponentFixture<HeaderComponent>;

  const authServiceMock = {
    isLoggedIn$: of(false),
    isAdmin$: of(false),
    login: () =>
      of({
        success: true,
        token: 'mock-token',
        user: { username: 'mock-user' },
      }),
    logout: () => {},
  };

  const themeSubject = new BehaviorSubject<ThemeName>('light');
  const themeServiceMock = {
    theme$: themeSubject.asObservable(),
    toggleTheme: () => themeSubject.next(themeSubject.value === 'light' ? 'dark' : 'light'),
    setThemeByName: (name: ThemeName) => themeSubject.next(name),
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NoopAnimationsModule, MatCardModule, MatIconModule, MatButtonModule, MatMenuModule],
      declarations: [HeaderComponent],
      providers: [
        { provide: AuthenticationService, useValue: authServiceMock },
        { provide: LoggerService, useClass: MockLoggerService },
        { provide: ThemeService, useValue: themeServiceMock },
        { provide: Router, useValue: mockRouter },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(HeaderComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should handle user menu actions', () => {
    const loggerSpy = jest.spyOn(component['logger'], 'info');
    component.handleUserMenuAction('login');
    expect(loggerSpy).toHaveBeenCalledWith('Logging in with test credentials');
  });
});
