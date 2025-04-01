# Craft Fusion Layout Patterns

## Core Layout Structure

Craft Fusion implements a classic application layout pattern with four primary components:

```
┌─────────────────────────────────────────────┐
│                  HEADER                     │
├────────────┬────────────────────────────────┤
│            │                                │
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

### Component Relationships

1. **Header**: Full-width, fixed height component at the top
2. **Sidebar**: Left-aligned, fixed-width (configurable) component
3. **Mainstage**: Flexible content area that grows to fill available space
4. **Footer**: Full-width component at the bottom with expandable height

### Layout Grid

The layout uses a flexible CSS Grid system with the following characteristics:

- 1em gutter between sidebar and mainstage
- Sidebar width based on content (minimum 200px, maximum 250px)
- Mainstage with flex-grow to fill remaining horizontal space
- Responsive behavior to adapt to different screen sizes

## Layout Implementation

The layout is implemented using a combination of CSS Flexbox and Grid:

```scss
.layout-container {
  display: flex;
  flex: 1;
  overflow: hidden;
  gap: 1em; // 1em gutter between sidebar and mainstage
}

.sidebar {
  width: auto;   // Width based on content
  max-width: 250px;
  min-width: 200px;
  flex-shrink: 0; // Prevent sidebar from shrinking
}

.main-stage {
  flex: 1; // Take up remaining space
  overflow: auto;
}
```

## Responsive Behavior

The layout automatically adapts to different screen sizes:

### Desktop View
- Sidebar displayed at full width alongside mainstage
- 1em gutter maintained between components
- Standard header and footer heights

### Tablet View
- Sidebar potentially collapses to narrower width
- Gutter maintained but reduced if needed
- Components maintain spatial relationships

### Mobile View
- Sidebar becomes a sliding panel with backdrop
- No gutter when sidebar is hidden
- Header and footer optimize for compact display

## Component Interactions

### Sidebar Collapsible State

The sidebar can be collapsed to a narrow width (64px) to maximize mainstage space:

```
┌─────────────────────────────────────────────┐
│                  HEADER                     │
├────┬──────────────────────────────────────┤
│    │                                        │
│    │                                        │
│ S  │                                        │
│ I  │           MAINSTAGE                    │
│ D  │                                        │
│ E  │                                        │
│    │                                        │
├────┴──────────────────────────────────────┤
│                  FOOTER                     │
└─────────────────────────────────────────────┘
```

### Footer Expanded State

The footer can expand to reveal additional information while shifting the mainstage content:

```
┌─────────────────────────────────────────────┐
│                  HEADER                     │
├────────────┬────────────────────────────────┤
│            │                                │
│            │                                │
│  SIDEBAR   │           MAINSTAGE            │
│            │                                │
│            │                                │
├────────────┴────────────────────────────────┤
│                                             │
│                                             │
│                  FOOTER                     │
│                 EXPANDED                    │
│                                             │
└─────────────────────────────────────────────┘
```

## Layout Service

The `LayoutService` manages the state of layout components:

- `sidebarExpanded$`: Observable for sidebar expanded/collapsed state
- `sidebarWidth$`: Observable for current sidebar width
- `footerExpanded$`: Observable for footer expanded/collapsed state
- `isMobile$`: Observable for current mobile state

## Theming Integration

Layout components respond to theme changes through the `ThemeService`:

- Header: Uses theme-specific gradients and colors
- Sidebar: Adapts background and accent colors based on theme
- Mainstage: Applies surface colors and elevations from theme
- Footer: Uses theme-consistent colors and decorative elements

The vibrant patriotic color scheme is applied across all components:

- Red border (hex: #B22234) for mainstage components
- Navy blue (hex: #002868) for header gradients
- Gold (hex: #FFD700) for interactive elements

## Usage Guidelines

### Container Elements

When creating new pages or components that live in the mainstage:

```html
<div class="page-container">
  <!-- Your page content here -->
</div>
```

### Working with Sidebar

The sidebar width should only contain the longest button and icon combination:

```html
<aside class="sidebar" [ngClass]="{'collapsed': !layoutService.isSidebarExpanded()}">
  <!-- Sidebar content -->
</aside>
```

### Maximizing Mainstage Space

The mainstage should flex-grow to use available space:

```html
<main class="main-stage">
  <!-- Main content -->
</main>
```

## Related Documentation

- [Theme System](./THEME-SYSTEM.md) - How themes apply to layout components
- [Responsive Design](../apps/craft-web/src/styles/README.md) - Responsive behavior details
- [Component Library](../docs/COMPONENTS.md) - Individual component documentation
