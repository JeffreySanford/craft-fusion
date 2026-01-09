import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SecurityDashboardComponent } from './security-dashboard.component';
import { ApiLoggerService } from '../../../common/services/api-logger.service';
import { LoggerService } from '../../../common/services/logger.service';
import { ApiService } from '../../../common/services/api.service';
import { of, BehaviorSubject, throwError } from 'rxjs';
import { NO_ERRORS_SCHEMA } from '@angular/core';

describe('SecurityDashboardComponent', () => {
  let component: SecurityDashboardComponent;
  let fixture: ComponentFixture<SecurityDashboardComponent>;
  let mockApiLoggerService: jest.Mocked<ApiLoggerService>;
  let mockLoggerService: jest.Mocked<LoggerService>;
  let mockApiService: jest.Mocked<ApiService>;
  let logStream$: BehaviorSubject<any>;

  beforeEach(async () => {
    logStream$ = new BehaviorSubject<any>(null);

    mockApiLoggerService = {
      getLogStream: jest.fn().mockReturnValue(logStream$.asObservable()),
    } as any;

    mockLoggerService = {
      error: jest.fn(),
      warn: jest.fn(),
      info: jest.fn(),
    } as any;

    mockApiService = {
      get: jest.fn().mockReturnValue(of([])),
      post: jest.fn().mockReturnValue(of(null)),
    } as any;

    await TestBed.configureTestingModule({
      declarations: [SecurityDashboardComponent],
      providers: [
        { provide: ApiLoggerService, useValue: mockApiLoggerService },
        { provide: LoggerService, useValue: mockLoggerService },
        { provide: ApiService, useValue: mockApiService },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();

    fixture = TestBed.createComponent(SecurityDashboardComponent);
    component = fixture.componentInstance;
    (component as any).apiService = mockApiService;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('ngOnInit', () => {
    it('should call monitorApiEndpoints, loadFindings, and loadEvidence', () => {
      const monitorSpy = jest.spyOn<any, any>(component, 'monitorApiEndpoints').mockImplementation(() => {});
      const findingsSpy = jest.spyOn<any, any>(component, 'loadFindings').mockImplementation(() => {});
      const evidenceSpy = jest.spyOn<any, any>(component, 'loadEvidence').mockImplementation(() => {});

      component.ngOnInit();

      expect(monitorSpy).toHaveBeenCalled();
      expect(findingsSpy).toHaveBeenCalled();
      expect(evidenceSpy).toHaveBeenCalled();
    });
  });

  describe('loadFindings', () => {
    it('should initialize findings as empty array', () => {
      expect(component.findings).toEqual([]);
    });

    it('should set findingsLoading to false initially', () => {
      expect(component.findingsLoading).toBe(false);
    });

    it('should set findingsError to null initially', () => {
      expect(component.findingsError).toBeNull();
    });
  });

  describe('loadEvidence', () => {
    it('should initialize evidence as empty array', () => {
      expect(component.evidence).toEqual([]);
    });

    it('should set evidenceLoading to false initially', () => {
      expect(component.evidenceLoading).toBe(false);
    });

    it('should set evidenceError to null initially', () => {
      expect(component.evidenceError).toBeNull();
    });
  });

  describe('OSCAL update status management', () => {
    const createStatus = () => ({
      lastUpdated: '2026-01-09T00:00:00.000Z',
      sources: {
        fedramp: {
          version: 'Rev 5',
          status: 'synced',
          lastChecked: '2026-01-08T12:00:00.000Z',
        },
        nist: {
          version: 'SP 800-37 Rev 2',
          status: 'synced',
          lastChecked: '2026-01-08T12:05:00.000Z',
        },
      },
      progress: {
        status: 'idle',
        value: 100,
        message: 'Synced',
      },
    });

    it('should load OSCAL update status from the API', () => {
      const mockStatus = createStatus();
      mockApiService.get.mockReturnValueOnce(of(mockStatus));

      (component as any).loadOscalUpdateStatus();

      expect(mockApiService.get).toHaveBeenCalledWith('security/oscal-updates');
      expect(component.oscalUpdateStatus).toEqual(mockStatus);
      expect(component.oscalUpdateLoading).toBe(false);
      expect(component.oscalUpdateError).toBeNull();
    });

    it('should handle errors when loading OSCAL status', () => {
      mockApiService.get.mockReturnValueOnce(throwError(() => ({ status: 503 })));

      (component as any).loadOscalUpdateStatus();

      expect(component.oscalUpdateStatus).toBeNull();
      expect(component.oscalUpdateError).toBe('Unable to load OSCAL update status right now.');
      expect(component.oscalUpdateLoading).toBe(false);
    });

    it('should refresh OSCAL updates and replace the cached status', () => {
      const mockStatus = createStatus();
      mockApiService.post.mockReturnValueOnce(of(mockStatus));

      component.refreshOscalUpdates();

      expect(mockApiService.post).toHaveBeenCalledWith('security/oscal-updates/refresh', null);
      expect(component.oscalUpdateStatus).toEqual(mockStatus);
      expect(component.oscalUpdateRefreshing).toBe(false);
      expect(component.oscalUpdateError).toBeNull();
    });

    it('should not refresh if a refresh is already in progress', () => {
      component.oscalUpdateRefreshing = true;
      component.refreshOscalUpdates();

      expect(mockApiService.post).not.toHaveBeenCalled();
      component.oscalUpdateRefreshing = false;
    });

    it('should capture errors when refresh fails', () => {
      mockLoggerService.warn.mockClear();
      mockApiService.post.mockReturnValueOnce(throwError(() => ({ status: 500 })));

      component.refreshOscalUpdates();

      expect(component.oscalUpdateRefreshing).toBe(false);
      expect(component.oscalUpdateError).toBe('Unable to refresh OSCAL catalogs right now.');
      expect(mockLoggerService.warn).toHaveBeenCalledWith(
        'Failed to refresh OSCAL catalogs',
        { status: 500 },
      );
    });
  });

  describe('getSeverityClass', () => {
    it('should return correct class for critical severity', () => {
      expect(component.getSeverityClass('critical')).toBe('severity-critical');
      expect(component.getSeverityClass('high')).toBe('severity-critical');
    });

    it('should return correct class for warning severity', () => {
      expect(component.getSeverityClass('medium')).toBe('severity-warning');
      expect(component.getSeverityClass('warn')).toBe('severity-warning');
      expect(component.getSeverityClass('warning')).toBe('severity-warning');
    });

    it('should return correct class for low severity', () => {
      expect(component.getSeverityClass('low')).toBe('severity-low');
      expect(component.getSeverityClass('info')).toBe('severity-low');
    });

    it('should return unknown class for unrecognized severity', () => {
      expect(component.getSeverityClass('unknown')).toBe('severity-unknown');
      expect(component.getSeverityClass('')).toBe('severity-unknown');
      expect(component.getSeverityClass(undefined)).toBe('severity-unknown');
    });

    it('should be case-insensitive', () => {
      expect(component.getSeverityClass('CRITICAL')).toBe('severity-critical');
      expect(component.getSeverityClass('Medium')).toBe('severity-warning');
    });
  });

  describe('getFindingStatusClass', () => {
    it('should return correct class for closed status', () => {
      expect(component.getFindingStatusClass('closed')).toBe('status-closed');
      expect(component.getFindingStatusClass('resolved')).toBe('status-closed');
    });

    it('should return correct class for open status', () => {
      expect(component.getFindingStatusClass('open')).toBe('status-open');
      expect(component.getFindingStatusClass('new')).toBe('status-open');
      expect(component.getFindingStatusClass('active')).toBe('status-open');
    });

    it('should return unknown class for unrecognized status', () => {
      expect(component.getFindingStatusClass('unknown')).toBe('status-unknown');
      expect(component.getFindingStatusClass('')).toBe('status-unknown');
    });
  });

  describe('getEvidenceStatusClass', () => {
    it('should return correct class for ready status', () => {
      expect(component.getEvidenceStatusClass('ready')).toBe('status-ready');
      expect(component.getEvidenceStatusClass('complete')).toBe('status-ready');
      expect(component.getEvidenceStatusClass('available')).toBe('status-ready');
    });

    it('should return correct class for pending status', () => {
      expect(component.getEvidenceStatusClass('processing')).toBe('status-pending');
      expect(component.getEvidenceStatusClass('running')).toBe('status-pending');
      expect(component.getEvidenceStatusClass('queued')).toBe('status-pending');
    });

    it('should return unknown class for unrecognized status', () => {
      expect(component.getEvidenceStatusClass('unknown')).toBe('status-unknown');
      expect(component.getEvidenceStatusClass('')).toBe('status-unknown');
    });
  });

  describe('API monitoring', () => {
    it('should process API log entries', () => {
      const logEntry = {
        request: {
          url: 'http://localhost/api/test',
          method: 'GET',
          headers: {},
        },
        response: {
          status: 200,
          body: {},
        },
        responseTime: 150,
      };

      component.ngOnInit();
      logStream$.next(logEntry);

      expect(component.endpointLogs.size).toBeGreaterThan(0);
      const endpoint = component.endpointLogs.get('/api/test');
      expect(endpoint).toBeDefined();
      expect(endpoint?.hitCount).toBe(1);
      expect(endpoint?.successCount).toBe(1);
    });

    it('should track error responses', () => {
      const logEntry = {
        request: {
          url: 'http://localhost/api/error',
          method: 'GET',
          headers: {},
        },
        response: {
          status: 500,
          body: {},
        },
        responseTime: 200,
      };

      component.ngOnInit();
      logStream$.next(logEntry);

      const endpoint = component.endpointLogs.get('/api/error');
      expect(endpoint?.errorCount).toBe(1);
      expect(endpoint?.status).toBe('error');
    });
  });

  describe('ngOnDestroy', () => {
    it('should unsubscribe from all subscriptions', () => {
      component.ngOnInit();
      const apiLogsSpy = jest.spyOn(component.apiLogsSubscription, 'unsubscribe');
      const dataSpy = jest.spyOn(component.dataSubscription, 'unsubscribe');

      component.ngOnDestroy();

      expect(apiLogsSpy).toHaveBeenCalled();
      expect(dataSpy).toHaveBeenCalled();
    });
  });
});
