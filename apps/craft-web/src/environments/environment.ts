import { EnvironmentConfig } from './environment.base';

// Development environment configuration
export const environment: EnvironmentConfig = {
  production: false,
  apiUrl: 'http://localhost:3000/api',
  useMockMetrics: true,
  useMockApiWhenUnavailable: true,
  maxConnectionRetries: 3,
  logLevel: 'debug',
  host: 'localhost',
  authProvider: 'firebase',
  
  // API Keys - for local development only
  finnhub: {
    apiKey: 'cps6s5hr01qkode1001gcps6s5hr01qkode10020',
    baseUrl: 'https://finnhub.io/api/v1'
  },
  mapbox: {
    accessToken: 'pk.eyJ1IjoiamVmZnJleXNhbmZvcmQiLCJhIjoiY201c2psaW8yMG1vMDJrcTJ4ZzNic3YxbyJ9.7e5Pub4Ub0v-tHK9uzIuEA',
    style: 'mapbox://styles/mapbox/streets-v11'
  },
  flightAware: {
    username: 'jeffreysanford',
    apiKey: '9df1bdd8-b573-4e99-9b23-ff47fab4c035',
    baseUrl: 'https://aeroapi.flightaware.com/aeroapi'
  },
  huggingFace: {
    apiKey: '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',
    baseUrl: 'https://api-inference.huggingface.co/models'
  },
  
  // Additional API configurations
  flightRadar24: {
    endpoint: 'https://api.flightradar24.com/v1',
    apiKey: 'dev-key-123'
  },
  yahooFinance: {
    url: 'https://yfapi.net',
    apiKey: 'dev-key-456'
  },
  alphaVantageApiKey: 'dev-key-789',

  // AI Model Configuration
  aiModels: {
    deepseekEnabled: true,
    mistralEnabled: true,
    openaiEnabled: false,
    openaiApiKey: ''
  },
  
  // Development Firebase config
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
    productName: 'Craft Fusion DEV',
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
