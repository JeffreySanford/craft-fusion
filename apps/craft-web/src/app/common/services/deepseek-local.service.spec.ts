import { TestBed } from '@angular/core/testing';

import { DeepSeekService } from './deepseek-local.service';

describe('DeepseekLocalService', () => {
  let service: DeepSeekService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(DeepSeekService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
