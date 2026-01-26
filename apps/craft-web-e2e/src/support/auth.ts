import { Page } from '@playwright/test';

function adminCredentials() {
  const adminSecret = process.env['ADMIN_SECRET'];
  const adminUsernameRaw = process.env['ADMIN_USERNAME'] || 'admin';
  const adminPasswordRaw = process.env['ADMIN_PASSWORD'];

  if (!adminUsernameRaw) {
    throw new Error(
      'Playwright admin login requires ADMIN_USERNAME to be set in .env (and ADMIN_PASSWORD unless ADMIN_SECRET is provided).',
    );
  }

  const username = adminUsernameRaw.trim();
  if (!username) {
    throw new Error('ADMIN_USERNAME cannot be empty.');
  }

  if (!adminSecret && !adminPasswordRaw) {
    throw new Error('ADMIN_PASSWORD must be set in .env when ADMIN_SECRET is not provided.');
  }

  const password = adminSecret ? undefined : adminPasswordRaw?.trim();
  return { username, password };
}

export async function loginAsAdmin(page: Page, targetPath = '/admin'): Promise<void> {
  // Set e2e test flag to disable auto-logout
  await page.addInitScript(() => {
    (window as any)['__E2E_TEST_MODE__'] = true;
  });

  const credentials = adminCredentials();
  const payload: { username: string; password?: string } = {
    username: credentials.username,
  };
  if (credentials.password) {
    payload.password = credentials.password;
  }

  // Use Playwright API request to perform a deterministic login and transfer
  // the Set-Cookie values into the browser context. This is more reliable
  // than doing a fetch() inside the page because it lets us assert the
  // server-set cookies and explicitly add them to the page context.
  const apiBase = process.env['API_URL'] || '';
  const apiRequest = await (page.request || (await import('@playwright/test')).request).newContext({ baseURL: apiBase || undefined });
  const loginResp = await apiRequest.post('/api/auth/login', { data: payload });
  const status = loginResp.status();
  const headers = loginResp.headersArray();
  await apiRequest.dispose();

  if (status >= 400) {
    throw new Error(`Login failed with status ${status}`);
  }

  // Extract Set-Cookie headers for the access & refresh cookies and add them
  // to the browser context so the app sees an authenticated session.
  const extractCookieValue = (setCookie: string, name: string): string | null => {
    const [pair] = setCookie.split(';');
    if (!pair) return null;
    const [cookieName, ...rest] = pair.split('=');
    if (cookieName !== name || rest.length === 0) return null;
    return rest.join('=');
  };

  const findCookie = (headersArr: { name: string; value: string }[], name: string) => {
    for (const h of headersArr) {
      if (h.name.toLowerCase() !== 'set-cookie') continue;
      const v = extractCookieValue(h.value, name);
      if (v) return v;
    }
    return null;
  };

  const ACCESS_TOKEN_COOKIE = process.env['E2E_ACCESS_COOKIE'] || 'cf_access_token';
  const REFRESH_TOKEN_COOKIE = process.env['E2E_REFRESH_COOKIE'] || 'cf_refresh_token';

  const accessVal = findCookie(headers, ACCESS_TOKEN_COOKIE);
  const refreshVal = findCookie(headers, REFRESH_TOKEN_COOKIE);

  if (!accessVal || !refreshVal) {
    throw new Error('Login did not return authentication cookies');
  }

  const url = new URL(process.env['E2E_BASE_URL'] || 'http://localhost:4200');
  await page.context().addCookies([
    {
      name: ACCESS_TOKEN_COOKIE,
      value: accessVal,
      domain: url.hostname,
      path: '/',
      httpOnly: true,
      sameSite: 'Lax',
    },
    {
      name: REFRESH_TOKEN_COOKIE,
      value: refreshVal,
      domain: url.hostname,
      path: '/',
      httpOnly: true,
      sameSite: 'Lax',
    },
  ]);

  // Navigate to the admin route — cookies are present in context so the app
  // should initialize authenticated state reliably.
  await page.goto(targetPath, { waitUntil: 'domcontentloaded' });
}
