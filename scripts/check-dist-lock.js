#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const target = path.join(__dirname, '..', 'dist', 'apps', 'craft-nest');

if (!fs.existsSync(target)) {
  console.log('No existing dist for craft-nest found — proceeding.');
  process.exit(0);
}

// Try to rename the directory to detect if it's locked
const tmp = target + '.tmp_check';
try {
  fs.renameSync(target, tmp);
  // rename back
  fs.renameSync(tmp, target);
  console.log('dist/apps/craft-nest is writable — proceeding with build.');
  process.exit(0);
} catch (err) {
  console.error('dist/apps/craft-nest appears to be locked by a running process or permissions issue.');
  console.error('Error:', err.message);
  console.error('Please stop any running development servers (e.g. npm run serve:nest or concurrently) and try again.');
  process.exit(2);
}