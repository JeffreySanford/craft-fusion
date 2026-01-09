import { TestBed } from '@angular/core/testing';
import { SecurityScanService } from './security-scan.service';

describe('SecurityScanService', () => {
  let service: SecurityScanService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(SecurityScanService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
