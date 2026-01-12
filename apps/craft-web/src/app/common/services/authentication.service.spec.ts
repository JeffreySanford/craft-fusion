import { TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { AuthenticationService } from './authentication.service';
import { ApiService } from './api.service';
import { SessionService } from './session.service';
import { LoggerService } from './logger.service';
import { NotificationService } from './notification.service';
import { AdminStateService } from './admin-state.service';
import { UserTrackingService } from './user-tracking.service';
import {
  MockApiService,
  MockSessionService,
  MockLoggerService,
  MockNotificationService,
  MockAdminStateService,
  MockUserTrackingService,
} from '../../testing/test-mocks';

describe('AuthService', () => {
  let service: AuthenticationService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [RouterTestingModule, HttpClientTestingModule],
      providers: [
        AuthenticationService,
        { provide: ApiService, useClass: MockApiService },
        { provide: SessionService, useClass: MockSessionService },
        { provide: LoggerService, useClass: MockLoggerService },
        { provide: NotificationService, useClass: MockNotificationService },
        { provide: AdminStateService, useClass: MockAdminStateService },
        { provide: UserTrackingService, useClass: MockUserTrackingService },
      ],
    });
    service = TestBed.inject(AuthenticationService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
