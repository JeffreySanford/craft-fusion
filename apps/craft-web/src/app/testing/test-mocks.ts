/// <reference types="jest" />
import { of } from 'rxjs';

export class MockRecordService {
  getRecords = jest.fn().mockReturnValue(of([{ 
    UID: 'U001',
    firstName: 'John',
    lastName: 'Doe',
    address: {
      street: '123 Main St',
      city: 'New York',
      state: 'NY',
      zipcode: '10001'
    },
    phone: { number: '555-1234' }
  }]));
  getRecordById = jest.fn().mockReturnValue(of({ 
    UID: 'U001',
    firstName: 'John',
    lastName: 'Doe',
    address: {
      street: '123 Main St',
      city: 'New York',
      state: 'NY',
      zipcode: '10001'
    },
    phone: { number: '555-1234' }
  }));
  updateRecord = jest.fn().mockReturnValue(of({}));
  deleteRecord = jest.fn().mockReturnValue(of({}));
  setServerResource = jest.fn().mockReturnValue('');
  generateNewRecordSet = jest.fn().mockReturnValue(of([{ 
    UID: 'U001',
    firstName: 'John',
    lastName: 'Doe',
    address: {
      street: '123 Main St',
      city: 'New York',
      state: 'NY',
      zipcode: '10001'
    },
    phone: { number: '555-1234' }
  }]));
  getCreationTime = jest.fn().mockReturnValue(of(100));
  isOfflineMode = jest.fn().mockReturnValue(false);
  checkNetworkStatus = jest.fn().mockReturnValue(of(true));
  getMockRecords = jest.fn().mockReturnValue([{
    UID: 'U001',
    firstName: 'John',
    lastName: 'Doe',
    address: {
      street: '123 Main St',
      city: 'New York',
      state: 'NY',
      zipcode: '10001'
    },
    phone: { number: '555-1234' }
  }]);
}

export class MockApiService {
  get = jest.fn().mockReturnValue(of({}));
  post = jest.fn().mockReturnValue(of({}));
  put = jest.fn().mockReturnValue(of({}));
  delete = jest.fn().mockReturnValue(of({}));
  getApiUrl = jest.fn().mockReturnValue('http://localhost:3000/api');
}

export class MockSessionService {
  set = jest.fn();
  get = jest.fn();
  remove = jest.fn();
  clear = jest.fn();
}

export class MockAdminStateService {
  isAdmin$ = of(false);
  setAdminStatus = jest.fn();
}

export class MockUserTrackingService {
  trackAction = jest.fn();
}

export class MockBreakpointObserver {
  observe = jest.fn().mockReturnValue(of({ matches: false }));
  isMatched = jest.fn().mockReturnValue(false);
}

export class MockSpinnerService {
  show = jest.fn();
  hide = jest.fn();
}

export class MockNotificationService {
  success = jest.fn();
  error = jest.fn();
  info = jest.fn();
  warn = jest.fn();
  showWarning = jest.fn();
  showInfo = jest.fn();
  showSuccess = jest.fn();
  showError = jest.fn();
}

export class MockLoggerService {
  log = jest.fn();
  error = jest.fn();
  warn = jest.fn();
  info = jest.fn();
  debug = jest.fn();
  registerService = jest.fn();
}

export class MockChangeDetectorRef {
  detectChanges = jest.fn();
  markForCheck = jest.fn();
}

export const mockRouter = {
  navigate: jest.fn(),
  url: '/',
  events: of({})
};

export const mockActivatedRoute = {
  params: of({}),
  snapshot: {
    paramMap: {
      get: jest.fn()
    }
  }
};

export class MockAuthenticationService {
  isLoggedIn$ = of(false);
  isAdmin$ = of(false);
  currentUser$ = of(null);
  login = jest.fn().mockReturnValue(of({}));
  logout = jest.fn().mockReturnValue(of({}));
  checkAuth = jest.fn().mockReturnValue(of(false));
}

export class MockAuthService {
  isAuthenticated$ = of(false);
  isAdmin$ = of(false);
  isLoggedIn$ = of(false);
  user$ = of(null);
  logout = jest.fn().mockReturnValue(of(true));
  initializeAuthentication = jest.fn();
}

export class MockDeepSeekService {
  generateResponse = jest.fn().mockReturnValue(of(''));
}

