import { test, expect } from '@playwright/test';

const adminUser = {
  id: 'admin-user',
  username: 'admin',
  name: 'Admin User',
  firstName: 'Admin',
  lastName: 'User',
  email: 'admin@example.com',
  role: 'admin',
};

const timelineEvents = [
  {
    _id: 'event-1',
    title: 'First Broadcast',
    description:
      'This event shares a detailed story about the early launch that expanded the timeline across the blue spine.',
    date: '2020-01-01T12:00:00.000Z',
    type: 'historical',
    person: 'jeffrey-sanford',
    imageUrl: 'https://example.com/legacy.jpg',
    actionLink: 'https://example.com/story',
  },
  {
    _id: 'event-2',
    title: 'Second Milestone',
    description: 'A shorter description for the follow-up milestone.',
    date: '2021-05-12T09:30:00.000Z',
    type: 'personal',
    person: 'jeffrey-sanford',
  },
];

test.describe('Timeline experience', () => {
  test.beforeAll(() => {
    const projectName = test.info().project.name;
    if (['mobile-chrome', 'mobile-safari', 'tablet'].includes(projectName)) {
      test.skip();
    }
  });
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      sessionStorage.setItem('auth_token', 'playwright-admin-token');
      sessionStorage.setItem('auth_refresh_token', 'playwright-admin-refresh');
      sessionStorage.setItem('auth_token_expires', (Date.now() + 3600 * 1000).toString());
      (window as any).__SKIP_ADMIN_GUARD = true;
      (window as any).__SKIP_AUTH_GUARD = true;
      (window as any).__SKIP_ADMIN_REDIRECT = true;
    });

    await page.route('**/api/timeline**', route =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(timelineEvents),
      }),
    );

    await page.route('**/api/auth/user', route =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(adminUser),
      }),
    );
  });

  test('expands an event card when Read more is clicked', async ({ page }) => {
    await page.goto('/timeline');

    const personSelect = page.getByRole('combobox', { name: 'Select Person' });
    await personSelect.click();
    await page.getByRole('option', { name: 'Jeffrey Sanford' }).click();

    await page.waitForSelector('app-timeline-item', { timeout: 15000 });
    const firstCard = page.locator('app-timeline-item').first();
    const readMore = firstCard.getByRole('button', { name: /Read more/i });

    await expect(readMore).toBeVisible();
    await readMore.click();
    const showLess = firstCard.getByRole('button', { name: /Show less/i });
    await expect(showLess).toBeVisible();
    await expect(firstCard.locator('.timeline-item-card--expanded')).toHaveCount(1);
    await expect(firstCard.locator('.timeline-item-description--expanded')).toHaveCount(1);
    await expect(firstCard.getByText('This event shares a detailed story about the early launch')).toBeVisible();
  });
});
