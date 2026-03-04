import { TestBed } from '@angular/core/testing';
import { describe, it, expect, beforeEach } from 'vitest';
import { SocketClientService } from './socket-client.service';

describe('SocketClientService', () => {
  let service: SocketClientService;
  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [SocketClientService] });
    service = TestBed.inject(SocketClientService);
  });
  it('should be created', () => expect(service).toBeTruthy());
});