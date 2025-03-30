# Craft Fusion Web App

This README provides information about the structure and components of the Craft Fusion web application.

## Application Structure

The app follows a modular architecture with these key directories:

### Common Directory (`/common`)

Contains shared code used throughout the application:

- **Components**: Reusable UI elements
  - `video-background`: Manages background video rendering with theme support
  - Other shared components

- **Directives**: Custom attribute directives
  - `highlight`: Element highlighting effects
  - `pop`: Animation effects for elements
  - `sparkle`: Visual enhancement effects

- **Facades**: Simplified interfaces to complex subsystems
  - `ui-state.facade`: Centralizes UI state management
  - `user-facade`: Simplifies user-related operations

- **Guards**: Route protection logic
  - `admin.guard`: Restricts admin route access

- **Interceptors**: HTTP request/response processing
  - `api-logger`: Logs API interactions
  - `auth`: Handles authentication headers
  - `logging`: General HTTP logging
  - `metrics`: Performance tracking
  - `user-state`: User context management

- **Services**: Core business logic
  - `api`: Data access and API communication
  - `authentication`: User login/logout functionality
  - `environment`: Environment configuration access
  - `logger`: Application logging with categories and levels
  - `theme`: Theme management with support for multiple themes
  - `video-background`: Background video management

### Pages Directory (`/pages`)

Contains top-level pages and layout components:

- **admin**: Administrative control panel
- **footer**: Site footer with expandable features
- **header**: Navigation header with theme controls and user menu
- **landing**: Main landing page with feature showcases
- **resume**: Professional resume display
- **sidebar**: Navigation sidebar with collapsible menu

### Projects Directory (`/projects`)

Contains distinct feature modules, each demonstrating different capabilities:

- **book**: Interactive book viewer
- **chat**: Real-time messaging application
- **data-visualizations**: Advanced data visualization components
- **peasant-kitchen**: Recipe management system
- **space-video**: Custom video player with space theme
- **table**: Data management with sorting and filtering

## Key Features

1. **Theme System**: Multiple themes with smooth transitions
2. **Video Backgrounds**: Theme-aware video backgrounds
3. **Responsive Design**: Works on mobile and desktop
4. **Animation System**: Custom animations for enhanced UX
5. **Module Structure**: Lazy-loaded modules for better performance
6. **Component Architecture**: Reusable, well-encapsulated components
7. **Service Layer**: Clean separation of concerns
8. **Material Design**: Consistent UI with Material components

## Development Guidelines

- New features should be added as modules in the appropriate directory
- Shared code should be placed in the common directory
- Follow Angular best practices for component design
- Ensure all components work with the theme system
- Write unit tests for services and components
- Document complex logic with inline comments
- Update this README when adding new directories or major features
