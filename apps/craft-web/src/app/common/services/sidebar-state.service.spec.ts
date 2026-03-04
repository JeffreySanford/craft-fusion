import { TestBed } from '@angular/core/testing';
import { describe, it, expect, beforeEach } from 'vitest';
import { SidebarStateService } from './sidebar-state.service';

describe('SidebarStateService', () => {
  let service: SidebarStateService;
  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [SidebarStateService] });
    service = TestBed.inject(SidebarStateService);
  });
  it('should be created', () => expect(service).toBeTruthy());
});