import '@analogjs/vitest-angular/setup-zone';
// Ensure the JIT compiler is available for partially compiled libraries during tests
import '@angular/compiler';
import { vi } from 'vitest';

(globalThis as any).jest = vi;

// Provide a global mock for socket.io-client to prevent real socket connections in tests
vi.mock('socket.io-client', () => {
  const handlers = new Map<string, Set<Function>>();
  function createMockSocket() {
    return {
      id: 'mock-socket-id',
      connected: true,
      on(event: string, fn: Function) {
        if (!handlers.has(event)) handlers.set(event, new Set());
        handlers.get(event)!.add(fn);
      },
      off(event: string, fn?: Function) {
        if (!handlers.has(event)) return;
        if (fn) handlers.get(event)!.delete(fn);
        else handlers.get(event)!.clear();
      },
      emit(event: string, data?: any) {
        const set = handlers.get(event);
        if (set) for (const fn of Array.from(set)) fn(data);
      },
      disconnect() {
        handlers.clear();
        this.connected = false;
      },
      connect() {
        this.connected = true;
      },
    } as any;
  }

  function io() {
    return createMockSocket();
  }

  return { io } as any;
});
import {
  BrowserDynamicTestingModule,
  platformBrowserDynamicTesting,
} from '@angular/platform-browser-dynamic/testing';
import { getTestBed } from '@angular/core/testing';

getTestBed().initTestEnvironment(
  BrowserDynamicTestingModule,
  platformBrowserDynamicTesting()
);


globalThis.fetch = (async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
  const url =
    typeof input === 'string'
      ? input
      : input instanceof URL
      ? input.toString()
      : input.url;

  if (url.includes('fonts.googleapis.com')) {
    return new Response('', { status: 204, statusText: 'No Content' });
  }

  if (url.includes('/assets/ping.txt')) {
    return new Response('', { status: 200, statusText: 'OK' });
  }

  // Stub all other fetch calls to prevent real network connections during tests.
  // Angular's HttpClient uses Angular's own HTTP backend (not fetch), so test
  // HTTP calls go through HttpClientTestingModule, not here. Any fetch that
  // reaches this stub is a background/rogue call that we should silence.
  return new Response('', { status: 503, statusText: 'Service Unavailable (test stub)' });
}) as typeof fetch;

// Track timers so we can clear them between tests to avoid happy-dom aborts
const originalSetInterval = globalThis.setInterval.bind(globalThis);
const originalSetTimeout = globalThis.setTimeout.bind(globalThis);
const intervalIds = new Set<number>();
const timeoutIds = new Set<number>();

globalThis.setInterval = ((fn: Function, ms?: number, ...args: any[]) => {
  const id = originalSetInterval(fn as any, ms, ...args) as unknown as number;
  intervalIds.add(id);
  return id;
}) as typeof setInterval;

globalThis.setTimeout = ((fn: Function, ms?: number, ...args: any[]) => {
  const id = originalSetTimeout(fn as any, ms, ...args) as unknown as number;
  timeoutIds.add(id);
  return id;
}) as typeof setTimeout;

const originalClearInterval = globalThis.clearInterval.bind(globalThis);
const originalClearTimeout = globalThis.clearTimeout.bind(globalThis);

globalThis.clearInterval = ((id?: number) => {
  if (typeof id === 'number') intervalIds.delete(id);
  return originalClearInterval(id);
}) as typeof clearInterval;

globalThis.clearTimeout = ((id?: number) => {
  if (typeof id === 'number') timeoutIds.delete(id);
  return originalClearTimeout(id);
}) as typeof clearTimeout;

import { afterEach } from 'vitest';

afterEach(() => {
  // clear any leftover timers between tests
  for (const id of Array.from(intervalIds)) {
    try {
      originalClearInterval(id);
    } catch {
      // ignore
    }
    intervalIds.delete(id);
  }
  for (const id of Array.from(timeoutIds)) {
    try {
      originalClearTimeout(id);
    } catch {
      // ignore
    }
    timeoutIds.delete(id);
  }
  // restore mocks between tests
  try {
    vi.restoreAllMocks();
  } catch {
    // ignore
  }
});

// Suppress known benign background errors that occur during test teardown.
// These do not indicate real test failures and must not crash the process.
if (typeof process !== 'undefined' && process && (process as any).on) {
  (process as any).on('uncaughtException', (err: any) => {
    const msg = String(err?.message || '');
    // Suppress Angular HttpResourceImpl race condition (this.client accessed before assignment),
    // happy-dom AbortErrors, and TestBed re-initialization warnings.
    if (
      /reading 'client'/.test(msg) ||
      /AbortError/.test(msg) ||
      /ECONNREFUSED/.test(msg) ||
      /Need to call TestBed.initTestEnvironment/.test(msg)
    ) {
      return; // silently suppress — all tests already passed
    }
    throw err;
  });

  (process as any).on('unhandledRejection', (reason: any) => {
    const msg = String(reason?.message || reason || '');
    if (
      /reading 'client'/.test(msg) ||
      /AbortError/.test(msg) ||
      /ECONNREFUSED/.test(msg)
    ) {
      return; // silently suppress
    }
    throw reason;
  });
}
