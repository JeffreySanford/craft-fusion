import { test, expect } from '@playwright/test';
import { loginAsAdmin } from '../support/auth';
test.describe('Admin - Logs controls visibility', () => {
  test.beforeAll(() => {
    const projectName = test.info().project.name;
    if (['mobile-chrome', 'mobile-safari', 'tablet'].includes(projectName)) {
      test.skip();
    }
  });

  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page, '/admin');
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
