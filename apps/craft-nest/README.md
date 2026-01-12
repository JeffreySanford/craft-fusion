# Craft-Nest: NestJS Backend

## Architecture Overview

Craft-Nest is a robust NestJS backend service that provides API endpoints, real-time communication capabilities, and data persistence for the Craft Fusion platform. This document outlines the development standards, architectural patterns, and best practices for maintaining and extending the service.

## Table of Contents

1. [Technology Stack](#technology-stack)
2. [Application Structure](#application-structure)
3. [Development Standards](#development-standards)
4. [Data Access Layer](#data-access-layer)
5. [API Design](#api-design)
6. [Real-time Communication](#real-time-communication)
7. [Authentication & Authorization](#authentication--authorization)
8. [Testing Strategy](#testing-strategy)
9. [Blockchain Integration](#blockchain-integration)
10. [Performance Considerations](#performance-considerations)
11. [Entity Validation](#entity-validation)

## Technology Stack

- **Framework**: NestJS 10+
- **Runtime**: Node.js 20+
- **Language**: TypeScript 5+
- **Database**: SQLite (via TypeORM or Prisma - clarify which is used)
- **ORM/Query Builder**: TypeORM / Prisma (clarify which is used)
- **API Documentation**: Swagger/OpenAPI
- **Real-time Communication**: WebSockets with Socket.IO
- **Authentication**: JWT with Passport strategies
- **Validation**: Class-validator and class-transformer
- **Testing**: Jest with Supertest
- **Blockchain**: Custom blockchain implementation for data integrity (if applicable)
- **Logging**: Built-in NestJS Logger (or Winston if configured)

## Application Structure
<!-- Add details about module structure, e.g., feature modules, core module, shared module -->

## Development Guidelines

### Package Management

> **Important**: This application is part of an Nx monorepo.
>
> - **DO NOT** create a `package.json` file within the `apps/craft-nest` directory.
> - All dependencies **MUST** be managed through the root-level `package.json` located at `c:\repos\craft-fusion\package.json`.
> - Use Nx commands run from the workspace root (`c:\repos\craft-fusion`) for managing dependencies and running scripts.

**Adding a Dependency:**

```bash
# Navigate to the workspace root directory
cd c:\repos\craft-fusion

# Add a production dependency
npm install some-package

# Add a development dependency
npm install some-dev-package --save-dev
```

**Running Scripts (Examples):**

```bash
# Serve the NestJS app in development mode
npx nx serve craft-nest

# Build the NestJS app for production
npx nx build craft-nest --configuration=production

# Run tests
npx nx test craft-nest

# Run linting
npx nx lint craft-nest
```

## Entity Validation

### Record Entity

The Record entity uses TypeScript interfaces with runtime type guards:

```typescript
// Example path - adjust if necessary
import { Record, isRecord } from './app/records/entities/record.entity';

// Example usage in a service
validateRecord(data: unknown): data is Record { // Use unknown and type predicate
  return isRecord(data);
}
```

All fields in the Record entity are required to ensure data consistency. Consider using `class-validator` decorators on DTOs for robust validation at API boundaries.

<!-- Add sections for Data Access, API Design, Real-time, Auth, Testing etc. -->
