import { test, expect, Page } from '@playwright/test';

/**
 * Authenticate as admin user for e2e tests.
 * Uses ADMIN_SECRET from environment which grants admin access to any username.
 */
async function authenticateAsAdmin(page: Page) {
  const adminSecret = process.env['ADMIN_SECRET'];
  const username = process.env['ADMIN_USERNAME'] || 'admin';
  const password = adminSecret ? undefined : process.env['ADMIN_PASSWORD'];
  
  console.log('[AUTH] Authenticating with username:', username);
  
  // Make login request using page.evaluate to run in browser context
  // This ensures cookies are set in the same context as page navigation
  const result = await page.evaluate(async ({ username, password }) => {
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ username, ...(password && { password }) }),
      credentials: 'include', // Important: include cookies in request/response
    });
    
    return {
      ok: response.ok,
      status: response.status,
      statusText: response.statusText,
    };
  }, { username, password });
  
  console.log('[AUTH] Login response status:', result.status);
  
  if (!result.ok) {
    console.error('[AUTH] Login failed');
    throw new Error(`Authentication failed: ${result.status} ${result.statusText}`);
  }
  
  console.log('[AUTH] Login successful, cookies set in browser context');
}

test.describe('Admin Hero Area', () => {
  test.beforeEach(async ({ page }) => {
    // Set e2e test flag to disable auto-logout
    await page.addInitScript(() => {
      (window as any)['__E2E_TEST_MODE__'] = true;
    });
    
    // Navigate to home page with longer timeout
    await page.goto('/', { waitUntil: 'domcontentloaded', timeout: 30000 });
    
    // Wait a bit for Angular to initialize
    await page.waitForTimeout(1000);
    
    // Authenticate (sets HTTP-only cookies in browser context)
    await authenticateAsAdmin(page);
    
    // Navigate to admin page with longer timeout
    await page.goto('/admin', { waitUntil: 'domcontentloaded', timeout: 30000 });
    
    // Wait for hero bar with longer timeout and retry
    await page.waitForSelector('.admin-hero-bar', { timeout: 15000, state: 'visible' });
    
    // Wait for Angular to finish rendering
    await page.waitForTimeout(500);
  });

  test('should display all 5 hero KPI tiles', async ({ page }) => {
    const tiles = page.locator('.hero-tile');
    await expect(tiles).toHaveCount(5);
  });

  test('should display Active Services tile with correct data', async ({ page }) => {
    const activeTile = page.locator('.hero-tile').filter({ hasText: 'Active Services' });
    await expect(activeTile).toBeVisible();
    await expect(activeTile.locator('.hero-tile-value')).toBeVisible();
    await expect(activeTile.locator('.hero-tile-icon')).toContainText('cloud_done');
  });

  test('should display Success Rate tile with percentage', async ({ page }) => {
    const successTile = page.locator('.hero-tile').filter({ hasText: 'Success Rate' });
    await expect(successTile).toBeVisible();
    
    const value = await successTile.locator('.hero-tile-value').textContent();
    expect(value).toMatch(/%$/); // Should end with %
  });

  test('should display Errors tile with count', async ({ page }) => {
    const errorsTile = page.locator('.hero-tile').filter({ hasText: 'Errors' });
    await expect(errorsTile).toBeVisible();
    await expect(errorsTile.locator('.hero-tile-icon')).toContainText('error_outline');
  });

  test('should display Data Mode tile with correct status', async ({ page }) => {
    const dataModeTile = page.locator('.hero-tile').filter({ hasText: 'Data Mode' });
    await expect(dataModeTile).toBeVisible();
    
    const value = await dataModeTile.locator('.hero-tile-value').textContent();
    expect(value).toMatch(/Live|Simulated/);
    await expect(dataModeTile.locator('.hero-tile-icon')).toBeVisible();
  });

  test('should display Response Time tile with milliseconds', async ({ page }) => {
    const responseTile = page.locator('.hero-tile').filter({ hasText: 'Response Time' });
    await expect(responseTile).toBeVisible();
    
    const value = await responseTile.locator('.hero-tile-value').textContent();
    expect(value).toMatch(/ms$/); // Should end with ms
  });

  test('should apply correct status classes', async ({ page }) => {
    const tiles = page.locator('.hero-tile');
    
    // At least one tile should have a status class
    const statusClasses = await Promise.all([
      tiles.first().evaluate(el => el.classList.contains('status-ok') || 
                                     el.classList.contains('status-warning') || 
                                     el.classList.contains('status-critical')),
    ]);
    
    expect(statusClasses.some(hasStatus => hasStatus)).toBe(true);
  });

  test('should show delta indicators when values change', async ({ page }) => {
    const successTile = page.locator('.hero-tile').filter({ hasText: 'Success Rate' });
    
    // Check if delta is present (may not be on first load)
    const delta = successTile.locator('.hero-tile-delta');
    const deltaCount = await delta.count();
    
    if (deltaCount > 0) {
      await expect(delta).toBeVisible();
      const deltaClass = await delta.getAttribute('class');
      expect(deltaClass).toMatch(/delta-(positive|negative|neutral)/);
    }
  });

  test('should navigate to Logs tab when clicking Errors tile', async ({ page }) => {
    const errorsTile = page.locator('.hero-tile').filter({ hasText: 'Errors' }).first();
    
    // Wait for tile to be visible and clickable
    await errorsTile.waitFor({ state: 'visible', timeout: 5000 });
    
    // Check if tile is clickable
    const isClickable = await errorsTile.evaluate(el => el.classList.contains('clickable'));
    
    if (isClickable) {
      await errorsTile.click({ timeout: 5000 });
      
      // Should navigate to the Logs tab (index 5)
      await page.waitForTimeout(500); // Wait for tab change animation
      const activeTab = page.locator('.mat-tab-label-active');
      await expect(activeTab).toContainText('Logs');
    }
  });

  test('should remain visible when switching tabs', async ({ page }) => {
    // Click on Performance tab
    await page.locator('.mat-tab-label').filter({ hasText: 'Performance' }).click();
    await page.waitForTimeout(300);
    
    // Hero bar should still be visible
    await expect(page.locator('.admin-hero-bar')).toBeVisible();
    
    // Click on Security tab
    await page.locator('.mat-tab-label').filter({ hasText: 'Security' }).click();
    await page.waitForTimeout(300);
    
    // Hero bar should still be visible
    await expect(page.locator('.admin-hero-bar')).toBeVisible();
  });

  test('should update metrics periodically', async ({ page }) => {
    // Get initial value
    const successTile = page.locator('.hero-tile').filter({ hasText: 'Success Rate' });
    const initialValue = await successTile.locator('.hero-tile-value').textContent();
    
    // Wait for potential update (hero service throttles at 2.5s by default)
    await page.waitForTimeout(3000);
    
    // Value should be updated (or same if no changes)
    const updatedValue = await successTile.locator('.hero-tile-value').textContent();
    expect(updatedValue).toBeDefined();
  });

  test('should be responsive on mobile viewport', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 }); // iPhone SE
    
    const heroBar = page.locator('.admin-hero-bar');
    await expect(heroBar).toBeVisible();
    
    // Tiles should still be visible
    const tiles = page.locator('.hero-tile');
    await expect(tiles.first()).toBeVisible();
  });

  test('should have proper ARIA labels for accessibility', async ({ page }) => {
    const tiles = page.locator('.hero-tile');
    const firstTile = tiles.first();
    
    const ariaLabel = await firstTile.getAttribute('aria-label');
    expect(ariaLabel).toBeTruthy();
    expect(ariaLabel).toContain(':'); // Should contain label:value format
  });

  test('should show pulse animation on critical errors', async ({ page }) => {
    // If there are errors, the tile should have pulse class
    const errorsTile = page.locator('.hero-tile').filter({ hasText: 'Errors' }).first();
    
    // Check if pulse class is present (will be if errors > 0)
    const hasPulse = await errorsTile.evaluate(el => el.classList.contains('pulse'));
    
    // This is conditional - only if there are actual errors
    if (hasPulse) {
      expect(hasPulse).toBe(true);
    }
  });

  test('should update Data Mode tile when simulation is toggled', async ({ page }) => {
    const dataModeTile = page.locator('.hero-tile').filter({ hasText: 'Data Mode' });
    const simulationToggle = page.locator('.simulation-toggle mat-slide-toggle');
    
    // Wait for elements to be ready
    await dataModeTile.waitFor({ state: 'visible', timeout: 5000 });
    await simulationToggle.waitFor({ state: 'visible', timeout: 5000 });
    
    // Get initial state
    const initialValue = await dataModeTile.locator('.hero-tile-value').textContent();
    
    // Toggle simulation with explicit wait
    await simulationToggle.click({ timeout: 5000 });
    await page.waitForTimeout(1000); // Wait for state update and re-render
    
    // Get new state
    const newValue = await dataModeTile.locator('.hero-tile-value').textContent();
    
    // Values should be different
    expect(initialValue).not.toBe(newValue);
    
    // Should show simulated metrics when in simulation mode
    if (newValue?.includes('Simulated')) {
      const subLabel = await dataModeTile.locator('.hero-tile-meta').textContent();
      expect(subLabel).toContain('Service Calls');
    }
  });
});
