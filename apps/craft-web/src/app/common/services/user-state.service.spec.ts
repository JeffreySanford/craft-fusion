import { TestBed } from '@angular/core/testing';
import { describe, it, expect, beforeEach } from 'vitest';
import { UserStateService } from './user-state.service';

describe('UserStateService', () => {
  let service: UserStateService;
  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [UserStateService] });
    service = TestBed.inject(UserStateService);
  });
  it('should be created', () => expect(service).toBeTruthy());
});