// global-setup.ts
import { request, FullConfig } from '@playwright/test';
import { workspaceRoot } from '@nx/devkit';
import { ChildProcessWithoutNullStreams, spawn } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';

const DEFAULT_API_URL = 'http://localhost:3000';
const DEFAULT_USERNAME = 'test';
const BACKEND_PID_FILE = path.join(workspaceRoot, 'playwright/.tmp/craft-nest.pid');
const BACKEND_COMMAND = ['pnpm', 'dlx', 'nx', 'serve', 'craft-nest', '--configuration=development'];
const BACKEND_READY_TIMEOUT_MS = 120000;
const BACKEND_HEALTH_ENDPOINT = '/api/health';

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

async function isBackendAvailable(apiUrl: string): Promise<boolean> {
  const ctx = await request.newContext({ baseURL: apiUrl });
  try {
    const response = await ctx.get(BACKEND_HEALTH_ENDPOINT, { timeout: 5000 });
    return response.ok();
  } catch {
    return false;
  } finally {
    await ctx.dispose();
  }
}

async function waitForBackend(apiUrl: string): Promise<void> {
  const start = Date.now();
  while (Date.now() - start < BACKEND_READY_TIMEOUT_MS) {
    if (await isBackendAvailable(apiUrl)) {
      return;
    }
    await delay(500);
  }
  throw new Error('Timed out waiting for craft-nest backend to become healthy');
}

async function ensureBackend(apiUrl: string): Promise<void> {
  if (await isBackendAvailable(apiUrl)) {
    return;
  }

  const pidDir = path.dirname(BACKEND_PID_FILE);
  fs.mkdirSync(pidDir, { recursive: true });
  if (fs.existsSync(BACKEND_PID_FILE)) {
    fs.unlinkSync(BACKEND_PID_FILE);
  }

  const [command, ...args] = BACKEND_COMMAND;
  const backendProcess = spawn(command, args, {
    cwd: workspaceRoot,
    env: { ...process.env },
    stdio: ['ignore', 'pipe', 'pipe'],
  }) as ChildProcessWithoutNullStreams;

  backendProcess.stdout.on('data', chunk => {
    process.stdout.write(`[craft-nest] ${chunk}`);
  });
  backendProcess.stderr.on('data', chunk => {
    process.stderr.write(`[craft-nest ERROR] ${chunk}`);
  });

  backendProcess.on('error', error => {
    console.error('Failed to spawn craft-nest server:', error);
  });

  fs.writeFileSync(BACKEND_PID_FILE, backendProcess.pid.toString(), 'utf8');
  backendProcess.unref();

  console.log('Waiting for craft-nest backend to respond...');
  await waitForBackend(apiUrl);
  console.log('craft-nest backend is healthy');
}

async function globalSetup(config: FullConfig) {
  console.log('=== GLOBAL SETUP STARTED ===');
  
  const webUrl = process.env['WEB_URL'];
  let apiUrl = process.env['API_URL'] || DEFAULT_API_URL;
  if (!process.env['API_URL'] && webUrl) {
    const parsed = new URL(webUrl);
    parsed.port = '3000';
    parsed.pathname = '';
    parsed.search = '';
    parsed.hash = '';
    apiUrl = parsed.toString().replace(/\/$/, '');
  }
  console.log('API URL:', apiUrl);

  // Ensure backend is running for tests
  await ensureBackend(apiUrl);
  
  console.log('=== GLOBAL SETUP COMPLETED ===');
  console.log('Note: Authentication handled per-test via beforeEach hooks');
}

export default globalSetup;
