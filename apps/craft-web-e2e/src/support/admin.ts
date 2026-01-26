import { Page, Locator } from '@playwright/test';

const ADMIN_TIMEOUT = 60000;

async function clickAdminNavIfPresent(page: Page) {
  const navButton = page.getByRole('button', { name: 'Admin' });
  if ((await navButton.count()) > 0) {
    try {
      await navButton.first().click({ force: true });
      return true;
    } catch {
      return false;
    }
  }
  return false;
}

export async function waitForAdminShell(page: Page): Promise<void> {
  // Wait for the router to land on /admin first
  await page.waitForURL(/\/admin/, { timeout: ADMIN_TIMEOUT });

  // Try a couple of times to detect the admin shell — some flakes redirect
  // back to the landing page briefly; if that happens, attempt a manual
  // nav click and retry.
  const attempts = 3;
  const checkAdmin = async (): Promise<boolean> => {
    const adminLocator: Locator = page.locator('app-admin');
    try {
      await adminLocator.waitFor({ state: 'visible', timeout: 5000 });
      await page.waitForSelector('.admin-container', { state: 'visible', timeout: 5000 });
      return true;
    } catch (e) {
      return false;
    }
  };

  for (let i = 0; i < attempts; i++) {
    if (await checkAdmin()) return;

    // If admin shell not present, try to click the Admin nav (fallback)
    await clickAdminNavIfPresent(page);
    // small back-off before retrying
    await page.waitForTimeout(700);
  }

  // Final attempt with the full ADMIN_TIMEOUT so existing failures keep the
  // original timeout semantics for debugging.
  await page.waitForSelector('app-admin', { state: 'visible', timeout: ADMIN_TIMEOUT });
  await page.waitForSelector('.admin-container', { state: 'visible', timeout: ADMIN_TIMEOUT });

  const spinner = page.locator('mat-progress-spinner');
  if ((await spinner.count()) > 0) {
    await spinner.waitFor({ state: 'hidden', timeout: 10000 });
  }
}
