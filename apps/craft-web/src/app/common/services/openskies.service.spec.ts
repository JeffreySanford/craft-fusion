import { TestBed } from '@angular/core/testing';
import { describe, it, expect, beforeEach } from 'vitest';
import { OpenSkiesService } from './openskies.service';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';

describe('OpenSkiesService', () => {
  let service: OpenSkiesService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [HttpClientTestingModule], providers: [OpenSkiesService] });
    service = TestBed.inject(OpenSkiesService);
    httpMock = TestBed.inject(HttpTestingController);
  });
  afterEach(() => httpMock.verify());
  it('should be created', () => expect(service).toBeTruthy());
});