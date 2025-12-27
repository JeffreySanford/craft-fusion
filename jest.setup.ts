// Lightweight Jest setup that uses dynamic imports to load Angular's ESM testing modules
// This avoids "Cannot use import statement outside a module" errors when requiring .mjs files in Node/CJS
// Use dynamic imports for ESM-friendly setup (works when running Jest in ESM mode)
// Import Zone.js polyfills first
(async () => {
  await import('zone.js');
  await import('zone.js/testing');

  // polyfill TextEncoder/TextDecoder if missing
  const util = await import('util');
  if (typeof (globalThis as any).TextEncoder === 'undefined') {
    (globalThis as any).TextEncoder = (util as any).TextEncoder;
    (globalThis as any).TextDecoder = (util as any).TextDecoder;
  }

  // Import Angular testing runtime modules via dynamic import
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
