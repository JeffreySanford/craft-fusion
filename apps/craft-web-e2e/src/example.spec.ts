import { test, expect } from '@playwright/test';

test('has title', async ({ page }) => {
  await page.goto('/');

  // Expect h1 to contain a substring.
  const h1Text = await page.locator('h1').innerText();
  expect(h1Text.replace(/\s+/g, '')).toContain('JeffreySanford');
});
