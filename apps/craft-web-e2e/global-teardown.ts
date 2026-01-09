// global-teardown.ts
import { FullConfig } from '@playwright/test';
import { workspaceRoot } from '@nx/devkit';
import { spawn } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';

const BACKEND_PID_FILE = path.join(workspaceRoot, 'playwright/.tmp/craft-nest.pid');

async function stopCraftNestServer(): Promise<void> {
  if (!fs.existsSync(BACKEND_PID_FILE)) {
    return;
  }

  const pidRaw = fs.readFileSync(BACKEND_PID_FILE, 'utf8').trim();
  const pid = Number(pidRaw);

  try {
    if (Number.isNaN(pid) || pid <= 0) {
      return;
    }

    if (process.platform === 'win32') {
      await new Promise<void>((resolve, reject) => {
        const killer = spawn('taskkill', ['/pid', pid.toString(), '/T', '/F']);
        killer.on('close', () => resolve());
        killer.on('error', reject);
      });
    } else {
      process.kill(pid);
    }
  } catch (error) {
    console.warn('Failed to terminate craft-nest server process:', error);
  } finally {
    try {
      fs.unlinkSync(BACKEND_PID_FILE);
    } catch (_err) {
      // ignore
    }
  }
}

async function globalTeardown(config: FullConfig) {
  await stopCraftNestServer();

  const authFile = path.join(workspaceRoot, 'playwright/.auth/user.json');

  try {
    if (fs.existsSync(authFile)) {
      fs.unlinkSync(authFile);
    }
  } catch (error) {
    console.log('No auth state to clean up');
  }
}

export default globalTeardown;
