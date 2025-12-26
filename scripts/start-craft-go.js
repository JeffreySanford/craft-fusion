#!/usr/bin/env node
const { spawn } = require('child_process');
const { existsSync, chmodSync } = require('fs');
const { join } = require('path');

const cwd = join(__dirname, '..', 'dist', 'apps', 'craft-go');
const exeWin = join(cwd, 'main.exe');
const exeUnix = join(cwd, 'main');

function exitWith(msg, code = 1) {
  console.error(msg);
  process.exit(code);
}

let cmdPath;
if (process.platform === 'win32') {
  if (existsSync(exeWin)) {
    cmdPath = exeWin;
  } else if (existsSync(exeUnix)) {
    cmdPath = exeUnix;
  }
} else {
  if (existsSync(exeUnix)) {
    cmdPath = exeUnix;
  } else if (existsSync(exeWin)) {
    cmdPath = exeWin;
  }
}

if (!cmdPath) {
  exitWith(`No craft-go executable found in ${cwd}. Please build the Go binary first (e.g. ",npx nx build craft-go").`);
}

// Ensure Unix executable bit
if (process.platform !== 'win32') {
  try { chmodSync(cmdPath, 0o755); } catch (e) { /* ignore */ }
}

console.log(`Starting craft-go: ${cmdPath} (cwd: ${cwd})`);

function spawnAndMonitor(command, args = [], options = { cwd, stdio: 'inherit' }) {
  const proc = spawn(command, args, options);

  proc.on('close', (code) => {
    console.log(`craft-go exited with code ${code}`);
    process.exit(code);
  });

  proc.on('error', (err) => {
    // If on Windows and we tried to execute a Unix binary (no .exe), attempt to run with bash as a fallback
    if (process.platform === 'win32' && command === cmdPath && cmdPath === exeUnix) {
      console.warn('Initial spawn failed; attempting to run via bash fallback...');
      try {
        const bashProc = spawn('bash', ['-lc', `./${require('path').basename(exeUnix)}`], options);
        bashProc.on('close', (code) => {
          console.log(`craft-go (bash) exited with code ${code}`);
          process.exit(code);
        });
        bashProc.on('error', (bashErr) => {
          exitWith(`Failed to start craft-go via bash fallback: ${bashErr.message}`);
        });
      } catch (e) {
        exitWith(`Failed to start craft-go via bash fallback: ${e.message}`);
      }
      return;
    }

    exitWith(`Failed to start craft-go: ${err.message}`);
  });

  return proc;
}

spawnAndMonitor(cmdPath, []);
