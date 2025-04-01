// Production environment configuration

import { loadEnvironmentVariables } from './environment.loader';

// Load variables from .env file
const envVars = loadEnvironmentVariables();

export const environment = {
  production: true,
  apiUrl: envVars.API_URL || 'https://api.craftfusion.com/api',
  useMockMetrics: false,
  useMockApiWhenUnavailable: false,
  maxConnectionRetries: 3,
  logLevel: 'error',
  host: 'craftfusion.com',
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
    authDomain: "craft-fusion-prod.firebaseapp.com",
    projectId: "craft-fusion-prod",
    storageBucket: "craft-fusion-prod.appspot.com",
    messagingSenderId: "234567890123",
    appId: "1:234567890123:web:abc123def456ghi789jkl",
    measurementId: "G-ABCDEF1235"
  },
  
  featureFlags: {
    enablePerformanceMonitoring: true,
    enableApiLogs: false,  // Disable verbose logging in production
    enableExperimentalFeatures: false,
    useNewDashboard: true,
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
    enabled: true,
    provider: 'google-analytics',
    trackingId: 'UA-REAL-TRACKING-ID'  // Actual tracking ID in production
  },
  
  performance: {
    minFps: 24,  // Lower minimum for wider device support
    targetFps: 60,
    maxInitTime: 5000,  // Allow more time for initialization in production
    disableVideoBackgrounds: true
  },
  
  appVersion: '1.0.0'  // Production version without beta tag
};
