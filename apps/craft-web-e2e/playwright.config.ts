import { defineConfig, devices } from '@playwright/test';
import { nxE2EPreset } from '@nx/playwright/preset';
import { workspaceRoot } from '@nx/devkit';

const runBundledBrowsers =
  Boolean(process.env['CI']) ||
  process.env['PLAYWRIGHT_FULL_BROWSERS'] === 'true';

export default defineConfig({
  ...nxE2EPreset(__filename, { testDir: './src' }),

  // Global timeout
  timeout: 60000,
  expect: {
    timeout: 10000,
  },

  // Test retry and workers
  workers: process.env.CI ? 1 : undefined,
  retries: process.env.CI ? 2 : 1,
  fullyParallel: !process.env.CI,

  use: {
    baseURL: 'http://localhost:4200',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    trace: 'retain-on-failure',

    // Browser configuration
    viewport: { width: 1280, height: 720 },
    ignoreHTTPSErrors: true,
    actionTimeout: 10000,

  },

  webServer: [
    {
      command: 'pnpm nx run craft-nest:serve',
      url: 'http://localhost:3000/api/health',
      reuseExistingServer: !process.env['CI'],
      timeout: 120000,
      cwd: workspaceRoot,
    },
    {
      command: 'pnpm nx run craft-web:serve --hmr=false',
      url: 'http://localhost:4200',
      reuseExistingServer: !process.env['CI'],
      timeout: 120000,
      cwd: workspaceRoot,
      env: {
        BROWSERSLIST_IGNORE_OLD_DATA: 'true',
        NG_BUILD_CACHE: '0',
      },
    },
  ],

  projects: [
    {
      name: 'setup',
      testMatch: /.*\.setup\.ts/,
    },
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        channel: runBundledBrowsers ? undefined : 'chrome',
        viewport: { width: 1280, height: 720 },
      },
      dependencies: ['setup'],
    },
    ...(runBundledBrowsers ? [{
      name: 'firefox',
      use: {
        ...devices['Desktop Firefox'],
        viewport: { width: 1280, height: 720 },
      },
      dependencies: ['setup'],
    }, {
      name: 'webkit',
      use: {
        ...devices['Desktop Safari'],
        viewport: { width: 1280, height: 720 },
      },
      dependencies: ['setup'],
    }] : []),
    {
      name: 'mobile-chrome',
      use: {
        ...devices['Pixel 5'],
        channel: runBundledBrowsers ? undefined : 'chrome',
      },
      dependencies: ['setup'],
    },
    ...(runBundledBrowsers ? [{
      name: 'mobile-safari',
      use: {
        ...devices['iPhone 12'],
      },
      dependencies: ['setup'],
    }] : []),
    {
      name: 'tablet',
      use: runBundledBrowsers
        ? devices['iPad Pro 11']
        : {
            ...devices['Desktop Chrome'],
            channel: 'chrome',
            viewport: { width: 834, height: 1194 },
            hasTouch: true,
            isMobile: true,
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
