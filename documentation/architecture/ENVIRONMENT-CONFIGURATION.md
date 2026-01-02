# Environment Configuration

This document describes the environment configuration system for Craft Fusion, including how environment variables are managed across frontend and backend applications.

## Overview

Craft Fusion uses a multi-tier environment configuration system:

1. **`.env` file** - Contains sensitive configuration values (API keys, tokens)
2. **Environment files** - TypeScript files that define application configuration
3. **`generate-env.js`** - Script that populates environment files with values from `.env`

## Architecture

### Frontend Environment Files

Located in `apps/craft-web/src/environments/`

#### `environment.ts` (Development)
```typescript
export const environment = {
  production: false,
  apiUrl: 'http://localhost:3000',
  socket: {
    url: 'ws://localhost:3000'
  },
  mapboxToken: 'pk.demo.mapbox_token'
};
```

#### `environment.prod.ts` (Production)
```typescript
export const environment = {
  production: true,
  apiUrl: 'https://jeffreysanford.us',
  socket: {
    url: 'wss://jeffreysanford.us'
  },
  mapboxToken: 'pk.demo.mapbox_token'
};
```

### Backend Environment Files

Located in `apps/craft-nest/src/environments/`

#### `environment.ts` (Development)
```typescript
export const environment = {
  production: false,
  apiUrl: 'http://localhost:3000/api',
  sslKeyPath: './apps/craft-nest/src/cert/server.key',
  sslCertPath: './apps/craft-nest/src/cert/server.cert',
  nestPort: 3000,
  useHttps: false,
  host: 'localhost'
};
```

#### `environment.prod.ts` (Production)
```typescript
export const environment = {
  production: true,
  apiUrl: 'https://jeffreysanford.us/api',
  sslKeyPath: process.env['SSL_KEY_PATH'] || './apps/craft-nest/src/cert/server.key',
  sslCertPath: process.env['SSL_CERT_PATH'] || './apps/craft-nest/src/cert/server.cert',
  nestPort: parseInt(process.env['NEST_PORT'] || '3000', 10),
  useHttps: true
};
```

## Property Usage Matrix

### Frontend Properties

| Property | Used By | Purpose |
|----------|---------|---------|
| `production` | `api.service.ts`, `websocket.service.ts`, `server-status.component.ts`, `api-diagnostics.service.ts` | Conditional logic for dev/prod behavior |
| `apiUrl` | `api-diagnostics.service.ts`, `timeline.service.ts` | Backend API endpoint |
| `socket.url` | `socket-client.service.ts`, `authentication.service.ts`, `timeline.service.ts` | WebSocket connection URL |
| `mapboxToken` | `mapbox.service.ts` | Mapbox API authentication |

### Backend Properties

| Property | Used By | Purpose |
|----------|---------|---------|
| `production` | `configuration.ts` | Environment detection |
| `apiUrl` | `configuration.ts` | API base URL configuration |
| `host` | `configuration.ts` | Server host binding |
| `nestPort` | `configuration.ts` | Server port configuration |
| `useHttps` | `main.ts` | SSL/TLS enablement flag |
| `sslKeyPath` | `main.ts` | SSL private key file path |
| `sslCertPath` | `main.ts` | SSL certificate file path |

## Environment Generation Script

The `generate-env.js` script (`apps/craft-web/generate-env.js`) automatically generates the frontend environment files by:

1. Loading values from the `.env` file using `dotenv`
2. Injecting sensitive values (API keys) into the environment templates
3. Writing the generated files to `src/environments/`

### Script Execution

```bash
# Run manually
node apps/craft-web/generate-env.js

# Run via Nx (during build)
pnpm dlx nx run craft-web:generate-env
```

### Environment Variable Mapping

| .env Variable | Environment Property | Default Value |
|---------------|---------------------|---------------|
| `MAPBOX_ACCESS_TOKEN` | `mapboxToken` | `'pk.demo.mapbox_token'` |
| `NASA_FIRMS_API_KEY` | `firms.service.ts` | `''` (empty) |

## Build Integration

### Angular Build System

The Angular build system automatically replaces `environment.ts` with `environment.prod.ts` during production builds via `project.json`:

```json
{
  "configurations": {
    "production": {
      "fileReplacements": [
        {
          "replace": "apps/craft-web/src/environments/environment.ts",
          "with": "apps/craft-web/src/environments/environment.prod.ts"
        }
      ]
    }
  }
}
```

### Nx Build Process

The environment generation is integrated into the Nx build process and runs automatically before the main build:

```bash
pnpm dlx nx build craft-web
# 1. Runs generate-env script
# 2. Builds Angular application with appropriate environment file
```

## Security Considerations

### Sensitive Data Handling

- **API Keys and Tokens**: Stored in `.env` file, injected at build time
- **URLs and Endpoints**: Hardcoded in environment files (non-sensitive)
- **SSL Certificates**: Path configuration in environment files, actual certs in filesystem

### Environment Separation

- **Development**: Localhost URLs, demo keys, no SSL
- **Production**: Live domain URLs, real API keys, SSL enabled

## Recent Changes (December 2025)

### Environment Cleanup

As of December 31, 2025, the environment files were cleaned up to remove unused properties:

#### Removed from Frontend:
- `socketUrl` (duplicate of `socket.url`)
- `finnhubApi` (unused)
- `nasaFirmsEndpoint` (unused)
- `calfireEndpoint` (unused)
- `yahooFinanceUrl` (duplicate of `yahooFinance.url`)
- `sentryDsn` (unused)
- `logLevel` (unused)

#### Removed from Backend:
- `socketUrl` (unused by backend)
- `yahooFinanceUrl` (unused by backend)

### Benefits of Cleanup

1. **Reduced bundle size** - Unused properties removed from client bundles
2. **Cleaner configuration** - Only necessary properties maintained
3. **Better maintainability** - Clear separation of concerns
4. **Improved security** - Sensitive data properly isolated

## Troubleshooting

### Common Issues

1. **Environment variables not loading**: Check `.env` file exists and has correct variable names
2. **Build fails after environment changes**: Run `node apps/craft-web/generate-env.js` to regenerate files
3. **API calls failing**: Verify `apiUrl` and `socket.url` are correct for the environment

### Debug Commands

```bash
# Check environment file generation
node apps/craft-web/generate-env.js

# Verify build with environment replacement
pnpm dlx nx build craft-web --configuration=production

# Check backend environment loading
pnpm dlx nx run craft-nest:serve
```

## Future Considerations

1. **Runtime configuration**: Consider moving to runtime config loading for dynamic environments
2. **Environment validation**: Add schema validation for environment properties
3. **Secret management**: Integrate with proper secret management systems for production
4. **Multi-environment support**: Add staging/QA environment configurations</content>
<parameter name="filePath">c:\repos\craft-fusion\documentation\architecture\ENVIRONMENT-CONFIGURATION.md
