# Craft Fusion Coding Standards

This document outlines the key technical standards and patterns to be followed across all Craft Fusion applications.

## Table of Contents

1. [General Guidelines](#general-guidelines)
2. [Angular Guidelines](#angular-guidelines)
3. [Styling Standards](#styling-standards)
4. [Component Layout Standards](#component-layout-standards)
5. [Testing Requirements](#testing-requirements)
6. [Documentation Requirements](#documentation-requirements)

## General Guidelines

- Use TypeScript strict mode for all code
- Follow a functional programming approach where possible
- Separate concerns: data access, business logic, and presentation
- Use async/await instead of Promises with .then() chains
- Limit file size to under 400 lines when possible

## Angular Guidelines

- Use standalone components by default for new components
- Leverage Angular signals for state management
- Implement lazy loading for all feature modules
- Use resolvers for preloading necessary data
- Follow reactive forms approach instead of template-driven forms

## Styling Standards

Our application uses a custom implementation of Material Design 3 with a patriotic theme.

### Core Style Structure

- Global styles: `styles/` directory
- Component styles: Component-specific SCSS files
- Design tokens: CSS variables in `:root` for consistent values

### Material Design Implementation

- Use the Material Components Web (MDC) via `mat-mdc-*` components
- Override Material components using the techniques documented in `_material-overrides.scss`

### Spacing Standard

We follow an 8px grid system implemented with em-based units to ensure proper scaling:

- Base unit: 0.5em (equivalent to 8px at default font size)
- Container margins: 0.5em (8px)
- Component padding: 1em (16px) by default
- Form element spacing: 0.75em (12px) 

## Component Layout Standards

All components in the application should follow a consistent layout approach. The core application structure follows this pattern:

```
<app-root>
  <app-header fixed="top" margin="0.5em"/>
  <div class="layout-container">
    <app-sidebar margin="0.5em"/>
    <main class="main-content" margin="0.5em"/>
  </div>
  <app-footer fixed="bottom" margin="0.5em"/> 
</app-root>
```

### Key Layout Rules

1. **Container Alignment**
   - All container components (header, footer, main content areas) should have 0.5em margin from viewport edges
   - Fixed position elements should specify `left: 0.5em; right: 0.5em` instead of `width: 100%`
   - Main content should extend to fill available space between fixed components

2. **Responsive Adaptation**
   - Layouts should use flexbox or grid for proper responsive behavior
   - On smaller viewports (<768px), the sidebar should collapse or transform
   - All fixed elements should maintain their 0.5em margins across screen sizes

3. **Standard SCSS Mixins**
   - Use established mixins from _utilities.scss for consistent component styling
   - Example: `@include utilities.performance-chart(5em);`

For more detailed guidelines, see the [Component Alignment Standards](apps/craft-web/src/styles/README.md#component-alignment-standards) in the styles documentation.

## Testing Requirements

- Unit tests: Minimum 80% code coverage for services and pipes
- Component tests: Test all user interactions and state changes
- Integration tests: Cover all primary user flows
- Accessibility testing: Run axe-core checks on all components

## Documentation Requirements

- All public methods and properties should have JSDoc comments
- Complex algorithms should include explanation comments
- Component documentation should explain usage patterns and inputs/outputs
- Update README files when introducing significant changes

---

These standards should be followed for all new code and applied to existing code during refactoring efforts.
