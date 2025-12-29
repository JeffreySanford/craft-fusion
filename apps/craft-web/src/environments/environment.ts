export const environment = {
  production: false,
  apiUrl: '', // Empty string for local development as we use Angular proxy
  logLevel: 'debug',
  useOfflineMode: false,
  enableDebug: true,
  useApiMocks: false, // Set to false to use the actual backend endpoints
  sentryDsn: '',
  version: '0.1.0',
  // Add server health check endpoints
  healthCheckEndpoint: '/health',
  maxRetryAttempts: 3,
  retryDelayMs: 1000,
  
  // Add API keys and service configurations for third-party services
  alphaVantageApiKey: 'demo',
  
  // Yahoo Finance API configuration
  yahooFinance: {
    url: '/api/yahoo',
    apiKey: 'demo_key'
  },
  
  // Flight Radar configuration
  flightRadar24: {
    endpoint: '/api/flight-radar',
    apiKey: 'demo_key'
  },
  
  // Mapbox configuration
  mapbox: {
    accessToken: 'pk.demo.mapbox_token'
  },
  
  // WebSocket configuration
  socket: {
    url: 'ws://127.0.0.1:3000' // Use 127.0.0.1 for the Nest server WebSocket connection
  }
};
