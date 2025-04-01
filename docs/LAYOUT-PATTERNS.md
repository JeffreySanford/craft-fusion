# Craft Fusion Layout System

## Overview

Craft Fusion implements a responsive layout system with fixed header and footer, and a flexible main content area with sidebar. The layout is designed to maximize usable screen space while maintaining consistent navigation access.

## Layout Structure

```plaintext
┌─────────────────────────────────────────────┐
│                  HEADER                     │ <- Fixed to top of viewport
├────────────┬────────────────────────────────┤
│            │                                │
│            │                                │
│  SIDEBAR   │           MAINSTAGE            │ <- 1em gutter between
│            │                                │    sidebar and mainstage
│            │                                │
│            │                                │
│            │                                │
├────────────┴────────────────────────────────┤
│                  FOOTER                     │ <- Fixed to bottom of viewport
└─────────────────────────────────────────────┘
```

## Layout Components

### Header

- Fixed to the top of the viewport
- Contains primary navigation, search, and user controls
- Maintains consistent access across all views

### Footer

- Fixed to the bottom of the viewport
- Contains copyright, legal links, and auxiliary information
- Can be expanded to show additional content

### Sidebar

- Fixed height between header and footer
- Collapsible to provide more space for main content
- Contains application-specific navigation
- Admin section available to authorized users only

### Mainstage

- Main content area that adjusts based on sidebar state
- Includes 1em gutter padding for consistent spacing
- Scrolls independently when content exceeds viewport height

## Responsive Behavior

- On mobile devices, the sidebar collapses or hides completely
- Header and footer remain fixed, but may adjust their height
- Mainstage takes full width on smaller screens
- Media queries adjust layout dimensions at standard breakpoints

## Layout Configuration

The `LayoutService` provides methods to configure the layout:

```typescript
// Configure layout dimensions
layoutService.setHeaderHeight(64);
layoutService.setFooterHeight(48);
layoutService.setSidebarWidth(250);
layoutService.setGutterSize(16);

// Configure layout visibility
layoutService.configureLayout({
  header: true,
  footer: true,
  sidebar: true,
  sidebarExpanded: true
});
```

## CSS Variables

Layout dimensions are exposed as CSS variables:

- `--header-height`
- `--footer-height`
- `--sidebar-width`
- `--gutter-size`

These variables can be used in component styles for consistent spacing.

## Accessibility Considerations

- Content focus is maintained when navigating with keyboard
- Sidebar collapse state is persisted in user preferences
- ARIA landmarks are used for major layout sections
