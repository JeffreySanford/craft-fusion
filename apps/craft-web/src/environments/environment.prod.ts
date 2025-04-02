import { EnvironmentConfig } from './environment.base';

export const environment: EnvironmentConfig = {
  production: true,
  apiUrl: 'https://api.craftfusion.com/api',
  useMockMetrics: false,
  useMockApiWhenUnavailable: false,
  maxConnectionRetries: 5,
  logLevel: 'error',
  host: 'craftfusion.com',
  authProvider: 'firebase',
  
  // API Keys - will be injected during build
  finnhub: {
    apiKey: '',  // Injected during CI/CD
    baseUrl: 'https://finnhub.io/api/v1'
  },
  mapbox: {
    accessToken: '', // Injected during CI/CD
    style: 'mapbox://styles/mapbox/streets-v11'
  },
  flightAware: {
    username: '', // Injected during CI/CD
    apiKey: '', // Injected during CI/CD
    baseUrl: 'https://aeroapi.flightaware.com/aeroapi'
  },
  huggingFace: {
    apiKey: '', // Injected during CI/CD
    baseUrl: 'https://api-inference.huggingface.co/models'
  },
  
  flightRadar24: {
    endpoint: 'https://api.flightradar24.com/v1',
    apiKey: '' // Injected during CI/CD
  },
  yahooFinance: {
    url: 'https://yfapi.net',
    apiKey: '' // Injected during CI/CD
  },
  alphaVantageApiKey: '',

  // AI Model Configuration
  aiModels: {
    deepseekEnabled: false,
    mistralEnabled: true,
    openaiEnabled: true,
    openaiApiKey: '' // Injected during CI/CD
  },
  
  // Production Firebase config
  firebaseConfig: {
    apiKey: "AIzaSyBProdConfig123456789ProdConfig",
    authDomain: "craft-fusion.firebaseapp.com",
    projectId: "craft-fusion",
    storageBucket: "craft-fusion.appspot.com",
    messagingSenderId: "987654321098",
    appId: "1:987654321098:web:prod123config456prod",
    measurementId: "G-PRODCONFIG"
  },
  
  featureFlags: {
    enablePerformanceMonitoring: true,
    enableApiLogs: false,
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
    trackingId: 'UA-PRODUCTION-ID'
  },
  
  performance: {
    minFps: 24,
    targetFps: 60,
    maxInitTime: 2000,
    disableVideoBackgrounds: true
  },
  
  appVersion: '1.1.0'
};
