import { test, expect, request } from '@playwright/test';

const ACCESS_TOKEN_COOKIE = 'cf_access_token';
const REFRESH_TOKEN_COOKIE = 'cf_refresh_token';

function extractCookieValue(setCookieHeader: string, name: string): string | null {
  const [cookiePair] = setCookieHeader.split(';');
  if (!cookiePair) {
    return null;
  }
  const [cookieName, ...rest] = cookiePair.split('=');
  if (cookieName !== name || rest.length === 0) {
    return null;
  }
  return rest.join('=');
}

function findCookie(headers: { name: string; value: string }[], name: string): string | null {
  for (const header of headers) {
    if (header.name.toLowerCase() !== 'set-cookie') {
      continue;
    }
    const value = extractCookieValue(header.value, name);
    if (value) {
      return value;
    }
  }
  return null;
}

test.describe('Auth refresh rotation', () => {
  test('rotates refresh token and issues a new access token', async () => {
    const apiUrl = process.env['API_URL'] || 'http://localhost:3000';
    const username = process.env['ADMIN_USERNAME'] || 'admin';
    const password = process.env['ADMIN_PASSWORD'];

    const context = await request.newContext({ baseURL: apiUrl });

    try {
      const loginPayload: { username: string; password?: string } = { username };
      if (password) {
        loginPayload.password = password;
      }

      const loginResponse = await context.post('/api/auth/login', { data: loginPayload });
      expect(loginResponse.ok()).toBeTruthy();

      const loginHeaders = loginResponse.headersArray();
      const initialAccess = findCookie(loginHeaders, ACCESS_TOKEN_COOKIE);
      const initialRefresh = findCookie(loginHeaders, REFRESH_TOKEN_COOKIE);

      expect(initialAccess).toBeTruthy();
      expect(initialRefresh).toBeTruthy();

      const refreshResponse = await context.post('/api/auth/refresh-token', {
        headers: {
          Cookie: `${REFRESH_TOKEN_COOKIE}=${initialRefresh}`,
        },
      });

      expect(refreshResponse.ok()).toBeTruthy();

      const refreshHeaders = refreshResponse.headersArray();
      const rotatedRefresh = findCookie(refreshHeaders, REFRESH_TOKEN_COOKIE);
      const rotatedAccess = findCookie(refreshHeaders, ACCESS_TOKEN_COOKIE);

      expect(rotatedRefresh).toBeTruthy();
      expect(rotatedAccess).toBeTruthy();
      expect(rotatedRefresh).not.toEqual(initialRefresh);
    } finally {
      await context.dispose();
    }
  });
});
