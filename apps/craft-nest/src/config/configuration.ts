import { environment } from "../environments/environment";

export default () => ({
    apiUrl: environment.apiUrl ?? 'http://localhost',
    secure: environment.production ?? false,
    host: environment.host ?? 'localhost',
    nestPort: environment.port ?? '3000'
  // ...other configurations
});
