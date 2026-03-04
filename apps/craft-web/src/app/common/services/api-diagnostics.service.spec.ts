import { TestBed } from '@angular/core/testing';
import { describe, it, expect, beforeEach } from 'vitest';
import { ApiDiagnosticsService, ConnectionDiagnostics } from './api-diagnostics.service';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { LoggerService } from './logger.service';
import { environment } from '../../../environments/environment';
import { firstValueFrom } from 'rxjs';

describe('ApiDiagnosticsService', () => {
  let service: ApiDiagnosticsService;
  let httpMock: HttpTestingController;
  let logger: LoggerService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [ApiDiagnosticsService, LoggerService],
    });
    service = TestBed.inject(ApiDiagnosticsService);
    httpMock = TestBed.inject(HttpTestingController);
    logger = TestBed.inject(LoggerService);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('checkConnectionNow returns healthy diagnostics on success', async () => {
    const diagPromise = firstValueFrom(service.checkConnectionNow());
    const req = httpMock.expectOne(`${environment.apiUrl}/api`);
    req.flush({});
    const diag: ConnectionDiagnostics = await diagPromise;
    expect(diag.isConnected).toBe(true);
  });

  it('checkConnectionNow returns unavailable on error', async () => {
    const diagPromise = firstValueFrom(service.checkConnectionNow());
    const req = httpMock.expectOne(`${environment.apiUrl}/api`);
    req.flush('error', { status: 500, statusText: 'error' });
    const diag: ConnectionDiagnostics = await diagPromise;
    expect(diag.isConnected).toBe(false);
    expect(diag.error).toBeDefined();
  });
});
