import { TestBed } from '@angular/core/testing';

import { DeepseekLocalService } from './deepseek-local.service';

describe('DeepseekLocalService', () => {
  let service: DeepseekLocalService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(DeepseekLocalService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
