// global-teardown.ts
import { FullConfig } from '@playwright/test';
import * as fs from 'fs';

async function globalTeardown(config: FullConfig) {
  // Clean up auth state
  try {
    fs.unlinkSync('playwright/.auth/user.json');
  } catch (error) {
    console.log('No auth state to clean up');
  }
  
  // Add other cleanup tasks here
}

export default globalTeardown;