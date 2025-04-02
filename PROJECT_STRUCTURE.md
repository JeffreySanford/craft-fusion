# Project Structure

This document outlines the structure of the Craft Fusion project to help developers navigate and understand the codebase.

## Overview

Craft Fusion is a monorepo managed with Nx that includes:
- Angular frontend application
- NestJS backend API service
- Go microservices

## Top-Level Structure

```
craft-fusion/
├── apps/                  # Contains all applications in the monorepo
│   ├── craft-web/         # Main web application
│   └── ...                # Other applications (API, etc.)
├── libs/                  # Shared libraries and modules
├── tools/                 # Build tools and scripts
├── docs/                  # Documentation
└── README.md              # Project overview
```

## Main Application Structure (apps/craft-web)

```
craft-web/
├── src/                   # Source files
│   ├── app/               # Application code
│   ├── assets/            # Static assets (images, videos, fonts)
│   ├── environments/      # Environment configurations
│   ├── styles/            # Global styles and variables
│   └── main.ts            # Main entry point
├── jest.config.js         # Jest testing configuration
└── tsconfig.json          # TypeScript configuration
```

## Application (src/app)

### Core Folders

#### `app/common/`
Contains shared code used throughout the application.

- **components/**: Reusable UI components
  - `video-background/`: Video background components
  - `app-video-background/`: Video background application wrapper

- **directives/**: Custom Angular directives
  - `highlight.directive.ts`: Adds highlight effects to elements
  - `pop.directive.ts`: Adds pop animation effects
  - `sparkle.directive.ts`: Adds sparkle animation effects

- **facades/**: Facade services that simplify complex subsystems
  - `ui-state.facade.ts`: Manages UI state across the application
  - `user-facade.service.ts`: Simplifies user-related operations

- **guards/**: Route guards for authentication and authorization
  - `admin.guard.ts`: Restricts access to admin routes

- **interceptors/**: HTTP interceptors
  - `api-logger.interceptor.ts`: Logs API calls
  - `auth.interceptor.ts`: Handles authentication for HTTP requests
  - `logging.interceptor.ts`: General request/response logging
  - `metrics.interceptor.ts`: Collects performance metrics
  - `user-state.interceptor.ts`: Manages user state during HTTP requests

- **interfaces/**: TypeScript interfaces and types
  - `user-state.interface.ts`: Defines user state structure

- **pipes/**: Custom Angular pipes
  - Shared through the `shared-pipes.module.ts`

- **services/**: Core services that provide functionality
  - `api.service.ts`: Core API communication
  - `authentication.service.ts`: User authentication
  - `busy.service.ts`: Loading state management
  - `environment.service.ts`: Environment configuration
  - `health.service.ts`: System health monitoring
  - `logger.service.ts`: Application logging
  - `notification.service.ts`: User notifications
  - `theme.service.ts`: Theme management
  - `video-background.service.ts`: Video background management

#### `app/pages/`
Contains top-level pages and layout components.

- **admin/**: Administration pages and components
- **footer/**: Footer component and related modules
- **header/**: Header component and related modules
- **landing/**: Landing page components
  - `material-animations/`: Animation showcase components
  - `material-buttons/`: Button showcase components
  - `material-icons/`: Icon showcase components
- **resume/**: Resume page component
- **sidebar/**: Sidebar navigation component

#### `app/projects/`
Contains feature modules for different projects/demos.

- **book/**: Book project components
- **chat/**: Chat application components
- **data-visualizations/**: Data visualization components
  - `quantum-fisher-information/`: Specialized visualization components
- **peasant-kitchen/**: Recipe and food related components
  - `recipe/`: Individual recipe view
  - `recipes/`: Recipe list view
- **space-video/**: Space-themed video player project
- **table/**: Data table components
  - `record-detail/`: Record details view

### Core Files

- `app.component.ts`: Root component of the application
- `app.module.ts`: Main application module
- `app.routes.ts`: Application routing configuration
- `app-routing.module.ts`: Module-based routing configuration
- `material.module.ts`: Angular Material module imports
- `animated-directives.module.ts`: Custom animation directives

## Assets (src/assets)

- **images/**: Image assets
  - `logos/`: Logo files for branding
  - `default-avatar.png`: Default user avatar

- **video/**: Video files
  - `haynes-astronauts.mp4`: Space-themed video content
  - `light-theme-background.mp4`: Background video for light theme
  - `dark-theme-background.mp4`: Background video for dark theme

- **fonts/**: Custom font files

## Styles (src/styles)

- **_animations.scss**: Animation definitions
- **_layout.scss**: Layout mixins and structures
- **_responsive.scss**: Responsive design utilities
- **_themes.scss**: Theme definitions
- **_utilities.scss**: Utility classes and mixins
- **_variables.scss**: Global SCSS variables

## Environment Configuration (src/environments)

- **environment.ts**: Development environment settings
- **environment.prod.ts**: Production environment settings

## Key Design Patterns

1. **Module-based Architecture**: Features are organized into modules for better code organization and lazy loading.

2. **Facade Pattern**: Facades abstract complex subsystems (e.g., `UserFacadeService`).

3. **Service Layer**: Business logic is encapsulated in services.

4. **Interceptor Pattern**: HTTP requests are processed through interceptors for authentication, logging, and metrics.

5. **Component-based UI**: The UI is composed of reusable components.

6. **Theme System**: Supports multiple themes with seamless switching.

7. **Responsive Design**: Adapts to different screen sizes using responsive utilities.

## Naming Conventions

- **Components**: Named with descriptive nouns (e.g., `HeaderComponent`)
- **Services**: Named with their functionality (e.g., `LoggerService`)
- **Directives**: Named with their action (e.g., `HighlightDirective`)
- **Interfaces**: Named with their data structure (e.g., `UserState`)
- **Modules**: Named with their feature area (e.g., `HeaderModule`)
