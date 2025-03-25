# Material Design 3 Migration Guide

This document outlines our approach to migrating Craft Fusion to Material Design 3, providing guidelines for developers implementing the new design system.

## Table of Contents
1. [Migration Strategy](#migration-strategy)
2. [Design Tokens](#design-tokens)
3. [Component Migration](#component-migration)
4. [Testing Approach](#testing-approach)
5. [Resources](#resources)

## Migration Strategy

Our migration to MD3 follows these phases:

1. **Foundation Phase** *(Current)*
   - Implement MD3 design tokens
   - Set up theme system (light/dark)
   - Create core utility functions

2. **Layout Phase** *(In Progress)*
   - Update header and footer components
   - Implement navigation patterns
   - Establish layout grids and containers

3. **Component Phase** *(Upcoming)*
   - Migrate interactive components
   - Update form elements
   - Enhance data visualization

4. **Refinement Phase** *(Planned)*
   - Conduct accessibility audits
   - Performance optimization
   - Comprehensive testing

## Transparency Note
During this migration, automated suggestions have been used to expedite MD3 token creation and styling updates, ensuring consistent application across the codebase.

## Design Tokens

MD3 uses a structured token system that we've implemented as follows:

### Color Tokens

- **Base Palette**: Primary (Navy), Secondary (Red), Tertiary (Gold)
- **Tonal Palette**: Generated variants for each base color
- **Semantic Tokens**: Functional color mappings (e.g., on-surface, error)

```scss
// Example usage
.my-component {
  background-color: var(--md-sys-color-surface);
  color: var(--md-sys-color-on-surface);
}
```

### Typography Tokens

We follow the MD3 type scale with our patriotic font selections:

- Display: Playfair Display
- Headline: Merriweather
- Title: Lora
- Body: Source Sans Pro
- Label: Roboto Flex

```scss
// Example usage
.page-title {
  @extend .display-large;
  color: var(--md-sys-color-on-surface);
}
```

### Elevation and Shape

- Elevation uses MD3's updated shadow system
- Shapes follow MD3's corner radius guidelines with patriotic adaptations

## Component Migration

When migrating components to MD3:

1. **Start with structure**: Update HTML to match MD3 component structure
2. **Apply tokens**: Replace hard-coded values with design tokens
3. **Add states**: Implement hover, pressed, and disabled states
4. **Enhance with motion**: Add appropriate animations from _animations.scss

Example:

```html
<!-- Before: Old button -->
<button class="btn btn-primary">Submit</button>

<!-- After: MD3 button -->
<button class="md3-button filled">
  <span class="md3-button-label">Submit</span>
</button>
```

## Testing Approach

For each migrated component:

1. Test in both light and dark modes
2. Verify responsive behavior
3. Check accessibility (contrast, keyboard navigation)
4. Validate animations respect reduced motion preferences

## Resources

- [Material Design 3 Guidelines](https://m3.material.io/)
- [Angular Material Documentation](https://material.angular.io/)
- [Material Theme Builder](https://m3.material.io/theme-builder)

## Additional Documentation
Explain any new migration steps or clarifications here.
