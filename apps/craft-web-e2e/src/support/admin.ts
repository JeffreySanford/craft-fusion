import { Page } from '@playwright/test';

const ADMIN_TIMEOUT = 60000;

export async function waitForAdminShell(page: Page): Promise<void> {
  await page.waitForURL(/\/admin/, { timeout: ADMIN_TIMEOUT });
  await page.waitForSelector('app-admin', { state: 'visible', timeout: ADMIN_TIMEOUT });
  await page.waitForSelector('.admin-container', { state: 'visible', timeout: ADMIN_TIMEOUT });

  const spinner = page.locator('mat-progress-spinner');
  if ((await spinner.count()) > 0) {
    await spinner.waitFor({ state: 'hidden', timeout: 10000 });
  }
}
