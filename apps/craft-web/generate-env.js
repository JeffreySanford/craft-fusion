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
  apiUrl: '${envConfig.parsed.NX_API_URL || 'http://localhost:3000'}',
  socketUrl: '${envConfig.parsed.NX_SOCKET_URL || 'ws://localhost:3000'}',
  socket: {
    url: '${envConfig.parsed.NX_SOCKET_URL || 'ws://localhost:3000'}'
  },
  finnhubApi: '${envConfig.parsed.NX_FINNHUB_API || 'https://finnhub.io/api/v1'}',
  nasaFirmsEndpoint: '${envConfig.parsed.NX_NASA_FIRMS_ENDPOINT || 'https://firms.modaps.eosdis.nasa.gov/api/active-fires'}',
  calfireEndpoint: '${envConfig.parsed.NX_CALFIRE_ENDPOINT || 'https://www.fire.ca.gov/api'}',
  flightradar24Endpoint: '${envConfig.parsed.NX_FLIGHTRADAR24_ENDPOINT || 'https://fr24api.flightradar24.com/api/sandbox'}',
  flightRadar24: {
    endpoint: '${envConfig.parsed.NX_FLIGHTRADAR24_ENDPOINT || 'https://fr24api.flightradar24.com/api/sandbox'}',
    apiKey: '${envConfig.parsed.NX_FLIGHTRADAR24_API_KEY || ''}'
  },
  yahooFinanceUrl: '${envConfig.parsed.NX_YAHOO_FINANCE_URL || 'https://yfapi.net/'}',
  yahooFinance: {
    url: '${envConfig.parsed.NX_YAHOO_FINANCE_URL || 'https://yfapi.net/'}',
    apiKey: '${envConfig.parsed.NX_YAHOO_FINANCE_API_KEY || ''}'
  },
  alphaVantageApiKey: '${envConfig.parsed.NX_ALPHA_VANTAGE_API_KEY || ''}',
  mapboxToken: '${envConfig.parsed.NX_MAPBOX_ACCESS_TOKEN || 'pk.demo.mapbox_token'}',
  devLogin: {
    username: '${envConfig.parsed.NX_DEV_LOGIN_USERNAME || 'admin'}',
    password: '${envConfig.parsed.NX_DEV_LOGIN_PASSWORD || 'admin'}'
  },
  sentryDsn: '${envConfig.parsed.SENTRY_DSN || ''}',
  logLevel: '${envConfig.parsed.LOG_LEVEL || 'debug'}'
};
`;

const envFilePath = path.join(__dirname, 'src', 'environments', 'environment.ts');
fs.writeFileSync(envFilePath, envContent);

console.log('Generated environment.ts with .env values');

// Generate environment.prod.ts with production values
const prodEnvContent = `export const environment = {
  production: true,
  apiUrl: '${envConfig.parsed.NX_API_URL || 'https://jeffreysanford.us/api'}',
  socketUrl: '${envConfig.parsed.NX_SOCKET_URL || 'wss://jeffreysanford.us'}',
  socket: {
    url: '${envConfig.parsed.NX_SOCKET_URL || 'wss://jeffreysanford.us'}'
  },
  finnhubApi: '${envConfig.parsed.NX_FINNHUB_API || 'https://finnhub.io/api/v1'}',
  nasaFirmsEndpoint: '${envConfig.parsed.NX_NASA_FIRMS_ENDPOINT || 'https://firms.modaps.eosdis.nasa.gov/api/active-fires'}',
  calfireEndpoint: '${envConfig.parsed.NX_CALFIRE_ENDPOINT || 'https://www.fire.ca.gov/api'}',
  flightradar24Endpoint: '${envConfig.parsed.NX_FLIGHTRADAR24_ENDPOINT || 'https://fr24api.flightradar24.com/api/live'}',
  flightRadar24: {
    endpoint: '${envConfig.parsed.NX_FLIGHTRADAR24_ENDPOINT || 'https://fr24api.flightradar24.com/api/live'}',
    apiKey: '${envConfig.parsed.NX_FLIGHTRADAR24_API_KEY || ''}'
  },
  yahooFinanceUrl: '${envConfig.parsed.NX_YAHOO_FINANCE_URL || 'https://yfapi.net/'}',
  yahooFinance: {
    url: '${envConfig.parsed.NX_YAHOO_FINANCE_URL || 'https://yfapi.net/'}',
    apiKey: '${envConfig.parsed.NX_YAHOO_FINANCE_API_KEY || ''}'
  },
  alphaVantageApiKey: '${envConfig.parsed.NX_ALPHA_VANTAGE_API_KEY || ''}',
  mapboxToken: '${envConfig.parsed.NX_PROD_MAPBOX_ACCESS_TOKEN || envConfig.parsed.NX_MAPBOX_ACCESS_TOKEN || 'pk.eyJ1IjoiamVmZnJleXNhbmZvcmQiLCJhIjoiY201c2p'}',
  devLogin: {
    username: '${envConfig.parsed.NX_DEV_LOGIN_USERNAME || 'admin'}',
    password: '${envConfig.parsed.NX_DEV_LOGIN_PASSWORD || 'admin'}'
  },
  sentryDsn: '${envConfig.parsed.SENTRY_DSN || ''}',
  logLevel: '${envConfig.parsed.LOG_LEVEL || 'warn'}'
};
`;

const prodEnvFilePath = path.join(__dirname, 'src', 'environments', 'environment.prod.ts');
fs.writeFileSync(prodEnvFilePath, prodEnvContent);

console.log('Generated environment.prod.ts with production .env values');