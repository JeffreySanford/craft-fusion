import { test, expect } from '@playwright/test';

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

test.describe('Admin dashboard tabs', () => {
  test.beforeAll(() => {
    const projectName = test.info().project.name;
    if (['mobile-chrome', 'mobile-safari', 'tablet'].includes(projectName)) {
      test.skip();
    }
  });
  const tabNames = [
    { name: 'Overview', selector: 'app-admin-landing' },
    { name: 'Performance', selector: 'app-performance-dashboard' },
    { name: 'Security & Access', selector: 'app-security-dashboard' },
    { name: 'Logs', selector: 'app-logs-dashboard' },
  ];

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
  });

  for (const tab of tabNames) {
    test(`renders ${tab.name} tab`, async ({ page }) => {
      await page.getByRole('tab', { name: tab.name }).click({ force: true });
      await page.waitForSelector(tab.selector, { timeout: 10000 });
      await expect(page.getByRole('tab', { name: tab.name })).toHaveAttribute('aria-selected', 'true');
    });
  }

  test('cycles through tabs in sequence', async ({ page }) => {
    for (const tab of tabNames) {
      await page.getByRole('tab', { name: tab.name }).click({ force: true });
      await page.waitForSelector(tab.selector, { timeout: 10000 });
      await expect(page.getByRole('tab', { name: tab.name })).toHaveAttribute('aria-selected', 'true');
      await page.waitForTimeout(300);
    }
    await expect(page.getByRole('tab', { name: 'Logs' })).toHaveAttribute('aria-selected', 'true');
  });
});
