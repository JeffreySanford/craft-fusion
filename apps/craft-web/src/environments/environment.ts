// This file can be replaced during build by using the `fileReplacements` array.
// `ng build` replaces `environment.ts` with `environment.prod.ts`.
// The list of file replacements can be found in `angular.json`.

export const environment = {
  production: false,
  apiUrl: 'http://localhost:3000',
  useMockMetrics: false, // Enable to use mock metrics for development
  useMockApiWhenUnavailable: true, // Enable to automatically use mock data when backend is unavailable
  maxConnectionRetries: 3, // Number of retries before fallback to mock data
  logLevel: 'debug', // debug, info, warn, error
  host: 'localhost',
  authProvider: 'firebase',
  firebaseConfig: {
    // Add your Firebase configuration here
  },
  nestApiUrl: 'http://localhost:3000',
  goApiUrl: 'http://localhost:4000/api-go',
  finnhubApiKey: 'cu8gbkpr01qt63vgue4gcu8gbkpr01qt63vgue50',
  finnHubAPI: 'https://finnhub.io/api/v1',
  mapbox: {
    accessToken: 'pk.eyJ1IjoiamVmZnJleXNhbmZvcmQiLCJhIjoiY201c2psaW8yMG1vMDJrcTJ4ZzNic3YxbyJ9.7e5Pub4Ub0v-tHK9uzIuEA',
  },
  nasaFirms: {
    apiKey: 'your-development-nasa-firms-api-key-here',
    endpoint: 'https://firms.modaps.eosdis.nasa.gov/api/area/csv/',
  },
  calFire: {
    endpoint: 'https://incidents.fire.ca.gov/umbraco/api/IncidentApi/',
  },
  flightRadar24: {
    apiKey: '9df1bdd8-b573-4e99-9b23-ff47fab4c035|PxsBdnqI1p0vbt3PiAi079zIDoq8TK01PTi3ZITYd19a63d7',
    endpoint: 'https://example.com/api/fr24', // Placeholder
  },
  alphaVantageApiKey: '3EP39QPLULHFVD7Y',
  yahooFinance: {
    url: 'https://yfapi.net/',
    apiKey: 'uANiNS5imM7YUDOxZNpu3qrmLEYkoqu2r6OzqCW8', // Replace with your Yahoo Finance API key
    endpoint: 'https://example.com/api/yahoo-finance', // Placeholder
  },
  performance: {
    disableVideoBackgrounds: false
  }
};

/*
 * For easier debugging in development mode, you can import the following file
 * to ignore zone related error stack frames such as `zone.run`, `zoneDelegate.invokeTask`.
 *
 * This import should be commented out in production mode because it will have a negative impact
 * on performance if an error is thrown.
 */
// import 'zone.js/plugins/zone-error';  // Included with Angular CLI.
