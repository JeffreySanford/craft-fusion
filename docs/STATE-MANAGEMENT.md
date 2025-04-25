# Craft Fusion State Management

## Overview

Craft Fusion implements a sophisticated state management strategy combining Ward Bell's state mechanism principles with Dan Wahlin's enhancements to RXJS state methodology.

## Core Concepts

### Ward Bell's State Mechanism

Ward Bell's approach focuses on:

- Immutable state objects
- Controlled state transitions
- Clear ownership of state
- Minimal but sufficient abstraction
- Performance optimization through smart comparison strategies

### Dan Wahlin's RXJS Methodology

Dan Wahlin's additions include:

- Stream-based state management with RxJS
- Single source of truth with BehaviorSubject
- State segregation by domain/feature
- Selective state access through projections
- Optimistic UI updates with proper error handling

## Implementation Details

### State Stores

Each feature module has its own state store that:

- Maintains an internal BehaviorSubject of state
- Exposes read-only observables of state 
- Provides atomic update actions
- Handles side-effects through services

### State Access Pattern

Services and components should:

1. Inject the appropriate state store
2. Subscribe to specific state slices
3. Dispatch actions rather than modifying state directly
4. Use async pipe in templates when possible

### State Change Flow

```
[Component/Service] -> [Action] -> [State Store] -> [State Change] -> [Subscribers]
```

## Best Practices

1. Keep state normalized and flat when possible
2. Use selectors to derive complex state
3. Avoid duplicate state
4. Document state shape for each store
5. Include proper error handling in state transitions

## Integration with API Service

The ApiService is designed to work seamlessly with our state management:

- API methods return Observables that can be directly consumed by state stores
- Error handling is centralized in the API layer
- State stores decide whether to update optimistically or pessimistically

## Examples

See the following files for implementation examples:
- `user-state.service.ts`: User authentication and profile state
- `admin-state.service.ts`: Admin-specific state management
- `logger.service.ts`: Logging state and history

Last Updated: 2025-03-25
