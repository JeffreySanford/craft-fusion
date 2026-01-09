import { defineConfig, devices } from '@playwright/test';
import { nxE2EPreset } from '@nx/playwright/preset';
import { workspaceRoot } from '@nx/devkit';
import * as path from 'path';

export default defineConfig({
  ...nxE2EPreset(__filename, { testDir: './src' }),

  // Global timeout
  timeout: 60000, // Increased from 30000
  expect: {
    timeout: 10000, // Increased from 5000
  },

  // Test retry and workers
  workers: process.env['CI'] ? 1 : undefined,
  retries: process.env['CI'] ? 3 : 1, // Increase CI retries to handle flakiness
  fullyParallel: !process.env['CI'],

  use: {
    baseURL: process.env['WEB_URL'] || 'http://localhost:4200',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    trace: 'retain-on-failure',

    // Browser configuration
    viewport: { width: 1280, height: 720 },
    ignoreHTTPSErrors: true,
    actionTimeout: 10000,

    // Authentication handled per-test via beforeEach hooks
    // (HTTP-only cookies don't persist in storageState)
  },

  webServer: {
    command: 'pnpm dlx nx run craft-web:serve',
    url: 'http://localhost:4200',
    reuseExistingServer: !process.env['CI'],
    timeout: 120000,
    cwd: workspaceRoot,
  },

  projects: [
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 1280, height: 720 },
      },
    },
    {
      name: 'firefox',
      use: {
        ...devices['Desktop Firefox'],
        viewport: { width: 1280, height: 720 },
      },
    },
    {
      name: 'webkit',
      use: {
        ...devices['Desktop Safari'],
        viewport: { width: 1280, height: 720 },
      },
    },
    {
      name: 'mobile-chrome',
      use: {
        ...devices['Pixel 5'],
      },
    },
    {
      name: 'mobile-safari',
      use: {
        ...devices['iPhone 12'],
      },
    },
    {
      name: 'tablet',
      use: {
        ...devices['iPad Pro 11'],
      },
    },
  ],

  reporter: [['html'], ['json', { outputFile: 'playwright-report/test-results.json' }], ['junit', { outputFile: 'playwright-report/junit.xml' }]],

  // Output folder
  outputDir: 'playwright/test-results',

  // Global setup
  // This will test the login page and the authentication of
  // a test user here.  It has been commented out for now.

  globalSetup: require.resolve('./global-setup.ts'),
  globalTeardown: require.resolve('./global-teardown'),
});
