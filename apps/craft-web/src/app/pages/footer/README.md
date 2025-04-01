# Footer Component

## Overview

The footer component provides a consistent bottom section for the application with both collapsed and expanded states, featuring a patriotic theme with interactive elements and data visualization.

## Integration with Layout Service

The footer component integrates with the `LayoutService` to manage its expanded state:

- `isFooterExpanded$`: Observable from the LayoutService that tracks the expanded state
- The component subscribes to this Observable to stay in sync with the application layout
- When the footer expands, the layout adjusts other elements (sidebar, main-stage) automatically

## Layout Structure

### Collapsed State
- Full-width design with a clean, minimalistic appearance
- Left side features an animated gold star (grows to 200% then returns to normal size)
- "Jeffrey Sanford" text in gold
- Toggle button for expanding/collapsing

### Expanded State
The expanded footer consists of two rows:

#### Row 1 (Top Row)
- **Contact Container** (20% width) on the left side
  - Contains contact information and links
- **Industry Logos Container** (40% width) in the center
  - Displays industry partner logos
  - Logos zoom to 200% on hover
- **Federal Agencies Logos Container** (40% width) on the right
  - Displays federal agency logos
  - Logos zoom to 200% on hover

#### Row 2 (Bottom Row)
- **Full-Width Graph**
  - Fine-lined data visualization that smoothly animates
  - Real-time data display
  - Adapts to the screen size

### Interactive Elements
- All logos have 200% zoom effect on hover
- Logos are clickable and navigate to external sites
- Unified click handler function manages external navigation

## Theming

The footer supports four different themes using the ThemeService:

1. **Default Patriotic** - Red, navy, and gold
2. **Modern Navy** - Darker blues with gold accents
3. **Classic Red** - Red dominant with white and blue accents
4. **Elegant Gold** - Gold dominant with navy accents

## Layout Impact

When the footer expands:
- The sidebar (bordered orange) adjusts its height to accommodate the expanded footer
- The main-stage container (bordered red) also adjusts its padding to prevent content overlap
- Both containers receive a `.footer-expanded` class for styling

## Responsive Behavior

- The footer adjusts its height dynamically based on the expanded state
- On small screens:
  - Collapsed state remains minimal
  - Expanded state changes to a stacked layout
  - Logo containers stack vertically
- The graph maintains proportions while scaling to screen width

## Usage

To include the footer in your layout, add:

```html
<app-footer></app-footer>
```

## Animation Details

1. **Star Animation**:
   - Entry animation: Grows to 200% and returns to normal size
   - Subtle pulsing effect when idle

2. **Graph Animation**:
   - Smooth data transitions
   - Line drawing effect when first displayed

3. **Logo Interactions**:
   - Smooth 200% zoom on hover
   - Subtle fade effect when clicked

## Accessibility

- Toggle button includes proper aria-label and role
- All interactive elements are keyboard navigable
- Animations respect reduced-motion preferences
- External links properly marked with aria attributes
- Color contrast meets WCAG standards across all themes

## Integration with Data Services

The graph visualization connects to the application's data service to display real-time metrics with smooth transitions between data points.
