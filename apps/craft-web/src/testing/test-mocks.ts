import { Router } from '@angular/router';
import { of } from 'rxjs';

const createMockFn = () => {
  const globalAny = globalThis as unknown as { jest?: { fn: () => unknown }; vi?: { fn: () => unknown } };
  if (globalAny.jest?.fn) {
    return globalAny.jest.fn.bind(globalAny.jest);
  }
  if (globalAny.vi?.fn) {
    return globalAny.vi.fn.bind(globalAny.vi);
  }
  return () => () => undefined;
};

const mockFn = createMockFn();

export class MockLoggerService {
  debug = mockFn();
  info = mockFn();
  warn = mockFn();
  error = mockFn();
  setLevel = mockFn();
  getLevel = mockFn();
}

export const mockRouter = {
  navigate: mockFn(),
  url: '/',
  events: of(),
} as unknown as Router;
