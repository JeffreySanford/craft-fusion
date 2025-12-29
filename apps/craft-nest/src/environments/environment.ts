export const environment = {
  production: false,
  apiUrl: 'http://localhost:3000/api',
  socketUrl: 'http://localhost:3000',
  yahooFinanceUrl: 'https://yfapi.net',
  sslKeyPath: './apps/craft-nest/src/cert/server.key',
  sslCertPath: './apps/craft-nest/src/cert/server.cert',
  nestPort: 3000,
  useHttps: false,
  // Add missing properties
  alphaVantageApiKey: 'demo', // Default to demo key for development
  host: 'localhost'
};
