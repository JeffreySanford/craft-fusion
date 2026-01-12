import { Page } from '@playwright/test';

function adminCredentials() {
  const adminSecret = process.env['ADMIN_SECRET'];
  const adminUsernameRaw = process.env['ADMIN_USERNAME'];
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
  const credentials = adminCredentials();
  const payload: { username: string; password?: string } = {
    username: credentials.username,
  };
  if (credentials.password) {
    payload.password = credentials.password;
  }

  await page.goto('/');
  const responseStatus = await page.evaluate(
    async ({ body }) => {
      const result = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(body),
      });
      return result.status;
    },
    { body: payload },
  );

  if (responseStatus >= 400) {
    throw new Error(`Login failed with status ${responseStatus}`);
  }

  await page.goto(targetPath);
}
