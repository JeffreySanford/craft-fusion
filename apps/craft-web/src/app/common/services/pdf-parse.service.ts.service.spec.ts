import { TestBed } from '@angular/core/testing';

import { PdfParseServiceTsService } from './pdf-parse.service.ts.service';

describe('PdfParseServiceTsService', () => {
  let service: PdfParseServiceTsService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(PdfParseServiceTsService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
