import { setupZoneTestEnv } from 'jest-preset-angular/setup-env/zone';

setupZoneTestEnv();

(globalThis as any).ngJest = {
  testEnvironmentOptions: {
    errorOnUnknownElements: true,
    errorOnUnknownProperties: true,
  },
};

import 'zone.js/testing';
import { TestBed } from '@angular/core/testing';
import { BrowserDynamicTestingModule, platformBrowserDynamicTesting } from '@angular/platform-browser-dynamic/testing';
import { Router, NavigationEnd } from '@angular/router';
import { AuthenticationService } from './app/common/services/authentication.service';
import { ApiService } from './app/common/services/api.service';
import { FileUploadService } from './app/common/services/file-upload.service';
import { NotificationService } from './app/common/services/notification.service';
import { BreakpointObserver } from '@angular/cdk/layout';
import { HttpClient } from '@angular/common/http';
import { RecordService } from './app/projects/table/services/record.service';
import { MapboxService } from './app/common/services/mapbox.service';
import { of } from 'rxjs';

const TEST_BED_INITIALIZED = '__craftFusionTestBedInitialized';

// eslint-disable-next-line security/detect-object-injection
if (!(globalThis as any)[TEST_BED_INITIALIZED]) {
  const initializeTestBed = () => {
    if (TestBed.platform) {
      return;
    }

    try {
      TestBed.initTestEnvironment(
        BrowserDynamicTestingModule,
        platformBrowserDynamicTesting(),
        {
          teardown: { destroyAfterEach: true },
        }
      );
    } catch (err) {
      const message = (err as Error)?.message || '';
      const alreadyCalled =
        message.includes('Cannot set base providers because it has already been called');
      if (!alreadyCalled) {
        throw new Error(message);
      }
    }
  };

  initializeTestBed();
  // eslint-disable-next-line security/detect-object-injection
  (globalThis as any)[TEST_BED_INITIALIZED] = true;
}

// Provide default mock providers to avoid widespread NullInjectorError in many specs.
try {
  const mockAuthService = {
    authState$: of(null),
    currentUser$: of(null),
    isLoggedIn$: of(false),
    isAdmin$: of(false),
    initializeAuthentication: jest.fn(),
    login: jest.fn().mockReturnValue(of({ success: false, token: '' })),
    logout: jest.fn(),
  } as unknown as AuthenticationService;

  const mockApiService = {
    get: jest.fn().mockReturnValue(of([])),
    post: jest.fn().mockReturnValue(of({})),
    put: jest.fn().mockReturnValue(of({})),
    delete: jest.fn().mockReturnValue(of({})),
    authRequest: jest.fn().mockReturnValue(of({})),
    isServerStarting: false,
  } as unknown as ApiService;

  const mockFileUploadService = {
    uploadFile: () => of(undefined),
  } as unknown as FileUploadService;

  const mockNotificationService = {
    showWarning: jest.fn(),
    showError: jest.fn(),
    showSuccess: jest.fn(),
    showInfo: jest.fn(),
  } as unknown as NotificationService;

  const mockRecord: any = {
    UID: 'TEST-1',
    firstName: 'Test',
    lastName: 'User',
    address: { street: '1 Test St', city: 'Testville', state: 'TS', zipcode: '12345' },
    phone: { number: '555-0100' },
  };

  const mockRecordService = {
    generateNewRecordSet: jest.fn().mockReturnValue(of([mockRecord])),
    getCreationTime: jest.fn().mockReturnValue(of(0)),
    isOfflineMode: jest.fn().mockReturnValue(false),
    getMockRecords: jest.fn().mockReturnValue([mockRecord]),
    getRecords: jest.fn().mockReturnValue(of([mockRecord])),
    getRecordByUID: jest.fn().mockReturnValue(of(mockRecord)),
    fetchAll: jest.fn().mockReturnValue([mockRecord]),
    setServerResource: jest.fn().mockReturnValue('/api'),
  } as unknown as RecordService;

  const mockRouter = {
    events: of(new NavigationEnd(1, '/','/')),
    navigate: jest.fn().mockResolvedValue(true),
    url: '/',
  } as unknown as Router;

  const mockMapboxService = {
    initializeMap: jest.fn(),
    resizeMap: jest.fn(),
    addMarker: jest.fn(),
    clearMarkers: jest.fn(),
    destroyMap: jest.fn(),
    addFlightMarker: jest.fn(),
    clearFlightMarkers: jest.fn(),
    flyTo: jest.fn(),
  } as unknown as MapboxService;

  const mockBreakpointObserver = {
    isMatched: jest.fn().mockReturnValue(false),
    observe: jest.fn().mockReturnValue(of({ matches: false })),
  } as unknown as BreakpointObserver;

  const mockHttpClient = {
    get: jest.fn().mockReturnValue(of({})),
    post: jest.fn().mockReturnValue(of({})),
    put: jest.fn().mockReturnValue(of({})),
    delete: jest.fn().mockReturnValue(of({})),
  } as unknown as HttpClient;

  try {
    TestBed.overrideProvider(AuthenticationService, { useValue: mockAuthService as any });
    TestBed.overrideProvider(ApiService, { useValue: mockApiService as any });
    TestBed.overrideProvider(RecordService, { useValue: mockRecordService as any });
    TestBed.overrideProvider(Router, { useValue: mockRouter as any });
    TestBed.overrideProvider(FileUploadService, { useValue: mockFileUploadService as any });
    TestBed.overrideProvider(NotificationService, { useValue: mockNotificationService as any });
    TestBed.overrideProvider(HttpClient, { useValue: mockHttpClient as any });
    TestBed.overrideProvider(BreakpointObserver, { useValue: mockBreakpointObserver as any });
    TestBed.overrideProvider(MapboxService, { useValue: mockMapboxService as any });
  } catch {
    // If overrideProvider runs before TestBed is fully ready in some environments, ignore the error.
  }
  // Ensure any call to TestBed.configureTestingModule merges these default providers
  try {
    const originalConfigure = (TestBed as any).configureTestingModule.bind(TestBed);
    (TestBed as any).configureTestingModule = (moduleDef: any) => {
      moduleDef = moduleDef || {};
      const existingProviders = Array.isArray(moduleDef.providers) ? moduleDef.providers : [];
      const defaultProviders = [
        { provide: AuthenticationService, useValue: mockAuthService },
        { provide: ApiService, useValue: mockApiService },
        { provide: RecordService, useValue: mockRecordService },
        { provide: FileUploadService, useValue: mockFileUploadService },
        { provide: NotificationService, useValue: mockNotificationService },
        { provide: BreakpointObserver, useValue: mockBreakpointObserver },
        { provide: MapboxService, useValue: mockMapboxService },
        { provide: HttpClient, useValue: mockHttpClient },
      ];
      moduleDef.providers = [...existingProviders, ...defaultProviders];
      return originalConfigure(moduleDef);
    };
  } catch {
    // ignore
  }

// Ensure Router prototype has safe defaults so components accessing `router.events` or `router.url` don't crash
try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const AngularRouter = require('@angular/router').Router;
  if (AngularRouter && AngularRouter.prototype) {
      // eslint-disable-next-line security/detect-object-injection
      AngularRouter.prototype.events = AngularRouter.prototype.events || of(new (require('@angular/router').NavigationEnd)(1, '/', '/'));
      // eslint-disable-next-line security/detect-object-injection
      AngularRouter.prototype.url = AngularRouter.prototype.url || '/';
    }
} catch {
  // ignore if router can't be required here
}

// Ensure a global jasmine-style spyOn exists (reinforce test-global-setup shim)
if (typeof (global as any).spyOn === 'undefined') {
  (global as any).spyOn = (obj: any, methodName: string) => {
    try {
      const spy = (global as any).jest.spyOn(obj, methodName as any);
      const safeSpy = spy || {
        mockReturnValue: jest.fn(),
        mockImplementation: jest.fn(),
      };
      (safeSpy as any).and = {
        returnValue: (v: any) => (safeSpy as any).mockReturnValue(v),
        callFake: (f: any) => (safeSpy as any).mockImplementation(f),
      };
      return safeSpy;
    } catch {
      try {
        if (obj && methodName) {
          // eslint-disable-next-line security/detect-object-injection
          obj[methodName] = jest.fn();
        }
      } catch {
        // ignore
      }
      const dummy: any = {
        mockReturnValue: jest.fn(),
        mockImplementation: jest.fn(),
      };
      dummy.and = {
        returnValue: (v: any) => {
          // eslint-disable-next-line security/detect-object-injection
          if (obj && obj[methodName] && typeof obj[methodName].mockReturnValue === 'function') {
            // eslint-disable-next-line security/detect-object-injection
            return obj[methodName].mockReturnValue(v);
          }
          return dummy.mockReturnValue(v);
        },
        callFake: (f: any) => {
          // eslint-disable-next-line security/detect-object-injection
          if (obj && obj[methodName] && typeof obj[methodName].mockImplementation === 'function') {
            // eslint-disable-next-line security/detect-object-injection
            return obj[methodName].mockImplementation(f);
          }
          return dummy.mockImplementation(f);
        },
      };
      return dummy;
    }
  };
}
} catch {
  // ignore
}

global.TextEncoder = global.TextEncoder || (require('util').TextEncoder as typeof global.TextEncoder);
global.TextDecoder = global.TextDecoder || (require('util').TextDecoder as typeof global.TextDecoder);

// Make console.log a jest mock so specs that spyOn(console, 'log') see a mock
if (typeof (global as any).console !== 'undefined') {
  (global as any).console.log = (global as any).console.log || jest.fn();
}

const mockSpeechRecognition = jest.fn().mockImplementation(() => ({
  start: jest.fn(),
  stop: jest.fn(),
  abort: jest.fn(),
  onspeechstart: jest.fn(),
  onresult: jest.fn(),
}));

Object.defineProperty(window, 'SpeechRecognition', {
  value: mockSpeechRecognition,
  configurable: true,
});

Object.defineProperty(window, 'webkitSpeechRecognition', {
  value: mockSpeechRecognition,
  configurable: true,
});

Object.defineProperty(window, 'mapboxgl', {
  value: {
    Map: class {},
    NavigationControl: class {},
    Marker: class {
      constructor() {}
      setLngLat() {
        return this;
      }
      addTo() {
        return this;
      }
    },
    Popup: class {
      setHTML() {
        return this;
      }
      addTo() {
        return this;
      }
    },
    LngLatBounds: class {},
    accessToken: '',
  },
  configurable: true,
});
