export const environment = {
  production: false,
  host: 'http://localhost:3000',
  apiUrl: 'http://localhost:3000/api',
  socket: {
    enabled: true,
    url: 'http://localhost:3000',
    reconnectionAttempts: 3,
    timeout: 5000
  },
  flightRadar24: {
    apiKey: 'your-dev-api-key-here',
    endpoint: 'https://fr24api.flightradar24.com/api/sandbox'
  },
  mapbox: {
    accessToken: 'your-mapbox-access-token-here'
  },
  alphaVantageApiKey: 'demo',
  yahooFinance: {
    url: 'https://yfapi.net/',
    apiKey: 'demo'
  }
};
