# Craft Fusion Web Application

## Architecture Overview

Craft Fusion is built using Angular with a focus on maintainable, component-based architecture following Material Design 3 principles with a vibrant patriotic theme.

## Core Layout Pattern

The application follows a classic four-component layout pattern:

```
┌─────────────────────────────────────────────┐
│                  HEADER                     │
├────────────┬────────────────────────────────┤
│            │                                │
│            │                                │
│  SIDEBAR   │           MAINSTAGE            │
│            │                                │
│            │                                │
│            │                                │
├────────────┴────────────────────────────────┤
│                  FOOTER                     │
└─────────────────────────────────────────────┘
```

### Key Layout Features

- **1em Gutter** between sidebar and mainstage for clear visual separation
- **Sidebar** width is based on content (longest button + icon)
- **Mainstage** uses flex-grow to fill remaining horizontal space
- **Responsive Design** adapts layout for different screen sizes

## Component Structure

### App Component

The app component (`app.component.ts`) serves as the layout container for the entire application:

```html
<div class="app-container">
  <!-- Background video component -->
  <app-video-background></app-video-background>

  <!-- Main application layout -->
  <div class="page-container">
    <!-- Header -->
    <app-header></app-header>
    
    <!-- Main content area with sidebar -->
    <div class="layout-container">
      <!-- Sidebar -->
      <aside class="sidebar" [ngClass]="{'collapsed': !layoutService.isSidebarExpanded()}" 
             [style.width.px]="layoutService.isSidebarExpanded() ? sidebarWidth : null">
        <app-sidebar></app-sidebar>
      </aside>
      
      <!-- Main content with 1em gutter from sidebar -->
      <main class="main-stage">
        <router-outlet></router-outlet>
      </main>
    </div>
    
    <!-- Footer -->
    <app-footer></app-footer>
  </div>
</div>
```

### Layout Management

The layout is managed primarily through the `LayoutService`, which provides:

- Control of sidebar expanded/collapsed state
- Management of sidebar width
- Footer expanded/collapsed state
- Mobile detection and responsive behavior

## Styling System

The application uses a comprehensive SCSS architecture with:

- Design tokens based on Material Design 3
- Vibrant patriotic color theme with navy blue, red, and gold
- Responsive utilities for adapting to different device sizes
- Animation system for smooth transitions between states

Key colors used throughout the layout:

- Primary (Navy): #002868
- Secondary (Red): #B22234
- Tertiary (Gold): #FFD700

## Navigation Flow

1. The application starts with the landing page as the entry point
2. The sidebar provides navigation to primary application features
3. The mainstage displays the active component based on route
4. The header provides global actions and theme switching
5. The footer displays system status and expandable information

## Key Services

### LayoutService

Manages the application layout, particularly sidebar width and states:

```typescript
// Example usage in a component
constructor(private layoutService: LayoutService) {}

ngOnInit(): void {
  this.layoutService.sidebarExpanded$.subscribe(expanded => {
    // React to sidebar expanded/collapsed state
  });
  
  this.layoutService.sidebarWidth$.subscribe(width => {
    // React to sidebar width changes
  });
}
```

### ThemeService

Controls theming across all layout components:

```typescript
// Example usage in a component
constructor(private themeService: ThemeService) {}

ngOnInit(): void {
  this.themeService.currentTheme$.subscribe(theme => {
    // Apply theme-specific styling
  });
}
```

## Performance Considerations

1. The layout components are optimized for minimal re-rendering
2. Lazy-loaded modules reduce initial load time
3. CSS variables enable efficient theme switching without DOM manipulation
4. Animations are hardware-accelerated where possible

## Integration Guidelines

When creating new components to display in the mainstage:

1. Respect the layout containers' dimensions and constraints
2. Use the theming system for consistent appearance
3. Support responsive layouts for different screen sizes
4. Implement proper animations for transitions

## Related Documentation

- [Layout Patterns](../../../docs/LAYOUT-PATTERNS.md) - Detailed layout structure documentation
- [Theme System](../../../docs/THEME-SYSTEM.md) - Comprehensive theme documentation 
- [Style Guide](../../styles/README.md) - Styling architecture and patterns
