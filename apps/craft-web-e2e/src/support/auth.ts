import { Page } from '@playwright/test';

const DEFAULT_USERNAME = 'test';

function adminCredentials() {
  const adminSecret = process.env['ADMIN_SECRET'];
  const adminUsername = process.env['ADMIN_USERNAME'];
  const adminPassword = process.env['ADMIN_PASSWORD'];
  const useAdminCredentials = Boolean(adminSecret) || Boolean(adminUsername && adminPassword);
  const username = useAdminCredentials ? adminUsername || 'admin' : DEFAULT_USERNAME;
  const password = adminSecret ? undefined : useAdminCredentials ? adminPassword : undefined;
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
