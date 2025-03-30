# Craft Fusion Architecture Guide

## Overview

Craft Fusion uses a layered architecture with clear separation of concerns between frontend Angular components and backend NestJS/Go services. This document outlines key architectural decisions, patterns, and guidelines.

## Frontend Architecture

### Service Organization

#### Core Services Layer
- **Foundation Services**: LoggerService, HttpClientWrapperService
- **Authentication Services**: AuthService, AuthorizationService
- **State Management**: UserStateService, AdminStateService
- **Health Monitoring**: HealthService, EnvironmentService

#### Feature Services
- **API Communication**: ApiService, ApiLoggerService
- **UI Services**: ThemeService, LayoutService, NotificationService

### Dependency Management

#### Preventing Circular Dependencies
The application uses several patterns to prevent circular dependencies:

1. **Mediator Services**
   - HttpClientWrapperService mediates between ApiService and other services
   - LoggerService is initialized early in the dependency chain

2. **Interface Abstractions**
   - Services interact through interfaces rather than concrete implementations
   - State interfaces are defined separately from service implementations

3. **Angular Pattern Usage**
   - forwardRef() for unavoidable circular references
   - @Optional() for non-critical dependencies

#### Dependency Flow
