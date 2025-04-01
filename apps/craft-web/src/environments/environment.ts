// Development environment configuration
// This file can be replaced during build by using the `fileReplacements` array.

import { loadEnvironmentVariables } from './environment.loader';

// Load variables from .env file
const envVars = loadEnvironmentVariables();

export const environment = {
  production: false,
  apiUrl: envVars.API_URL || 'http://localhost:3000/api',
  useMockMetrics: true,
  useMockApiWhenUnavailable: true,
  maxConnectionRetries: 3,
  logLevel: 'debug',
  host: 'localhost',
  authProvider: 'firebase',
  
  // API Keys loaded from .env file
  finnhub: {
    apiKey: envVars.FINNHUB_API_KEY || '',
    baseUrl: 'https://finnhub.io/api/v1'
  },
  mapbox: {
    accessToken: envVars.MAPBOX_ACCESS_TOKEN || '',
    style: 'mapbox://styles/mapbox/streets-v11'
  },
  flightAware: {
    username: envVars.FLIGHT_AWARE_USER || '',
    apiKey: envVars.FLIGHT_AWARE_API_KEY || '',
    baseUrl: 'https://aeroapi.flightaware.com/aeroapi'
  },
  huggingFace: {
    apiKey: envVars.HUGGING_FACE_AFP || '',
    baseUrl: 'https://api-inference.huggingface.co/models'
  },
  
  // Adding missing API configurations
  flightRadar24: {
    endpoint: 'https://api.flightradar24.com/v1',
    apiKey: envVars.FLIGHT_RADAR24_API_KEY || ''
  },
  yahooFinance: {
    url: 'https://yfapi.net',
    apiKey: envVars.YAHOO_FINANCE_API_KEY || ''
  },
  alphaVantageApiKey: envVars.ALPHA_VANTAGE_API_KEY || '',

  // AI Model Configuration
  aiModels: {
    deepseekEnabled: envVars.DEEPSEEK_ENABLED === 'true',
    mistralEnabled: envVars.MISTRAL_ENABLED === 'true',
    openaiEnabled: envVars.OPENAI_ENABLED === 'true',
    openaiApiKey: envVars.OPENAI_API_KEY || ''
  },
  
  firebaseConfig: {
    apiKey: "AIzaSyA1234567890abcdefghijklmnopqrstuv",
    authDomain: "craft-fusion-dev.firebaseapp.com",
    projectId: "craft-fusion-dev",
    storageBucket: "craft-fusion-dev.appspot.com",
    messagingSenderId: "123456789012",
    appId: "1:123456789012:web:abc123def456ghi789jkl",
    measurementId: "G-ABCDEF1234"
  },
  
  featureFlags: {
    enablePerformanceMonitoring: true,
    enableApiLogs: true,
    enableExperimentalFeatures: true,
    useNewDashboard: false,
    enableAiAssistant: true
  },
  
  branding: {
    productName: 'Craft Fusion',
    logoPath: '/assets/logo.svg',
    colors: {
      primary: '#002868',
      secondary: '#BF0A30',
      accent: '#FFD700'
    }
  },
  
  analytics: {
    enabled: false,
    provider: 'google-analytics',
    trackingId: 'UA-XXXXXXXX-X'
  },
  
  performance: {
    minFps: 30,
    targetFps: 60,
    maxInitTime: 3000,
    disableVideoBackgrounds: false
  },
  
  appVersion: '1.0.0-beta.3'
};
