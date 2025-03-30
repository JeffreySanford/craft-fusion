# Craft-Nest: NestJS Backend

## Architecture Overview

Craft-Nest is a robust NestJS backend service that provides API endpoints, real-time communication capabilities, and data persistence for the Craft Fusion platform. This document outlines the development standards, architectural patterns, and best practices for maintaining and extending the service.

## Table of Contents

1. [Technology Stack](#technology-stack)
2. [Application Structure](#application-structure)
3. [Health Monitoring](#health-monitoring)
4. [Development Standards](#development-standards)
5. [Data Access Layer](#data-access-layer)
6. [API Design](#api-design)
7. [Real-time Communication](#real-time-communication)
8. [Authentication & Authorization](#authentication--authorization)
9. [Testing Strategy](#testing-strategy)
10. [Blockchain Integration](#blockchain-integration)
11. [Performance Considerations](#performance-considerations)
12. [Entity Validation](#entity-validation)
13. [Dependency Management](#dependency-management)
14. [Recipes Module](#recipes-module)

## Technology Stack

- **Framework**: NestJS 10+
- **Runtime**: Node.js 20+
- **Language**: TypeScript 5+
- **Database**: MongoDB (with in-memory option for testing)
- **ORM**: Mongoose with TypeGoose for type-safety
- **API Documentation**: Swagger/OpenAPI
- **Real-time Communication**: WebSockets with Socket.IO
- **Authentication**: JWT with Passport strategies
- **Validation**: Class-validator and class-transformer
- **Testing**: Jest with Supertest
- **Blockchain**: Custom blockchain implementation for data integrity
- **Logging**: Winston logger

## Application Structure

## Health Monitoring

Craft-Nest implements comprehensive health monitoring capabilities that are critical for system reliability and observability:

### Health Endpoints

The application exposes several health check endpoints to accommodate different client requirements:

- **`/health`**: Primary non-prefixed health endpoint (no authorization required)
- **`/api/health`**: API-prefixed alternative (no authorization required)
- **`/status`**: Alias for basic status information (no authorization required)
- **`/api/status`**: API-prefixed status endpoint (no authorization required)

### Health Data Structure

Health endpoints return a standardized `HealthStatus` object:

```typescript
interface HealthStatus {
  status: 'online' | 'degraded' | 'offline';  // Overall service status
  uptime: number;                             // Service uptime in milliseconds
  timestamp: number;                          // Current timestamp
  hostname: string;                           // Server hostname
  version: string;                            // Application version
  environment: string;                        // Deployment environment
  memory: {                                   // Memory statistics
    free: number;
    total: number;
    usage: number;                            // Usage percentage
  };
  services: {                                 // Dependent service status
    database: 'up' | 'down' | 'degraded';
    cache: 'up' | 'down' | 'degraded';
  };
}
```

### Implementation Notes

- **Health Module**: Dedicated `HealthModule` provides the `HealthService`
- **No Authentication**: Health endpoints deliberately bypass authentication requirements
- **Mount Points**: Health endpoint is mounted both at API prefix level and root level for maximum compatibility
- **Non-blocking**: Health checks perform lightweight operations to avoid impacting performance

## Development Guidelines

### Package Management

> **Important**: This application follows monorepo architecture principles.
>
> - **DO NOT** create a package.json file in this directory
> - All dependencies must be managed through the root-level package.json
> - Use `nx run craft-nest:command` format for operations

To install a new dependency:

```bash
# Add a dependency for this application
cd ../../  # Navigate to root
npm install some-package --save
```

## Entity Validation

### Record Entity

The Record entity uses TypeScript interfaces with runtime type guards:

```typescript
import { Record, isRecord } from './entities/record.entity';

// Example usage in a service
validateRecord(data: any): boolean {
  return isRecord(data);
}
```

All fields in the Record entity are required to ensure data consistency.

## Dependency Management

### Circular Dependencies

NestJS applications can suffer from circular dependencies similar to the Angular frontend. The backend implements the following strategies to avoid circular dependencies:

1. **Module Forwarders**
   - Use `forwardRef()` in the module imports to allow circular module dependencies:
   ```typescript
   @Module({
     imports: [forwardRef(() => UserModule)],
   })
   export class AuthModule {}
   ```

2. **Service Interface Abstractions**
   - Define interfaces in a shared module/location
   - Use interfaces for cross-service communication

3. **Event-based Communication**
   - Use event emitters to communicate between services instead of direct dependencies
   - Implement an event bus pattern for decoupled communication

4. **Provider Tokens**
   - Use custom provider tokens to break dependency cycles
   - Inject dependencies by token rather than by class reference

The frontend's `HttpClientWrapperService` pattern mirrors our backend's `HttpService` abstraction, ensuring consistent architecture throughout the application.

## Recipes Module

Demonstrates CRUD with interfaces and DTO classes. All operations are logged for better visibility.
