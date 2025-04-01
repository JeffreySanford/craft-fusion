#!/usr/bin/env node

/**
 * Environment setup script
 * 
 * This script loads variables from .env file at the project root
 * and makes them available for the Angular build process.
 */

const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

// Path to the root .env file
const envPath = path.resolve(__dirname, '../.env');

console.log(`Setting up environment from ${envPath}`);

// Check if .env file exists
if (!fs.existsSync(envPath)) {
  console.warn('\x1b[33m%s\x1b[0m', '.env file not found! Using default values...');
  console.log('\x1b[36m%s\x1b[0m', 'Create a .env file from .env.template for better configuration.');
} else {
  // Load the variables from the .env file
  const envConfig = dotenv.parse(fs.readFileSync(envPath));

  // Set the environment variables
  for (const key in envConfig) {
    process.env[key] = envConfig[key];
  }
  
  console.log('\x1b[32m%s\x1b[0m', 'Environment variables loaded successfully!');
  
  // List loaded keys without values for security
  console.log('\x1b[36m%s\x1b[0m', 'Loaded keys:');
  Object.keys(envConfig).forEach(key => {
    const maskedValue = key.includes('KEY') || key.includes('TOKEN') || key.includes('SECRET') 
      ? '********' 
      : envConfig[key];
    console.log(`  ${key}: ${maskedValue}`);
  });
}

console.log('\x1b[32m%s\x1b[0m', 'Environment setup complete!');
