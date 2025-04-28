# Memorial Timeline Feature

## Overview

The Memorial Timeline feature provides family users with an interactive, real-time timeline of significant family events, memories, and memorials. It creates a living historical record within the Craft Fusion platform, styled with our distinctive patriotic theme and updated in real-time via WebSockets.

## Table of Contents

1. [Purpose and Goals](#purpose-and-goals)
2. [Architecture](#architecture)
3. [Technical Implementation](#technical-implementation)
4. [Real-time Data Flow](#real-time-data-flow)
5. [Styling and Theming](#styling-and-theming)
6. [Security and Access Control](#security-and-access-control)
7. [Performance Considerations](#performance-considerations)
8. [Future Enhancements](#future-enhancements)
9. [Testing Strategy](#testing-strategy)

## Purpose and Goals

The Memorial Timeline serves several important purposes:

- Provide a chronological view of family history and significant events
- Create a living record that updates in real-time for all family members
- Incorporate meaningful events like anniversaries, milestones, and memorials
- Restrict access to authenticated users with the "family" role
- Deliver a responsive, visually appealing experience consistent with Craft Fusion's patriotic theme
- Demonstrate effective Angular/NestJS real-time communication via WebSockets

## Architecture

### Module Organization

The Memorial Timeline feature follows our projects-based architecture:

```
apps/
  craft-web/                    # Angular web application
    src/app/projects/family/    # Family domain features
      memorial-timeline/        # Memorial Timeline feature
        components/             # UI components
          timeline-page/        # Container component
          timeline-list/        # List of timeline events
          timeline-item/        # Individual event display
        models/                 # Data models and interfaces
          timeline-event.model.ts
        services/               # Data access and state management
          timeline.service.ts
        memorial-timeline.module.ts
  api/                          # NestJS backend
    src/app/family/timeline/    # Backend counterpart
      schemas/                  # Mongoose schemas
      dto/                      # Data transfer objects
      timeline.controller.ts    # REST API endpoints
      timeline.gateway.ts       # WebSocket communication
      timeline.service.ts       # Business logic
```

This organization ensures clear separation of concerns while keeping related code together.

## Technical Implementation

### Frontend (Angular)

The feature is implemented as an Angular module that:

1. **Module Structure**: Non-standalone components organized into a cohesive feature module
2. **Routing**: Lazy-loaded route protected by AuthGuard and RoleGuard for "family" role
3. **Component Hierarchy**:
   - TimelinePageComponent (container): Manages data subscriptions and state
   - TimelineListComponent: Renders the collection of events
   - TimelineItemComponent: Renders individual event cards
4. **Material Design**: Uses Angular Material components (MatCard, MatList, etc.)
5. **Observable Data**: Everything managed through RxJS Observables

### Backend (NestJS)

The backend implementation includes:

1. **REST API**: Standard CRUD operations for timeline events via TimelineController
2. **WebSockets**: Real-time updates through Socket.IO integration via TimelineGateway
3. **Authorization**: JWT authentication with role-based guards
4. **Database**: MongoDB with Mongoose for data persistence
5. **DTOs**: Strongly-typed data transfer objects for validation

## Real-time Data Flow

The real-time updates are implemented with WebSockets using Socket.IO:

1. **Connection Establishment**:
   - Client establishes a WebSocket connection with JWT token
   - Server validates token and role permissions

2. **Data Flow**:
   - Initial events loaded via HTTP API
   - Server pushes new events via WebSockets
   - Events accumulated with RxJS scan operator

3. **Observable Pattern**:
   ```typescript
   // Hot observable stream of timeline events
   events$ = this.eventsSubject.asObservable().pipe(shareReplay(1));
   
   // Accumulate events from WebSocket
   this.socket$.pipe(
     scan((acc: TimelineEvent[], msg) => [...acc, msg.event], []),
     tap(events => this.eventsSubject.next(events))
   ).subscribe();
   ```

4. **Event Types**:
   - New event creation
   - Event updates
   - Event removal

## Styling and Theming

The Memorial Timeline adheres to Craft Fusion's patriotic design system:

1. **Color Scheme**:
   - Primary Blue: #002868 (Navy)
   - Secondary Red: #BF0A30
   - Tertiary Gold: #FFD700
   - Neutral White: #FFFFFF

2. **Component Styling**:
   - Material Design 3 components
   - CSS variables for theming
   - SCSS modules following BEM conventions
   - Flag-inspired gradients and accents

3. **Animations**:
   - Subtle entrance animations for new events
   - Staggered animations for list items
   - Respects reduced motion preferences

4. **Responsive Design**:
   - Adapts to all screen sizes
   - Mobile-first approach
   - Consistent spacing using design tokens

## Security and Access Control

Access to the Memorial Timeline is restricted to authenticated users with the "family" role:

1. **Route Guards**:
   - AuthGuard ensures valid authentication
   - RoleGuard checks for "family" role

2. **WebSocket Authentication**:
   - JWT validation on connection
   - Role verification for subscription

3. **API Endpoints**:
   - JWT and role verification for all REST operations
   - Input validation with DTOs

## Performance Considerations

The feature implements several performance optimizations:

1. **Efficient Data Loading**:
   - Initial bulk load via HTTP
   - Incremental updates via WebSockets
   - ShareReplay to prevent duplicate subscriptions

2. **Change Detection**:
   - OnPush change detection strategy
   - Async pipe for automatic subscription management
   - Pure pipes for transformations

3. **Memory Management**:
   - Proper resource cleanup on component destruction
   - Limit on timeline event history depth
   - Typed data structures

## Future Enhancements

Planned improvements for the Memorial Timeline feature:

1. **Timeline Filtering**:
   - Filter by event type
   - Search by content
   - Date range selection

2. **Rich Media Support**:
   - Image galleries
   - Video embeds
   - Document attachments

3. **Interaction Features**:
   - Comments on timeline events
   - Reactions/emoji responses
   - Family member tagging

4. **Timeline Visualization**:
   - Alternative calendar view
   - Interactive timeline navigation
   - Categorized event display

## Testing Strategy

The Memorial Timeline includes a comprehensive testing strategy:

1. **Unit Tests**:
   - Component testing with TestBed
   - Service testing with HttpClientTestingModule
   - WebSocket testing with mock Socket.IO

2. **Integration Tests**:
   - Component interaction
   - Service/component integration
   - WebSocket event handling

3. **E2E Tests**:
   - User flow testing
   - Authentication and authorization
   - Real-time update verification

---

*Last Updated: 2025-05-15*
