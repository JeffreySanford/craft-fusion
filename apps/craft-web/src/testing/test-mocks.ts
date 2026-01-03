import { Router } from '@angular/router';
import { of } from 'rxjs';

export class MockLoggerService {
  debug = jest.fn();
  info = jest.fn();
  warn = jest.fn();
  error = jest.fn();
  setLevel = jest.fn();
  getLevel = jest.fn();
}

export const mockRouter = {
  navigate: jest.fn(),
  url: '/',
  events: of(),
} as unknown as Router;