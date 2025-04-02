# Layout Patterns

## Core Layout Structure

The application follows a fixed layout structure with header and footer anchored to the viewport, and a collapsible sidebar next to the main content area:

```plaintext
┌─────────────────────────────────────────────┐
│                  HEADER                     │ <- Fixed to top (height: 64px)
├────────────┬────────────────────────────────┤
│            │                                │
│            │                                │
│  SIDEBAR   │           MAINSTAGE            │ <- 16px gutter between
│            │                                │    sidebar and mainstage
│            │                                │
│            │                                │
│            │                                │
├────────────┴────────────────────────────────┤
│                  FOOTER                     │ <- Fixed to bottom (height: 48px)
└─────────────────────────────────────────────┘
```

## Layout Dimensions

### Fixed Dimensions
- **Header Height**: 64px
- **Footer Height**: 48px
- **Sidebar Width**: 
  - Expanded: 240px
  - Collapsed: 60px
- **Gutter Width**: 16px (space between sidebar and mainstage)

### Responsive Adjustments
- On mobile devices (width < 768px):
  - Sidebar becomes overlay (hidden by default)
  - Mainstage extends full width
  - Header height reduces to 56px

## CSS Variables

Layout dimensions are exposed as CSS variables for consistency:

```css
:root {
  --header-height: 64px;
  --footer-height: 48px;
  --sidebar-width: 240px;
  --sidebar-collapsed-width: 60px;
  --gutter-width: 16px;
}

@media (max-width: 768px) {
  :root {
    --header-height: 56px;
    --sidebar-width: 280px; /* wider for touch targets */
  }
}
```

## Mainstage and Sidebar Alignment

The mainstage and sidebar must be properly aligned with the correct gutter space between them:

### Sidebar Styling
```css
.sidebar {
  position: fixed;
  top: var(--header-height);
  left: 0;
  width: var(--sidebar-width);
  height: calc(100vh - var(--header-height) - var(--footer-height));
  overflow-y: auto;
  transition: transform 0.3s ease, width 0.3s ease;
  z-index: 100;
}

.sidebar.collapsed {
  width: var(--sidebar-collapsed-width);
}

@media (max-width: 768px) {
  .sidebar {
    transform: translateX(-100%);
  }
  
  .sidebar.expanded {
    transform: translateX(0);
  }
}
```

### Mainstage Styling
```css
.mainstage {
  margin-left: calc(var(--sidebar-width) + var(--gutter-width));
  padding: 16px;
  min-height: calc(100vh - var(--header-height) - var(--footer-height));
  transition: margin-left 0.3s ease;
  overflow-y: auto;
}

.sidebar-collapsed .mainstage {
  margin-left: calc(var(--sidebar-collapsed-width) + var(--gutter-width));
}

@media (max-width: 768px) {
  .mainstage {
    margin-left: 0;
  }
}
```

## Events and State Management

The layout system uses the LayoutService to manage state and coordinate responsive behavior:

```typescript
// Sample usage of LayoutService
constructor(private layoutService: LayoutService) {
  this.layoutService.sidebarCollapsed$.subscribe(collapsed => {
    this.sidebarCollapsed = collapsed;
    // Update layout accordingly
  });
}

toggleSidebar() {
  this.layoutService.toggleSidebar();
}
```

## Best Practices

1. **Always use the CSS variables** for layout dimensions, never hardcode values
2. **Content areas should set their own padding** while the layout system handles margins
3. **Page components should use `overflow-y: auto`** rather than visible to prevent page-level scrolling
4. **Use the responsive utilities** provided for consistent behavior across screen sizes
5. **Test layout at all breakpoints** to ensure proper functioning
