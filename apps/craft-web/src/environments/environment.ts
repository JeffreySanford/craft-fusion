export const environment = {
  production: false,
  apiUrl: 'https://jeffreysanford.us/api',
  socketUrl: 'wss://jeffreysanford.us',
  socket: {
    url: 'wss://jeffreysanford.us'
  },
  finnhubApi: 'https://finnhub.io/api/v1',
  nasaFirmsEndpoint: 'https://firms.modaps.eosdis.nasa.gov/api/active-fires',
  calfireEndpoint: 'https://www.fire.ca.gov/api',
  flightradar24Endpoint: 'https://fr24api.flightradar24.com/api/sandbox',
  flightRadar24: {
    endpoint: 'https://fr24api.flightradar24.com/api/sandbox',
    apiKey: 'demo_key'
  },
  yahooFinanceUrl: 'https://yfapi.net/',
  yahooFinance: {
    url: 'https://yfapi.net/',
    apiKey: 'demo_key'
  },
  alphaVantageApiKey: 'demo',
  mapboxToken: 'pk.demo.mapbox_token',
  devLogin: {
    username: 'admin',
    password: 'admin'
  },
  sentryDsn: '',
  logLevel: 'debug'
};
