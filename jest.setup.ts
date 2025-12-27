// Lightweight Jest setup that uses dynamic imports to load Angular's ESM testing modules
// This avoids "Cannot use import statement outside a module" errors when requiring .mjs files in Node/CJS
require('zone.js');
require('zone.js/testing');

// polyfill TextEncoder/TextDecoder if missing
const _util = require('util');
if (typeof globalThis.TextEncoder === 'undefined') {
  globalThis.TextEncoder = _util.TextEncoder;
  globalThis.TextDecoder = _util.TextDecoder;
}

// Async IIFE to import Angular ESM testing modules using dynamic import()
(async () => {
  const ngTesting = await import('@angular/core/testing');
  const platform = await import('@angular/platform-browser-dynamic/testing');

  const { getTestBed } = ngTesting;
  const { BrowserDynamicTestingModule, platformBrowserDynamicTesting } = platform;

  // ngJest options may be present on globalThis; cast to any to avoid TS index errors
  const testEnvironmentOptions = (globalThis as any).ngJest?.testEnvironmentOptions ?? Object.create(null);

  getTestBed().initTestEnvironment(
    [BrowserDynamicTestingModule],
    platformBrowserDynamicTesting(),
    testEnvironmentOptions,
  );
})();
