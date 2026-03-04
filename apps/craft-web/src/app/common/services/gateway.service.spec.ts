import { TestBed } from '@angular/core/testing';
import { describe, it, expect, beforeEach } from 'vitest';
import { GatewayService } from './gateway.service';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { LoggerService } from './logger.service';
import { NotificationService } from './notification.service';
import { firstValueFrom } from 'rxjs';

describe('GatewayService', () => {
  let service: GatewayService;
  let httpMock: HttpTestingController;
  let notification: NotificationService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [GatewayService, LoggerService, NotificationService],
    });
    service = TestBed.inject(GatewayService);
    httpMock = TestBed.inject(HttpTestingController);
    notification = TestBed.inject(NotificationService);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('get wrapper should perform GET', () => {
    const data = { ok: true };
    service.get('/foo').subscribe(res => expect(res).toEqual(data));
    const req = httpMock.expectOne('/api/foo');
    expect(req.request.method).toBe('GET');
    req.flush(data);
  });

  it('request with unsupported method should error', async () => {
    await expect(firstValueFrom(service.request('TRACE' as unknown as string, '/foo'))).rejects.toMatchObject({
      message: expect.stringContaining('Unsupported HTTP method'),
    });
  });
});
