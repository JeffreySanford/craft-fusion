import { TestBed } from '@angular/core/testing';
import { WebsocketService } from './websocket.service';

describe('WebsocketService', () => {
  let service: WebsocketService;
  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [WebsocketService] });
    service = TestBed.inject(WebsocketService);
  });
  it('should be created', () => expect(service).toBeTruthy());
});