import { TestBed } from '@angular/core/testing';
import { NasaFirmsService } from './nasa-firms.service';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';

describe('NasaFirmsService', () => {
  let service: NasaFirmsService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [HttpClientTestingModule], providers: [NasaFirmsService] });
    service = TestBed.inject(NasaFirmsService);
    httpMock = TestBed.inject(HttpTestingController);
  });
  afterEach(() => httpMock.verify());
  it('should be created', () => expect(service).toBeTruthy());
});