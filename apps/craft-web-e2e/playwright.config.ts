import { defineConfig, devices } from '@playwright/test';
import { nxE2EPreset } from '@nx/playwright/preset';
import { workspaceRoot } from '@nx/devkit';

export default defineConfig({
  ...nxE2EPreset(__filename, { testDir: './src' }),

  // Global timeout
  timeout: 30000,
  expect: {
    timeout: 5000,
  },

  // Test retry and workers
  workers: process.env.CI ? 1 : undefined,
  retries: process.env.CI ? 2 : 0,
  fullyParallel: !process.env.CI,

  use: {
    baseURL: 'localhost:4200',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    trace: 'retain-on-failure',

    // Browser configuration
    viewport: { width: 1280, height: 720 },
    ignoreHTTPSErrors: true,
    actionTimeout: 10000,

    // Authentication state
    storageState: 'playwright/.auth/user.json',
  },

  webServer: {
    command: 'npx nx run craft-web:serve',
    url: 'http://localhost:4200',
    reuseExistingServer: !process.env['CI'],
    timeout: 120000,
    cwd: workspaceRoot,
  },

  projects: [
    {
      name: 'setup',
      testMatch: /.*\.setup\.ts/,
    },
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 1280, height: 720 },
      },
      dependencies: ['setup'],
    },
    {
      name: 'firefox',
      use: {
        ...devices['Desktop Firefox'],
        viewport: { width: 1280, height: 720 },
      },
      dependencies: ['setup'],
    },
    {
      name: 'webkit',
      use: {
        ...devices['Desktop Safari'],
        viewport: { width: 1280, height: 720 },
      },
      dependencies: ['setup'],
    },
    {
      name: 'mobile-chrome',
      use: {
        ...devices['Pixel 5'],
      },
      dependencies: ['setup'],
    },
    {
      name: 'mobile-safari',
      use: {
        ...devices['iPhone 12'],
      },
      dependencies: ['setup'],
    },
    {
      name: 'tablet',
      use: {
        ...devices['iPad Pro 11'],
      },
      dependencies: ['setup'],
    },
  ],

  reporter: [['html'], ['json', { outputFile: 'playwright-report/test-results.json' }], ['junit', { outputFile: 'playwright-report/junit.xml' }]],

  // Output folder
  outputDir: 'playwright/test-results',

  // Global setup
  // This will test the login page and the authentication of
  // a test user here.  It has been commented out for now.

  // globalSetup: require.resolve('./global-setup.ts'),
  // globalTeardown: require.resolve('./global-teardown'),
});
