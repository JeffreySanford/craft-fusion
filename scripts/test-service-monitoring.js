const { chromium } = require('playwright');
const fetch = require('node-fetch');

(async () => {
  const baseUrl = process.env.BASE_URL || 'http://localhost:4200';
  const apiBase = process.env.API_BASE || 'http://localhost:3000/api';

  console.log('Starting Service Monitoring smoke test');

  // 1) Get a dev auth token
  const loginResp = await fetch(`${apiBase}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: 'admin', password: 'admin' })
  });

  if (!loginResp.ok) {
    console.error('Login failed', await loginResp.text());
    process.exit(1);
  }

  const loginJson = await loginResp.json();
  const token = loginJson.token;
  console.log('Obtained token length:', token ? token.length : 'none');

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  // Capture console messages
  const consoleMessages = [];
  page.on('console', (msg) => {
    consoleMessages.push({ type: msg.type(), text: msg.text() });
  });

  // Track network calls to API endpoints of interest
  let apiCalls = [];
  page.on('request', (req) => {
    const url = req.url();
    if (url.includes('/api/') || url.includes('/api-go/')) {
      apiCalls.push({ url, method: req.method(), time: Date.now() });
    }
  });

  // Set localStorage to simulate logged-in admin
  await page.goto(baseUrl, { waitUntil: 'domcontentloaded' });
  await page.evaluate(({ token }) => {
    localStorage.setItem('auth_token', token);
    localStorage.setItem('auth_refresh_token', 'dev-refresh-token');
    localStorage.setItem('isAdmin', '1');
  }, { token });

  // Navigate directly to admin page
  await page.goto(`${baseUrl}/admin`, { waitUntil: 'networkidle' });

  // Click Service Monitoring tab (looks for text)
  const serviceTab = page.getByText('Service Monitoring');
  await serviceTab.click();

  console.log('Service Monitoring tab clicked; monitoring network and console for 12s');

  // Monitor for 12 seconds
  await page.waitForTimeout(12000);

  // Capture counts and some samples
  const callsCount = apiCalls.length;
  const callsSample = apiCalls.slice(-10);
  const consoleErrors = consoleMessages.filter(m => m.type === 'error');

  console.log('API calls during monitoring period:', callsCount);
  console.log('Recent API calls sample:', callsSample.map(c => ({ url: c.url, method: c.method })));
  console.log('Console error messages count:', consoleErrors.length);

  // Now trigger logout via header menu
  console.log('Triggering logout via UI');
  // Open user menu
  await page.click('button.user-profile-button');
  await page.click('text=Logout');

  // Wait a bit to observe that monitoring stopped
  await page.waitForTimeout(6000);

  const callsAfterLogout = apiCalls.length - callsCount;
  const tokenAfter = await page.evaluate(() => localStorage.getItem('auth_token'));
  const isAdminAfter = await page.evaluate(() => localStorage.getItem('isAdmin'));

  console.log('API calls after logout (next 6s):', callsAfterLogout);
  console.log('auth_token after logout:', tokenAfter);
  console.log('isAdmin after logout:', isAdminAfter);

  // Save a condensed report
  const report = {
    apiCallsCount: callsCount,
    recentCalls: callsSample,
    consoleErrors: consoleErrors.map(c => c.text),
    callsAfterLogout,
    tokenAfter,
    isAdminAfter
  };

  console.log('\n== Service Monitoring Smoke Test Report ==');
  console.log(JSON.stringify(report, null, 2));

  await browser.close();
  process.exit(0);
})();