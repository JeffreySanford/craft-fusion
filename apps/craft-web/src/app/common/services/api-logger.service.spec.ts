import { TestBed } from '@angular/core/testing';
import { describe, it, expect, beforeEach } from 'vitest';
import { ApiLoggerService, ApiLogEntry } from './api-logger.service';
import { LoggerService } from './logger.service';

describe('ApiLoggerService', () => {
  let service: ApiLoggerService;
  let logger: LoggerService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [ApiLoggerService, LoggerService],
    });
    service = TestBed.inject(ApiLoggerService);
    logger = TestBed.inject(LoggerService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should add and retrieve logs', () => {
    const entry: ApiLogEntry = service.generateMockLog('/api/test', 'POST');
    service.logApiCall(entry);
    expect(service.getLogs().length).toBe(1);
    expect(service.getLogsForEndpoint('/api/test').length).toBe(1);
  });

  it('should trim logs when exceeding max', () => {
    for (let i = 0; i < 1010; i++) {
      service.logApiCall(service.generateMockLog('/api/too-many'));    
    }
    expect(service.getLogs().length).toBeLessThanOrEqual(1000);
  });

  it('clearLogs empties the store', () => {
    service.logApiCall(service.generateMockLog());
    expect(service.getLogs().length).toBeGreaterThan(0);
    service.clearLogs();
    expect(service.getLogs().length).toBe(0);
  });
});
