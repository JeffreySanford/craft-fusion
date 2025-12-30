#!/usr/bin/env node

const { build } = require('esbuild');
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

// Load environment variables from .env file
const envPath = path.join(process.cwd(), '.env');
const envConfig = dotenv.config({ path: envPath });

if (envConfig.error) {
  console.error('Error loading .env file:', envConfig.error.message);
  process.exit(1);
}

// Generate define object for esbuild
const define = {};
for (const [key, value] of Object.entries(envConfig.parsed)) {
  define[`process.env.${key}`] = JSON.stringify(value);
}

console.log('Loaded environment variables from .env file');

// Build with esbuild using define for environment variables
build({
  entryPoints: ['apps/craft-web/src/main.ts'],
  bundle: true,
  outfile: 'dist/apps/craft-web/main.js',
  define,
  loader: {
    '.html': 'text',
    '.css': 'text',
  },
  resolveExtensions: ['.ts', '.js', '.json'],
  tsconfig: 'apps/craft-web/tsconfig.app.json',
  sourcemap: true,
  minify: false,
  platform: 'browser',
  target: 'es2020',
  external: ['@angular/localize'],
}).catch((error) => {
  console.error('Build failed:', error);
  process.exit(1);
});