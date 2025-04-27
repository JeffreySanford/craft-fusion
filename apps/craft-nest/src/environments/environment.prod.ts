export const environment = {
  production: true,
  apiUrl: 'https://jeffreysanford.us/api',
  socketUrl: 'https://jeffreysanford.us',
  yahooFinanceUrl: 'https://yfapi.net',
  sslKeyPath: process.env.SSL_KEY_PATH || './apps/craft-nest/src/cert/server.key',
  sslCertPath: process.env.SSL_CERT_PATH || './apps/craft-nest/src/cert/server.cert',
  nestPort: parseInt(process.env.NEST_PORT || '3000', 10),
  useHttps: true,
};