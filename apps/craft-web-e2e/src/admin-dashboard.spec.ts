import { test, expect } from '@playwright/test';
import { loginAsAdmin } from './support/auth';
const tabNames = [
  { name: 'Overview', selector: 'app-admin-landing' },
  { name: 'Performance', selector: 'app-performance-dashboard' },
  { name: 'Security & Access', selector: 'app-security-dashboard' },
  { name: 'Logs', selector: 'app-logs-dashboard' },
];

test.describe('Admin dashboard tabs', () => {
  test.beforeAll(() => {
    const projectName = test.info().project.name;
    if (['mobile-chrome', 'mobile-safari', 'tablet'].includes(projectName)) {
      test.skip();
    }
  });

  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page, '/admin');
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
