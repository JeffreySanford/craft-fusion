import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { ApiService, ApiOptions } from './api.service';
// vitest helpers provide globals for test functions and spies
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { LoggerService } from './logger.service';
import { firstValueFrom } from 'rxjs';

describe('ApiService', () => {
  let service: ApiService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [ApiService, LoggerService],
    });
    service = TestBed.inject(ApiService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should perform GET and return data', () => {
    const testData = { foo: 'bar' };

    service.get<{ foo: string }>('test').subscribe(data => {
      expect(data).toEqual(testData);
    });

    const req = httpMock.expectOne('/api/test');
    expect(req.request.method).toBe('GET');
    req.flush(testData);
  });

  it('should propagate error and call checkServerAvailability on non-504 failure', async () => {
    // spy on the private method via a typed helper interface
    interface ApiInternal { checkServerAvailability: () => void; }
    const spyTarget = service as unknown as ApiInternal;
    const spy = vi.spyOn(spyTarget, 'checkServerAvailability');

    const obs$ = service.get('error');
    const resultPromise = firstValueFrom(obs$);
    const req = httpMock.expectOne('/api/error');
    req.flush('Server error', { status: 500, statusText: 'Server Error' });

    await expect(resultPromise).rejects.toBeTruthy();
    expect(spy).toHaveBeenCalled();
  });

  it('setApiUrl should switch base path', () => {
    expect(service.getApiUrl()).toBe('/api');
    service.setApiUrl('Go');
    expect(service.getApiUrl()).toBe('/api-go');
    service.setApiUrl('Nest');
    expect(service.getApiUrl()).toBe('/api');
  });

  it('should normalize headers and options when provided', () => {
    const opts: ApiOptions = { headers: { 'X-Test': '1' }, withCredentials: false };
    const full = (service as unknown as { normalizeOptions(opts?: ApiOptions): ApiOptions }).normalizeOptions(opts);
    expect(full.headers).toBeTruthy();
    expect(full.withCredentials).toBe(false);
  });
});
