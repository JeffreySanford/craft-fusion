import { test, expect } from '@playwright/test';
import { loginAsAdmin } from './support/auth';
import { waitForAdminShell } from './support/admin';
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
    await waitForAdminShell(page);
    try {
      await page.waitForSelector('text=System Administration', { timeout: 5000 });
    } catch {
      // Some viewports render alternate text so swallow the timeout.
    }
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

test.describe('OSCAL catalog sync panel', () => {
  const initialStatus = {
    lastUpdated: '2026-01-08T15:00:00.000Z',
    sources: {
      fedramp: {
        version: 'Rev 5',
        status: 'synced',
        lastChecked: '2026-01-08T15:00:00.000Z',
      },
      nist: {
        version: 'SP 800-37 Rev 2',
        status: 'synced',
        lastChecked: '2026-01-08T15:05:00.000Z',
      },
    },
    progress: {
      status: 'idle',
      value: 100,
      message: 'Synced',
    },
  };

  const refreshedStatus = {
    lastUpdated: '2026-01-09T10:30:00.000Z',
    sources: {
      fedramp: {
        version: 'Rev 5',
        status: 'synced',
        lastChecked: '2026-01-09T10:28:00.000Z',
      },
      nist: {
        version: 'SP 800-37 Rev 2',
        status: 'synced',
        lastChecked: '2026-01-09T10:29:00.000Z',
      },
    },
    progress: {
      status: 'idle',
      value: 100,
      message: 'Catalogs refreshed',
    },
  };

  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page, '/admin');
    await page.waitForSelector('app-admin-shell', { timeout: 45000 });
    // Some viewports render the header without the exact 'System Administration' text.
    // Still ensure the header is ready when the text is available.
    try {
      await page.waitForSelector('text=System Administration', { timeout: 5000 });
    } catch {
      // It's OK if the localized header text is missing; shell readiness is confirmed above.
    }
    await page.route('**/security/oscal-updates', route =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(initialStatus),
      }),
    );
    await page.route('**/security/oscal-updates/refresh', route =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(refreshedStatus),
      }),
    );
    await page.getByRole('tab', { name: 'Security & Access' }).click({ force: true });
    await page.waitForSelector('app-security-dashboard .oscal-update-panel', { timeout: 10000 });
  });

  test('displays the catalog sync metadata', async ({ page }) => {
    await expect(page.getByText('Catalog sync')).toBeVisible();
    await expect(page.getByText('FedRAMP')).toBeVisible();
    await expect(page.getByText('NIST RMF')).toBeVisible();
    await expect(page.locator('.update-progress-note')).toHaveText(initialStatus.progress.message);
  });

  test('refresh button triggers catalog sync and updates the UI', async ({ page }) => {
    const refreshButton = page.getByRole('button', { name: /Refresh catalogs/i });
    const refreshResponse = page.waitForResponse(response =>
      response.url().endsWith('/security/oscal-updates/refresh') && response.request().method() === 'POST',
    );

    await refreshButton.click();
    await expect(refreshButton).toHaveText('Updating catalogs…');
    await refreshResponse;
    await expect(refreshButton).toHaveText('Refresh catalogs');
    await expect(page.locator('.update-progress-note')).toHaveText(refreshedStatus.progress.message);
  });
});
