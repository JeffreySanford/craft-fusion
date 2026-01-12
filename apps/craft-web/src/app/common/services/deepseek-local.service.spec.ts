import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { DeepSeekService } from './deepseek-local.service';

describe('DeepseekLocalService', () => {
  let service: DeepSeekService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule]
    });
    service = TestBed.inject(DeepSeekService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
