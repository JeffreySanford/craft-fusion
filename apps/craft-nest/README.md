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

## Development Guidelines

### Package Management

> **Important**: This application follows monorepo architecture principles. 
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

