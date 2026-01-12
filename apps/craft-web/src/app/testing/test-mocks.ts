/* eslint-disable @typescript-eslint/no-unused-vars */
import { BreakpointState } from '@angular/cdk/layout';
import { ChangeDetectorRef } from '@angular/core';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { Record as CraftRecord } from '@craft-fusion/craft-library';
import { User } from '../common/interfaces/user.interface';

export const mockRouter = {
  navigate: () => Promise.resolve(true),
  events: of(),
  url: '/',
};

export const mockActivatedRoute = {
  snapshot: {
    paramMap: {
      get: (_key: string) => 'MOCK-UID',
    },
  },
};

export class MockChangeDetectorRef extends ChangeDetectorRef {
  override markForCheck(): void {}
  override detach(): void {}
  override detectChanges(): void {}
  override checkNoChanges(): void {}
  override reattach(): void {}
}

export class MockBreakpointObserver {
  observe(_breakpoints: string[] | string): Observable<BreakpointState> {
    return of({ matches: false, breakpoints: {} as Record<string, boolean> });
  }
  isMatched(_query: string): boolean {
    return false;
  }
}

export class MockSpinnerService {
  show(): void {
    // mock implementation
  }
  hide(): void {
    // mock implementation
  }
}

export class MockNotificationService {
  showInfo(): void {}
  showWarning(): void {}
  showSuccess(): void {}
  showError(): void {}
}

export class MockLoggerService {
  registerService(): void {}
  info(): void {}
  warn(): void {}
  debug(): void {}
  error(): void {}
  startServiceCall(): number {
    return 0;
  }
  endServiceCall(): void {}
}

const baseAddress = {
  street: '123 Mockingbird Lane',
  city: 'Mocksville',
  state: 'MO',
  zipcode: '12345',
};

const basePhone = {
  UID: 'PHONE-1',
  number: '(555) 123-4567',
  type: 'mobile',
};

export const MOCK_RECORD: CraftRecord = {
  UID: 'MOCK-1',
  firstName: 'Mock',
  lastName: 'User',
  name: 'Mock User',
  address: baseAddress,
  city: baseAddress.city,
  state: baseAddress.state,
  zip: baseAddress.zipcode,
  phone: basePhone,
  salary: [],
  email: 'mock.user@example.com',
  birthDate: new Date().toISOString(),
  registrationDate: new Date().toISOString(),
  totalHouseholdIncome: 100000,
} as unknown as CraftRecord;

export class MockRecordService {
  offlineStatus$ = of(false);

  setServerResource(): string {
    return '/api/mock';
  }

  generateNewRecordSet(_count?: number): Observable<CraftRecord[]> {
    return of([MOCK_RECORD]);
  }

  getMockRecords(): CraftRecord[] {
    return [MOCK_RECORD];
  }

  getCreationTime(): Observable<number> {
    return of(0);
  }

  getRecordByUID(): Observable<CraftRecord> {
    return of(MOCK_RECORD);
  }

  isOfflineMode(): boolean {
    return false;
  }

  setSelectedUID(): void {}
}

export class MockAuthService {
  login(): Observable<User> {
    return of({
      id: 1,
      username: 'mock',
      firstName: 'Mock',
      lastName: 'User',
      email: 'mock@example.com',
      password: '',
      roles: [],
    } as User);
  }

  logout(): void {}

  isLoggedIn$ = of(false);
  isAdmin$ = of(false);
  initializeAuthentication(): void {}
}

export class MockAuthenticationService {
  isLoggedIn$ = of(false);
  isAdmin$ = of(false);
  initializeAuthentication(): void {}
}

export class MockApiService {
  private readonly user: User = {
    id: 1,
    username: 'mock',
    firstName: 'Mock',
    lastName: 'User',
    email: 'mock@example.com',
    password: '',
    roles: [],
  };

  getApiUrl(): string {
    return '/api/mock';
  }

  setApiUrl(): string {
    return '/api/mock';
  }

  authRequest(): Observable<{ user: User; token: string }> {
    return of({ user: this.user, token: 'mock-token' });
  }
}

export class MockSessionService {
  setUserSession(): void {}
  clearUserSession(): void {}
}

export class MockAdminStateService {
  private readonly subject = new BehaviorSubject<boolean>(false);
  isAdmin$ = this.subject.asObservable();
  setAdminStatus(isAdmin: boolean): void {
    this.subject.next(isAdmin);
  }
}

export class MockUserTrackingService {
  private readonly subject = new BehaviorSubject<User | null>(null);
  getCurrentUser(): Observable<User | null> {
    return this.subject.asObservable();
  }
  setCurrentUser(user: User | null): void {
    this.subject.next(user);
  }
}

export class MockUserActivityService {
  active$ = of(true);
  updateActivity(): void {}
  getActivitySummary(): any {
    return { pageViews: 0, clicks: 0, sessionDuration: 0 };
  }
}

export class MockFooterStateService {
  private readonly subject = new BehaviorSubject<boolean>(false);
  expanded$ = this.subject.asObservable();
  setExpanded(_expanded: boolean): void {}
  isExpanded(): boolean { return false; }
}

export class MockSidebarStateService {
  private readonly subject = new BehaviorSubject<boolean>(false);
  isCollapsed$ = this.subject.asObservable();
}

export class MockUserStateService {
  user$ = of(null);
  loginDateTime$ = of(new Date());
  visitLength$ = of(0);
  visitedPages$ = of([]);
}

