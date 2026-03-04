import { TestBed } from '@angular/core/testing';
import { describe, it, expect, beforeEach } from 'vitest';
import { AdminStateService } from './admin-state.service';
import { LoggerService } from './logger.service';

describe('AdminStateService', () => {
  let service: AdminStateService;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [AdminStateService, LoggerService] });
    service = TestBed.inject(AdminStateService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should update and retrieve admin status', () => {
    expect(service.getAdminStatus()).toBe(false);
    service.setAdminStatus(true);
    expect(service.getAdminStatus()).toBe(true);
  });
});
