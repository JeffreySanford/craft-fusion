import { TestBed } from '@angular/core/testing';

import { DocParseServiceTsService } from './doc-parse.service.ts.service';

describe('DocParseServiceTsService', () => {
  let service: DocParseServiceTsService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(DocParseServiceTsService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
