import { TestBed } from '@angular/core/testing';
import { RecordService } from './record.service';
import { NotificationService } from '../../../common/services/notification.service';
import { LoggerService } from '../../../common/services/logger.service';
import { ApiService } from '../../../common/services/api.service';
import { AuthService } from '../../../common/services/auth';
import {
  MockNotificationService,
  MockLoggerService,
  MockApiService,
  MockAuthService,
} from '../../../testing/test-mocks';

describe('RecordServiceService', () => {
  let service: RecordService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        RecordService,
        { provide: NotificationService, useClass: MockNotificationService },
        { provide: LoggerService, useClass: MockLoggerService },
        { provide: ApiService, useClass: MockApiService },
        { provide: AuthService, useClass: MockAuthService },
      ],
    });
    service = TestBed.inject(RecordService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
