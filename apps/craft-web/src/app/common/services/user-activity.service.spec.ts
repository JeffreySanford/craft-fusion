import { TestBed } from '@angular/core/testing';
import { describe, it, expect, beforeEach } from 'vitest';
import { UserActivityService } from './user-activity.service';

describe('UserActivityService', () => {
  let service: UserActivityService;
  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [UserActivityService] });
    service = TestBed.inject(UserActivityService);
  });
  it('should be created', () => expect(service).toBeTruthy());
});