import { TestBed } from '@angular/core/testing';
import { describe, it, expect, beforeEach } from 'vitest';
import { FooterStateService } from './footer-state.service';

describe('FooterStateService', () => {
  let service: FooterStateService;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [FooterStateService] });
    service = TestBed.inject(FooterStateService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should toggle and set expanded state', () => {
    expect(service.isExpanded()).toBe(false);
    service.setExpanded(true);
    expect(service.isExpanded()).toBe(true);
    service.toggleExpanded();
    expect(service.isExpanded()).toBe(false);
  });
});
