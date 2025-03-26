# Material Design 3 Migration Guide

This document outlines our approach to migrating from Material Design 2 to Material Design 3 (MD3) in the Craft Fusion project.

## Migration Overview

We've adopted Material Design 3 principles to enhance our design system with dynamic color, improved accessibility, and consistent components. This migration brings our application in line with the latest Google design standards.

## Key Changes

### 1. Color System

**Before**: Static color palette with primary, accent, and warn colors
**After**: Dynamic color system with semantic color roles and custom themes

```scss
// Old MD2 approach
$primary: mat-palette($mat-blue);
$accent: mat-palette($mat-amber);

// New MD3 approach
:root {
  --md-sys-color-primary: #002868;
  --md-sys-color-on-primary: #FFFFFF;
  --md-sys-color-primary-container: #D6E2FF;
  --md-sys-color-on-primary-container: #001849;
  // ...other color tokens
}
```

### 2. Typography

**Before**: Limited type scale with fewer styles
**After**: Expanded type scale with clear hierarchy and consistent line heights

```scss
// Old typography
h1 {
  font-size: 24px;
  font-weight: 500;
}

// New MD3 typography
.headline-large {
  font-family: 'Roboto Flex', sans-serif;
  font-size: 32px;
  line-height: 40px;
  font-weight: 400;
}
```

### 3. Shape and Elevation

**Before**: Mixed border radius values and elevation models
**After**: Consistent shape scale and MD3 elevation tokens

```scss
// Old elevation
box-shadow: 0 2px 4px -1px rgba(0,0,0,.2), 
           0 4px 5px 0 rgba(0,0,0,.14), 
           0 1px 10px 0 rgba(0,0,0,.12);

// New MD3 elevation
box-shadow: var(--md-sys-elevation-level2);
```

### 4. Component Updates

We've updated all components to match MD3 specifications:

- Buttons now use new MD3 states and typography
- Cards have updated padding and shape
- Form fields follow the new filled/outlined patterns
- Icons updated to Material Symbols font

## Implementation Strategy

Our migration followed these steps:

1. **Design Tokens**: Created CSS variables for all MD3 design tokens
2. **Foundation**: Updated typography, colors, and shape systems
3. **Base Components**: Migrated core components like buttons, cards, etc.
4. **Complex Components**: Updated specialized and composite components
5. **Theming**: Implemented light/dark theme support

## Component Status

| Component | Status | Notes |
|-----------|--------|-------|
| Buttons | Complete | Fully migrated to MD3 |
| Cards | Complete | Using new elevation and shape |
| Dialog | Complete | Updated to new specs |
| Tabs | Complete | Finalized on July 15, 2024 |
| Tables | Complete | Finalized on July 10, 2024 |
| Menus | Complete | Using new patterns |
| Navigation | Complete | Using new patterns |
| Forms | Complete | Using filled style by default |

## Angular Material Integration

We're using Angular Material components with our custom MD3 styling:

```typescript
// Example: Button configuration
@Component({
  selector: 'md3-button',
  template: `
    <button mat-button 
      [class.md3-filled]="appearance === 'filled'"
      [class.md3-outlined]="appearance === 'outlined'"
      [class.md3-text]="appearance === 'text'">
      <ng-content></ng-content>
    </button>
  `
})
export class Md3ButtonComponent {
  @Input() appearance: 'filled' | 'outlined' | 'text' = 'filled';
}
```

## Handling Legacy Components

For legacy components that haven't been fully migrated:

1. Use the `legacy-component` class to apply transitional styling
2. Document components needing migration in the backlog
3. Apply basic MD3 color tokens as an intermediate step

## Theme Customization

We've implemented our patriotic theme using MD3 color utilities:

```scss
// Patriotic theme based on MD3 principles
:root {
  --md-sys-color-primary: #002868; // Navy blue
  --md-sys-color-secondary: #BF0A30; // Red
  --md-sys-color-tertiary: #FFD700; // Gold
  // ...other colors
}
```

## Documentation and Resources

- [Material Design 3 Guidelines](https://m3.material.io/)
- [Angular Material Documentation](https://material.angular.io/)
- [Theme Builder](https://m3.material.io/theme-builder)

## Next Steps

1. Complete migration for remaining components
2. Enhance documentation with visual examples
3. Add more custom patriotic components
4. Improve animation system to follow MD3 motion principles

> **Note**: As you make progress on the MD3 migration tasks, please update the [central TODO document](../../../../docs/TODO.md), [ROADMAP](../../../../docs/ROADMAP.md), and [CHANGELOG](../../../../docs/CHANGELOG.md) accordingly.

Last Updated: March 26, 2025
