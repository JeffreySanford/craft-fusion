import '@analogjs/vitest-angular/setup-zone';
import { vi } from 'vitest';

(globalThis as any).jest = vi;

import {
  BrowserDynamicTestingModule,
  platformBrowserDynamicTesting,
} from '@angular/platform-browser-dynamic/testing';
import { getTestBed } from '@angular/core/testing';

getTestBed().initTestEnvironment(
  BrowserDynamicTestingModule,
  platformBrowserDynamicTesting()
);

const originalFetch = globalThis.fetch?.bind(globalThis);

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

  if (originalFetch) {
    return originalFetch(input, init);
  }

  return new Response('', { status: 200, statusText: 'OK' });
}) as typeof fetch;
