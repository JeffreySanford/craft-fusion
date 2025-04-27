# Craft Fusion - Services Documentation

This document provides an overview and links to detailed documentation for the various Angular services used in the Craft Fusion applications. These services encapsulate business logic, interact with backend APIs, manage application state, and integrate with third-party tools.

## Core Services

* **API Integration:** Handles all communication with backend APIs, including features like health monitoring, offline detection, automatic retries, circuit breaking, and request tracing. See [API Integration](./API-INTEGRATION.md).
* **Logging:** Provides a robust logging mechanism with different levels, service call tracking, and categorization. See [Logging](./LOGGING.md).
* **Authentication & Authorization:** Manages user login, sessions, tokens, and permissions. See [Authentication](./AUTHENTICATION.md).
* **State Management:** Handles various pieces of application and user-specific state. See [State Management](./STATE-MANAGEMENT.md).

## Utility Services

A collection of services providing common functionalities like notifications, theme management, file parsing, etc. See [Utilities](./UTILITIES.md).

## Third-Party Integrations

Services dedicated to interacting with external APIs and libraries. See [Third-Party Services](./THIRD-PARTY-SERVICES.md).

## Architecture Principles

Our services follow these architectural principles:

1. **Single Responsibility:** Each service has a clearly defined purpose
2. **Observability:** Services provide ways to monitor their state and operations
3. **Resilience:** Services handle errors gracefully and implement recovery strategies
4. **Testability:** Services are designed to be easily tested in isolation

## Documentation Standards

Service documentation includes:

* Overview and purpose
* API reference
* Usage examples
* Configuration options
* Error handling strategies

## Getting Started

To learn how to use these services in your components, start with the [Developer Guide](./DEVELOPER-GUIDE.md).

## Troubleshooting

### Common Issues

#### API Connection Refused

If you see errors like:
```
[HPM] Error occurred while proxying request localhost:4200/api/health to http://localhost:3000/ [ECONNREFUSED]
```

This indicates that:
1. The Angular application is running but cannot connect to the backend API
2. The ApiService health check is failing because the backend server is not running

**Solution:**
- Start the backend API server with `npx nx run craft-nest:serve` (for NestJS API)
- If using the Go backend: `npx nx run craft-go:serve`
- Verify the API is running on the correct port (default: 3000 for NestJS, 4000 for Go)
- Check the proxy configuration in `apps/craft-web/src/proxy.config.json`

**Advanced Troubleshooting:**
- Confirm server is binding to correct interfaces with `ss -tulpn | grep -E ':(3000|4000)'`
- Verify no firewall is blocking the connection
- Try accessing the API directly: `curl http://localhost:3000/api/health`
- Check backend logs for binding errors: `npx nx run craft-nest:serve --verbose`

**Handling Network Issues:**
- The application has built-in retry mechanisms for transient network issues
- You can adjust retry behavior with `ApiService.setRetryStrategy()` 
- Configure timeout settings via `ApiService.setRequestTimeout()`

For local development without a backend, you can:
- Use the mock API by setting `useMockApi: true` in your environment
- Disable health checks using the environment configuration
- Run in offline mode which will use cached data when possible

**Using PM2 for Backend Services:**
```bash
# Start all backend services using PM2
pm2 start ecosystem.config.js

# View running services
pm2 list

# Check logs
pm2 logs craft-nest-api
```

### Development Environment Setup

For a complete development environment:
1. Start the backend: `npx nx run api:serve`
2. Start the frontend: `npx nx run craft-web:serve`
3. Ensure any required databases or services are running

See the [Development Setup Guide](./DEVELOPMENT-SETUP.md) for detailed instructions.
