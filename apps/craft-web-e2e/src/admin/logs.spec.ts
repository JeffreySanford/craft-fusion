import { test, expect } from '@playwright/test';

test.describe('Admin - Logs controls visibility', () => {
  test.beforeAll(() => {
    const projectName = test.info().project.name;
    if (['mobile-chrome', 'mobile-safari', 'tablet'].includes(projectName)) {
      test.skip();
    }
  });

  const adminUser = {
    id: 1,
    username: 'admin',
    name: 'Admin User',
    firstName: 'Admin',
    lastName: 'User',
    email: 'admin@example.com',
    roles: ['admin'],
    permissions: ['user:read', 'user:write', 'admin:access'],
    role: 'admin',
  };

  const authResponse = {
    success: true,
    token: 'playwright-admin-token',
    refreshToken: 'playwright-admin-refresh',
    expiresIn: 3600,
    user: adminUser,
  };

  test.beforeEach(async ({ page }) => {
    await page.route('**/api/auth/login', route =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(authResponse),
      }),
    );
    await page.route('**/api/auth/user', route =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(adminUser),
      }),
    );

    await page.addInitScript(
      admin => {
        const expiresAt = Date.now() + 60 * 60 * 1000;
        sessionStorage.setItem('auth_token', 'playwright-admin-token');
        sessionStorage.setItem('auth_refresh_token', 'playwright-admin-refresh');
        sessionStorage.setItem('auth_token_expires', expiresAt.toString());
        (window as any).__PLAYWRIGHT_ADMIN_USER = admin;
        (window as any).__PLAYWRIGHT_AUTH_TOKEN = 'playwright-admin-token';
        (window as any).__PLAYWRIGHT_AUTH_REFRESH = 'playwright-admin-refresh';
        (window as any).__PLAYWRIGHT_AUTH_EXPIRES_IN = 3600;
        (window as any).__SKIP_ADMIN_GUARD = true;
        (window as any).__SKIP_AUTH_GUARD = true;
        (window as any).__SKIP_ADMIN_REDIRECT = true;
      },
      adminUser,
    );

    await page.goto('/');
    await page.goto('/admin');
    await page.waitForSelector('text=System Administration', { timeout: 30000 });

    const logsTab = page.getByRole('tab', { name: 'Logs' });
    await expect(logsTab).toBeVisible({ timeout: 5000 });
    await logsTab.click();
    await page.locator('.logger-tab').waitFor({ state: 'visible', timeout: 5000 });
  });

  test('all floating labels and mat-labels are visible', async ({ page }) => {
    const labelLocator = page.locator('.logger-tab mat-form-field .mdc-floating-label, .logger-tab mat-form-field mat-label');
    const count = await labelLocator.count();
    await expect(count).toBeGreaterThan(0);
    for (let i = 0; i < count; i++) {
      await expect(labelLocator.nth(i)).toBeVisible();
    }
  });

  test('selects, inputs and action buttons are present and visible', async ({ page }) => {
    const selectTrigger = page.locator('.logger-tab .mat-mdc-select-trigger, .logger-tab mat-select');
    await expect(selectTrigger.first()).toBeVisible();

    const inputs = page.locator('.logger-tab input, .logger-tab textarea, .logger-tab .mat-mdc-input-element');
    await expect(inputs.first()).toBeVisible();

    const clearBtn = page.getByRole('button', { name: /Clear Logs|Clear metrics|Clear Metrics/i }).first();
    await expect(clearBtn).toBeVisible();
  });
});
