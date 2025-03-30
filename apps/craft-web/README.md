# Craft Web - Angular Frontend

Angular frontend application for the Craft Fusion platform featuring Material Design 3 with a distinctive patriotic theme.

## Overview

Craft-Web provides the user interface for the Craft Fusion platform, built with Angular and Material Design components. It features a responsive design, comprehensive data visualization capabilities, and real-time communication with backend services.

## Features

- Material Design 3 implementation with patriotic theme
- Real-time data visualization
- Service monitoring with detailed metrics
- Responsive layout for desktop, tablet, and mobile devices
- Performance-optimized component architecture

## Technology Stack

- Angular 16+
- TypeScript 4.8+
- RxJS for reactive programming
- NgRx for state management
- D3.js and Chart.js for data visualization
- Angular Material components

## Development Environment Setup

### Prerequisites

- Node.js (v16+)
- npm or yarn
- Angular CLI

### Quick Start

```bash
# Install dependencies
npm install

# Start the development server
npm run start:web
```

Navigate to `http://localhost:4200/`.

### Backend Services

The frontend application connects to backend services:

- **NestJS API**: Runs on port 3000 by default
- **Go API**: Runs on port 4000 by default

#### Running without Backend Services

During development, you can run the frontend without having the backend services active. The application will use mock data when backend services are unavailable.

You can also explicitly enable mock mode:

1. Open browser developer tools (F12)
2. In the console, run: `localStorage.setItem('dev-mock-mode', 'true')`
3. Refresh the page

To disable mock mode:
```javascript
localStorage.setItem('dev-mock-mode', 'false')
```

#### Proxy Configuration

The development server is configured to proxy API requests to the backend services. See `src/proxy.config.json` for the configuration.

### Environment Configuration

Environment configuration is located in:

- `src/environments/environment.ts` (development)
- `src/environments/environment.prod.ts` (production)

Key environment variables:

- `apiUrl`: Base URL for API requests
- `useMockMetrics`: Force using mock metrics
- `useMockApiWhenUnavailable`: Use mock data when backend is unavailable
- `maxConnectionRetries`: Number of connection retries before using mock data

## Health Monitoring

The application includes health monitoring to check the status of backend services. The health status is displayed in the footer with a colored indicator:

- **Green**: All systems operational
- **Yellow**: Degraded performance
- **Red**: System offline

When hovering over the health indicator, a tooltip shows detailed health information.

## Architecture

The application follows a modular architecture with feature modules and shared components:

```plaintext
src/
├── app/
│   ├── core/         - Core services and guards
│   ├── shared/       - Shared components and pipes
│   └── features/     - Feature modules
├── assets/           - Static assets
└── styles/           - Global styles and theme
```

## Testing

```bash
# Run unit tests
nx test craft-web

# Run e2e tests
nx e2e craft-web-e2e
```

## Style System

Please refer to [styles/README.md](./src/styles/README.md) for detailed information about the styling system.

## Integration with Backend Services

The application integrates with both the NestJS (craft-nest) and Go (craft-go) backends through RESTful API calls and WebSocket connections for real-time updates.

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
>
> - **DO NOT** create a package.json file in this directory
> - All dependencies must be managed through the root-level package.json
> - Use `nx run craft-web:command` format for operations

To install a new dependency:

```bash
# Add a dependency for this application
cd ../../  # Navigate to root
npm install some-package --save
```

## Transparency Note

This README now reflects our ongoing MD3 migration. Some updates were guided by automated suggestions to streamline the process.

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

## 🌱 Angular Learning Resources

New to Angular or frontend development? We've all been there! Here are some resources to help you grow:

### Recommended Learning Path

1. **Start with the basics**: Complete the [Tour of Heroes](https://angular.io/tutorial) tutorial
2. **Understand our patterns**: Review our component examples in `src/app/shared/examples`
3. **Learn by doing**: Pick a simple component to modify (look for `beginner-friendly` comments)
4. **Ask for pair programming**: Our team is happy to schedule pairing sessions

### Common Angular Pitfalls

```typescript
// MISTAKE: Subscribing without unsubscribing
ngOnInit() {
  this.service.getData().subscribe(data => this.data = data); // Memory leak!
}

// BETTER: Use the async pipe in templates
// data$ = this.service.getData();
// Then in template: *ngIf="data$ | async as data"

// OR: Track and unsubscribe
private destroy$ = new Subject<void>();

ngOnInit() {
  this.service.getData()
    .pipe(takeUntil(this.destroy$))
    .subscribe(data => this.data = data);
}

ngOnDestroy() {
  this.destroy$.next();
  this.destroy$.complete();
}
```

### Component Detective Work

When trying to understand a component:

1. Look at its template file first to see what it displays
2. Review its TypeScript file to see data and behavior
3. Check its SCSS file to understand its styling
4. Examine where and how it's used in parent components

Remember: Everyone on the team was a beginner once. We value questions and fresh perspectives!

## Style Debugger

To help visualize our patriotic theme components with Material Design 3:

```bash
# Enable the style debugger
ng serve craft-web --configuration=debug
```

Then visit any page and press `Ctrl+Shift+D` to see style guides, component outlines, and theme colors in action.

## Additional Documentation

Add or revise any instructions for setting up this app.

## Application Architecture

See the project's main [ARCHITECTURE.md](../../docs/ARCHITECTURE.md) for details on the application architecture.
