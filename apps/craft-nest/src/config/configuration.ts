import { environment } from '../environments/environment';

export default () => ({
    apiUrl: environment.apiUrl ?? 'http://localhost',
    secure: environment.production ?? false,
    host: environment.host ?? 'localhost',
    nestPort: environment.nestPort ?? 3000 // Use nestPort instead of port
  // ...other configurations
});
