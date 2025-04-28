# Craft Fusion Design System

This document provides a comprehensive guide to the Craft Fusion design system, which follows Material Design 3 (MD3) principles with a distinctive patriotic theme. It consolidates styling information from across the project to serve as the central design reference.

## Table of Contents
1. [Design Principles](#design-principles)
2. [Color System](#color-system)
3. [Typography](#typography)
4. [Layout & Spacing](#layout--spacing)
5. [Component Design](#component-design)
6. [Animation System](#animation-system)
7. [Responsive Design](#responsive-design)
8. [Accessibility](#accessibility)
9. [Design Tokens](#design-tokens)
10. [Implementation Guidelines](#implementation-guidelines)
11. [File Structure](#file-structure)
12. [Best Practices](#best-practices)

## Design Principles

### Material Design 3 Integration
The design system implements Google's Material Design 3 principles, providing:

- **Personalized Design System**: Greater customization through a dynamic color system
- **Improved Accessibility**: Enhanced contrast ratios and touch targets
- **Cohesive Cross-Platform Experience**: Consistent design language across all platforms
- **Adaptive Layouts**: Better responsive behaviors for different screen sizes
- **Simplified Component Structure**: More intuitive component architecture
- **Performance Improvements**: More efficient rendering and animations

### Patriotic Theme
Craft Fusion features a vibrant patriotic color theme:

- **Red** (#B22234): Used for emphasis, calls-to-action, and active states
- **Navy** (#002868): Used for primary surfaces and text
- **Gold** (#FFD700): Used for accents and interactive elements
- **White** (#FFFFFF): Used for backgrounds and text on dark surfaces

## Color System

### Primary Colors
- **Primary**: Navy Blue (#002868)
- **On Primary**: White (#FFFFFF)
- **Primary Container**: Light Blue (#D1E4FF)
- **On Primary Container**: Dark Blue (#001D4C)

### Secondary Colors
- **Secondary**: Red (#BF0A30)
- **On Secondary**: White (#FFFFFF)
- **Secondary Container**: Light Red (#FFD8D8)
- **On Secondary Container**: Dark Red (#650014)

### Tertiary Colors
- **Tertiary**: Gold (#FFD700)
- **On Tertiary**: Black (#000000)
- **Tertiary Container**: Light Gold (#FFE97D)
- **On Tertiary Container**: Dark Gold (#403100)

### Surface Colors
- **Surface**: White (#FFFFFF)
- **On Surface**: Dark Gray (#1C1B1E)
- **Surface Container**: Light Gray (#F3EFF4)
- **On Surface Container**: Dark Gray (#1C1B1E)

### State Colors
- **Error**: Red (#BA1B1B)
- **Warning**: Amber (#F9AA33)
- **Success**: Green (#386A20)
- **Info**: Blue (#0061A4)

### Dark Mode
A complementary dark theme is implemented with appropriate color adjustments:

- **Surface Dark**: Dark Gray (#141218)
- **On Surface Dark**: Light Gray (#E6E0E9)
- **Primary Dark**: Light Blue (#B3C5FF)
- **Secondary Dark**: Light Red (#FFB4AB)

## Typography

Craft Fusion uses a type scale following MD3 guidelines with all sizes in `em` units for better scaling:

### Font Family
- **Primary**: Roboto, sans-serif
- **Secondary**: Roboto Condensed, sans-serif
- **Monospace**: Roboto Mono, monospace

### Type Scale
- **Display Large**: 3.5625em (57px equivalent)
- **Display Medium**: 2.8125em (45px equivalent)
- **Display Small**: 2.25em (36px equivalent)
- **Headline Large**: 2em (32px equivalent)
- **Headline Medium**: 1.75em (28px equivalent)
- **Headline Small**: 1.5em (24px equivalent)
- **Title Large**: 1.375em (22px equivalent)
- **Title Medium**: 1em (16px equivalent)
- **Title Small**: 0.875em (14px equivalent)
- **Body Large**: 1em (16px equivalent)
- **Body Medium**: 0.875em (14px equivalent)
- **Body Small**: 0.75em (12px equivalent)
- **Label Large**: 0.875em (14px equivalent)
- **Label Medium**: 0.75em (12px equivalent)
- **Label Small**: 0.6875em (11px equivalent)

## Layout & Spacing

### Grid System
Craft Fusion uses a 12-column grid system for layout consistency:

- **Columns**: 12 columns for desktop, 8 for tablet, 4 for mobile
- **Gutters**: 24px (desktop), 16px (tablet), 8px (mobile)
- **Margins**: 24px (desktop), 16px (tablet), 16px (mobile)

### Spacing
Spacing follows an 8px-based system implemented as em units:

```scss
$spacing-unit: 0.5em; // 8px equivalent
$spacing: (
  0: 0,
  1: $spacing-unit,     // 0.5em (8px)
  2: $spacing-unit * 2, // 1em (16px)
  3: $spacing-unit * 3, // 1.5em (24px)
  4: $spacing-unit * 4, // 2em (32px)
  5: $spacing-unit * 5, // 2.5em (40px)
  6: $spacing-unit * 6, // 3em (48px)
  7: $spacing-unit * 7, // 3.5em (56px)
  8: $spacing-unit * 8  // 4em (64px)
);
```

### Breakpoints
The responsive design system uses these breakpoints:

```scss
$breakpoints: (
  sm: 36em,   // 576px equivalent
  md: 48em,   // 768px equivalent
  lg: 62em,   // 992px equivalent
  xl: 75em,   // 1200px equivalent
  xxl: 87.5em // 1400px equivalent
);
```

## Component Design

### Button System
- **Filled**: Primary actions (solid background)
- **Outlined**: Secondary actions (outlined with transparent background)
- **Text**: Tertiary actions (text only, no background or border)
- **Icon**: Compact actions (circular with icon)
- **FAB**: Primary floating action (circular with icon)

### Cards
- **Elevated**: Prominent cards with shadow
- **Filled**: Cards with solid background
- **Outlined**: Cards with border and transparent background

### Data Display
- **Tables**: For structured data comparison
- **Lists**: For collections of items
- **Charts**: For data visualization using the patriotic color scheme

### Navigation
- **Top App Bar**: Primary navigation and actions
- **Navigation Drawer**: Side navigation (both permanent and temporary)
- **Bottom Navigation**: Mobile primary navigation
- **Tabs**: Secondary navigation between related content

## Animation System

### Motion Principles
- **Informative**: Motion communicates state and provides feedback
- **Focused**: Motion guides attention to important elements
- **Expressive**: Motion adds character and visual appeal

### Duration Guidelines
- **Small** (100ms): Immediate feedback, toggle states
- **Medium** (200ms): Standard transitions
- **Large** (300ms): Complex transitions, page changes

### Easing Functions
- **Standard** (cubic-bezier(0.2, 0.0, 0, 1.0)): Most transitions
- **Deceleration** (cubic-bezier(0.0, 0.0, 0.2, 1.0)): Elements entering the screen
- **Acceleration** (cubic-bezier(0.4, 0.0, 1, 1.0)): Elements leaving the screen

### Reduced Motion
All animations include reduced motion alternatives for users with motion sensitivity preferences.

## Responsive Design

### Mobile-First Approach
Components are designed for mobile first, then enhanced for larger screens.

### Responsive Patterns
- **Column Drop**: Columns stack vertically on smaller screens
- **Layout Shifter**: Elements reposition based on screen size
- **Off Canvas**: Elements move off-screen on mobile
- **Mostly Fluid**: Minor adjustments between breakpoints

### Container Guidelines
Containers adapt to viewport size with these constraints:
- **Small**: 100% width (fluid)
- **Medium**: 100% width with margins
- **Large**: Fixed max width (1200px)

## Accessibility

### Color Contrast
All text colors meet WCAG 2.1 AA standards:
- 4.5:1 for normal text
- 3:1 for large text

### Focus Indicators
All interactive elements have visible focus states.

### Semantic HTML
Components use semantic HTML elements for improved screen reader compatibility.

### Keyboard Navigation
All interactive components are keyboard accessible.

## Design Tokens

Design tokens are the visual design atoms of the system—named entities that store visual design attributes. They ensure flexibility and consistency.

### Token Structure
```
└── md
    ├── sys
    │   ├── color
    │   │   ├── primary
    │   │   ├── secondary
    │   │   └── ...
    │   ├── typescale
    │   │   ├── display-large
    │   │   ├── headline-medium
    │   │   └── ...
    │   └── ...
    └── ref
        ├── palette
        │   ├── primary40
        │   ├── secondary70
        │   └── ...
        └── ...
```

## Implementation Guidelines

### Using Design Tokens
Always use design tokens instead of hard-coded values:

```scss
// Bad
.element {
  color: #002868;
  padding: 16px;
}

// Good
.element {
  color: var(--md-sys-color-primary);
  padding: map.get(vars.$spacing, 2);
}
```

### Component Styling Architecture
Use BEM (Block, Element, Modifier) naming convention:

```scss
.card {
  // Block styles
  
  &__header {
    // Element styles
  }
  
  &--elevated {
    // Modifier styles
  }
}
```

### Theme Implementation
Themes are implemented using CSS variables:

```scss
:root {
  // Light theme (default)
  --md-sys-color-primary: #{$primary};
  --md-sys-color-on-primary: #{$on-primary};
}

.theme-dark {
  // Dark theme
  --md-sys-color-primary: #{$primary-dark};
  --md-sys-color-on-primary: #{$on-primary-dark};
}
```

## File Structure

The styling system is organized as follows:

```
styles/
├── README.md              # Documentation
├── _variables.scss        # Color tokens, breakpoints, spacing
├── _typography.scss       # Type scale and text styles
├── _theme.scss            # Angular Material theming
├── _animations.scss       # Animation keyframes and utilities
├── _layout.scss           # Layout containers and grid systems
├── _utilities.scss        # Utility classes
├── _reset.scss            # Browser resets
├── _scrollbar.scss        # Custom scrollbar styling
├── _md3-components.scss   # Custom MD3 component styles
├── _material-overrides.scss # Angular Material overrides
└── styles.scss            # Main entry point
```

## Best Practices

### Code Organization
1. **Modularity**: Each SCSS file should have a single responsibility
2. **Consistency**: Use MD3 naming conventions and token system
3. **Performance**: Minimize CSS size through careful composition
4. **Maintainability**: Follow a clear, documented structure

### CSS Best Practices
1. Use utility classes for simple styling needs
2. Avoid deep nesting (max 3 levels)
3. Use CSS Grid and Flexbox for layouts
4. Prefer class selectors over element selectors
5. Comment complex CSS blocks
6. Keep selectors as simple as possible
7. Use appropriate units (rem/em for text, % for layout)

### Documentation
1. Keep documentation close to the code it describes
2. Update documentation when changing related code
3. Use examples liberally to illustrate concepts
4. Employ consistent terminology throughout

## Data Visualization

### Color Usage in Charts
For charts, graphs, and data displays:

1. **Consistent Color Scheme**: Use the patriotic palette for all data representations
   - Primary data: Navy Blue (#002868)
   - Secondary data: Red (#BF0A30)
   - Tertiary data: Gold (#FFD700)
   - Supporting data: Silver (#C0C0C0)

2. **Accessibility in Data Viz**:
   - Always include patterns/textures alongside colors
   - Ensure sufficient contrast between data points
   - Include clear labels and legends

3. **Chart Types**:
   - Bar charts: Use for comparative data
   - Line charts: Use for time-series data
   - Pie/Donut charts: Limit to small datasets with significant differences

---