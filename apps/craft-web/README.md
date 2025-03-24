# Craft-Web: Angular Frontend

## Architecture Overview

Craft-Web is an Angular application built with Material Design 3 principles and a patriotic theme. This document outlines the development standards, architecture decisions, and best practices for maintaining and extending the application.

## Table of Contents

1. [Technology Stack](#technology-stack)
2. [Application Structure](#application-structure)
3. [Development Standards](#development-standards)
4. [State Management](#state-management)
5. [Styling Guidelines](#styling-guidelines)
6. [Performance Optimization](#performance-optimization)
7. [Testing Strategy](#testing-strategy)
8. [Integration Points](#integration-points)
9. [Data Validation](#data-validation)

## Technology Stack

- **Framework**: Angular 16+
- **UI Components**: Angular Material with MDC (Material Design Components)
- **Styling**: SCSS with BEM methodology and Material Design 3 tokens
- **HTTP Client**: Angular's HttpClient with RxJS operators
- **Real-time Communication**: WebSockets via Socket.IO client
- **State Management**: NgRx Store, Effects, and Entity
- **Form Management**: Reactive Forms
- **Testing**: Jest, Cypress
- **Build System**: Nx Workspace

## Application Structure

## Development Standards

- **Module-Based Architecture**: All components must be organized within feature modules
- **Standalone Components Prohibited**: All components require `standalone: false`
- **Strong Typing Enforcement**: Every property, method, parameter, and return value must be strongly typed
- **Reactive Programming**: Hot observables are used throughout the application
- **Real-time Data Flow**: WebSockets for push-based notification system
- **Lazy Loading**: Feature modules are lazy-loaded for optimal performance

## Module Organization

## Development Guidelines

### Package Management

> **Important**: This application follows monorepo architecture principles. 
> - **DO NOT** create a package.json file in this directory
> - All dependencies must be managed through the root-level package.json
> - Use `nx run craft-web:command` format for operations

To install a new dependency:
```bash
# Add a dependency for this application
cd ../../  # Navigate to root
npm install some-package --save
```

## Data Validation

### Record Validation

The application implements strict validation for Record entities:

```typescript
// Validate complete records
import { isValidRecord } from './utils/record-validators';

// Example usage
if (isValidRecord(recordData)) {
  this.recordService.saveRecord(recordData);
} else {
  this.notificationService.error('Invalid record data');
}
```

For partial record validation during form input:

```typescript
import { isValidPartialRecord } from './utils/record-validators';

// Check if partial data is valid before proceeding
if (isValidPartialRecord(formData)) {
  this.canProceed = true;
}
```

