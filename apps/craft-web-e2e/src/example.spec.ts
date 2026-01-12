import { test, expect } from '@playwright/test';

test('has title', async ({ page }) => {
  await page.goto('/');

  // Expect h1 to contain the developer name.
  await expect(page.locator('h1')).toContainText(/Jeffrey\s*Sanford/i);
});
