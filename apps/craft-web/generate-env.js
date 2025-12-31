#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

// Load .env file
const envPath = path.join(__dirname, '..', '..', '.env');
const envConfig = dotenv.config({ path: envPath });

if (envConfig.error) {
  console.error('Error loading .env file:', envConfig.error.message);
  process.exit(1);
}

// Generate environment.ts with actual values
const envContent = `export const environment = {
  production: false,
  apiUrl: 'http://localhost:3000',
  socket: {
    url: 'ws://localhost:3000'
  },
  yahooFinance: {
    url: 'https://yfapi.net/',
    apiKey: '${envConfig.parsed.NX_YAHOO_FINANCE_API_KEY || ''}'
  },
  alphaVantageApiKey: '${envConfig.parsed.NX_ALPHA_VANTAGE_API_KEY || ''}',
  flightRadar24: {
    endpoint: 'https://fr24api.flightradar24.com/api/sandbox',
    apiKey: '${envConfig.parsed.NX_FLIGHTRADAR24_API_KEY || ''}'
  },
  mapboxToken: '${envConfig.parsed.NX_MAPBOX_ACCESS_TOKEN || 'pk.demo.mapbox_token'}'
};
`;

const envFilePath = path.join(__dirname, 'src', 'environments', 'environment.ts');
fs.writeFileSync(envFilePath, envContent);

console.log('Generated environment.ts with .env values');

// Generate environment.prod.ts with production values
const prodEnvContent = `export const environment = {
  production: true,
  apiUrl: 'https://jeffreysanford.us',
  socket: {
    url: 'wss://jeffreysanford.us'
  },
  yahooFinance: {
    url: 'https://yfapi.net/',
    apiKey: '${envConfig.parsed.NX_YAHOO_FINANCE_API_KEY || ''}'
  },
  alphaVantageApiKey: '${envConfig.parsed.NX_ALPHA_VANTAGE_API_KEY || ''}',
  flightRadar24: {
    endpoint: 'https://fr24api.flightradar24.com/api/sandbox',
    apiKey: '${envConfig.parsed.NX_FLIGHTRADAR24_API_KEY || ''}'
  },
  mapboxToken: '${envConfig.parsed.NX_MAPBOX_ACCESS_TOKEN || 'pk.demo.mapbox_token'}'
};
`;

const prodEnvFilePath = path.join(__dirname, 'src', 'environments', 'environment.prod.ts');
fs.writeFileSync(prodEnvFilePath, prodEnvContent);

console.log('Generated environment.prod.ts with production .env values');