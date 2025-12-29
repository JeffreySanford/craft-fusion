// global-setup.ts
import { chromium, FullConfig } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

const environment = {
  apiUrl: 'http://localhost:3000',
  testUser: {
    username: 'test.user@example.com',
    password: 'Test123!',
    role: 'user'
  }
};

async function globalSetup(config: FullConfig) {
  // Ensure auth directory exists
  const authDir = path.join(process.cwd(), 'playwright/.auth');
  if (!fs.existsSync(authDir)) {
    fs.mkdirSync(authDir, { recursive: true });
  }

  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  try {
    // Login and save authentication state
    await page.goto(`${environment.apiUrl}/login`);
    await page.fill('input[name="username"]', environment.testUser.username);
    await page.fill('input[name="password"]', environment.testUser.password);
    await page.click('button[type="submit"]');
    
    // Wait for login to complete
    await page.waitForURL('**/dashboard');

    // Save signed-in state
    await page.context().storageState({
      path: path.join(authDir, 'user.json')
    });
  } catch (error) {
    console.error('Login failed:', error);
    throw error;
  } finally {
    await browser.close();
  }
}

export default globalSetup;