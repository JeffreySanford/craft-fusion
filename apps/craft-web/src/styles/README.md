# Craft Fusion Styling System

## Tasks

- [ ] Fill empty style files (reset.scss, responsive.scss, scrollbar.scss, etc.)
- [ ] Review MD3 token alignment with official specifications
- [ ] Complete animation pattern library (90% complete)
- [ ] Standardize component patterns across the application
- [ ] Add usage examples for all components
- [ ] Implement style auditing tool to verify consistency

This document provides a comprehensive guide to the styling architecture used in the Craft Fusion application. The system follows Material Design 3 (MD3) principles and implements best practices for Angular applications, with a distinctive patriotic theme.

## Table of Contents

### Foundation & Architecture
1. [Architecture Overview](#architecture-overview)
2. [Design Token System](#design-token-system)
3. [File Structure](#file-structure)
4. [Core Files Explained](#core-files-explained)

### Styling Standards
1. [Documentation Standards](#documentation-standards)
2. [Stylelint Integration](#stylelint-integration)
3. [Units and Sizing Standards](#units-and-sizing-standards)
4. [Container Guidelines](#container-guidelines)
5. [Implementation Guidelines](#implementation-guidelines)

### Material Design & Theming
1. [Material Design 3 Integration](#material-design-3-integration)
2. [Theming System](#theming-system)
3. [Patriotic Theme Implementation](#patriotic-theme-implementation)

### Animation & Motion
1. [Animation System](#animation-system)

### Angular Integration
1. [Angular Styling Patterns](#angular-styling-patterns)
2. [Component Alignment Standards](#component-alignment-standards)
3. [Component Configuration Standards](#component-configuration-standards)

### Development & Maintenance
1. [Testing Roadmap](#testing-roadmap)
2. [Refactoring Plans](#refactoring-plans)
3. [Generating Styles with AI](#generating-styles-with-ai)

## Architecture Overview

Our styling system is built with modularity, maintainability, and performance in mind. We use SCSS for preprocessing and follow a component-based approach with globally defined design tokens.

### Key Features

- **CSS Variables**: For runtime theming capabilities
- **SCSS Modules**: For compilation-time code organization
- **Material Design 3**: Following the latest Google design system principles
- **Utility Classes**: For rapid development and consistent styling
- **Responsive Design**: Mobile-first approach with flexible breakpoints
- **Patriotic Theme**: Consistent use of red, white, and blue color scheme

## Documentation Standards

### Markdown Requirements

All documentation in the Craft Fusion project must adhere to strict markdown linting standards to ensure consistency and readability.

#### List Formatting (MD032)

All lists must be surrounded by blank lines:

```markdown
This is a paragraph.

- List item 1
- List item 2
- List item 3

This is another paragraph.
```

#### Heading Structure

- Use proper heading hierarchy (don't skip levels)
- Leave a space after the hash marks
- Capitalize first letter of headings

```markdown
# Main Title

## Section Title

### Subsection Title
```

#### Code Blocks

Some paragraph text.

```plaintext
console.log('Example code block');
```

Next paragraph after the code block.

#### Tables

- Use proper table formatting with headers
- Align columns consistently

```markdown
| Column 1 | Column 2 | Column 3 |
|----------|----------|----------|
| Value 1  | Value 2  | Value 3  |
| Value 4  | Value 5  | Value 6  |
```

#### Document Structure

- Include a table of contents for documents longer than 3 sections
- Use relative links for cross-references within the repository
- Include a "Last Updated" date at the bottom of significant documents

### Documentation Best Practices

1. Keep documentation close to the code it describes

2. Update documentation when changing related code

3. Use examples liberally to illustrate concepts

4. Employ consistent terminology throughout the documentation

5. Format command-line instructions with code blocks and clear instructions

## Stylelint Integration

We use Stylelint to enforce consistent coding standards across our SCSS files. This ensures maintainability, performance, and reduces the potential for CSS-related bugs.

### Stylelint Configuration

Our Stylelint configuration is defined in `.stylelintrc.json` at the project root and includes:

```json
{
  "extends": [
    "stylelint-config-standard-scss",
    "stylelint-config-prettier-scss"
  ],
  "plugins": [
    "stylelint-scss",
    "stylelint-order"
  ],
  "rules": {
    "order/properties-alphabetical-order": true,
    "selector-class-pattern": null,
    "scss/dollar-variable-pattern": null,
    "scss/at-import-partial-extension": null,
    "property-no-vendor-prefix": null,
    "value-no-vendor-prefix": null,
    "color-function-notation": "legacy",
    "alpha-value-notation": "number",
    "selector-pseudo-element-no-unknown": [
      true,
      {
        "ignorePseudoElements": ["ng-deep"]
      }
    ]
  }
}
```

### Key Stylelint Rules

1. **Property Order**: Properties should be ordered alphabetically for consistency
2. **BEM Naming Exemption**: We allow for various selector naming patterns (including BEM)
3. **SCSS Variable Pattern**: No restrictions on SCSS variable naming
4. **Import Extensions**: Allow importing partials with or without extensions
5. **Vendor Prefixes**: Allowed when needed for browser compatibility
6. **Color Functions**: Using legacy notation for broader compatibility
7. **Alpha Values**: Using number notation (e.g., 0.5 instead of 50%)
8. **Angular Deep Selector**: Allow `::ng-deep` for Angular-specific style penetration

### Running Stylelint

You can run Stylelint checks using:

```bash
# Check all SCSS files
nx run craft-web:lint-styles

# Fix auto-fixable issues

# Check specific file
npx stylelint "apps/craft-web/src/styles/_variables.scss"
```

### Stylelint Best Practices

1. **Run Before Committing**: Always run Stylelint before committing changes
2. **Fix Warnings**: Treat warnings as errors to maintain code quality
3. **No Disabling**: Avoid disabling Stylelint rules unless absolutely necessary
4. **Document Exceptions**: If you must disable a rule, add a comment explaining why
5. **Custom Project Rules**: Create project-specific rules that align with design requirements

## Material Design 3 Integration

### Benefits of Material Design 3 (MD3)

1. **Personalized Design System**: MD3 allows for greater customization and expression through dynamic color system
2. **Improved Accessibility**: Enhanced contrast ratios and touch targets
3. **Cohesive Cross-Platform Experience**: Consistent design language across all platforms
4. **Adaptive Layouts**: Better responsive behaviors for different screen sizes
5. **Simplified Component Structure**: More intuitive component architecture
6. **Performance Improvements**: More efficient rendering and animations

### Angular Material 3 Implementation

We use the latest Angular Material implementation which uses MDC (Material Components for the web):

#### Component Usage

- Components are prefixed with `mat-mdc-` instead of just `mat-`
- Example: `<mat-mdc-button>` rather than `<mat-button>`
- These components offer improved accessibility, customization, and performance

#### Component Patterns

1. **Form Controls**: Use the latest Angular Material form controls with reactive forms

   ```html
   <mat-mdc-form-field appearance="fill">
     <mat-label>Input Label</mat-label>
     <input matInput [formControl]="inputControl" required>
     <mat-error *ngIf="inputControl.invalid">Error message</mat-error>
   </mat-mdc-form-field>
   ```

2. **Buttons**: Use the appropriate button variant based on hierarchy

   ```html
   <!-- Primary action -->
   <button mat-mdc-raised-button color="primary">Primary Action</button>
   
   <!-- Secondary action -->
   <button mat-mdc-outlined-button color="primary">Secondary Action</button>
   
   <!-- Tertiary action -->
   <button mat-mdc-button color="primary">Tertiary Action</button>
   ```

3. **Cards**: Use for contained content blocks

   ```html
   <mat-mdc-card>
     <mat-mdc-card-header>
       <mat-mdc-card-title>Card Title</mat-mdc-card-title>
       <mat-mdc-card-subtitle>Card Subtitle</mat-mdc-card-subtitle>
     </mat-mdc-card-header>
     <mat-mdc-card-content>
       Content goes here
     </mat-mdc-card-content>
     <mat-mdc-card-actions align="end">
       <button mat-mdc-button>Action</button>
     </mat-mdc-card-actions>
   </mat-mdc-card>
   ```

4. **Lists**: Use for repeating data items

   ```html
   <mat-mdc-list>
     <mat-mdc-list-item *ngFor="let item of items">
       <span matListItemTitle>{{item.title}}</span>
       <span matListItemLine>{{item.description}}</span>
     </mat-mdc-list-item>
   </mat-mdc-list>
   ```

5. **Dialogs**: Use for focused interactions

   ```typescript
   import {MatDialog} from '@angular/material/dialog';
   
   @Component({...})
   export class MyComponent {
     constructor(public dialog: MatDialog) {}
     
     openDialog(): void {
       this.dialog.open(DialogComponent, {
         width: '400px',
         data: {/* data to pass */},
       });
     }
   }
   ```

6. **Theming**: Apply theming consistently

   ```typescript
   // In component
   @Component({
     // ...
     host: {
       'class': 'my-component',
     }
   })
   
   // In component SCSS
   .my-component {
     .title {
       color: var(--md-sys-color-on-surface);
     }
   }
   ```

### MD3 Density System

Angular Material supports the MD3 density system for components:

```typescript
// In theme configuration
$craft-fusion-theme: mat.define-light-theme((
  color: (
    primary: $craft-fusion-primary,
    accent: $craft-fusion-accent,
    warn: $craft-fusion-warn,
  ),
  typography: mat.define-typography-config(),
  density: -1, // Compact density (-1), default (0), or comfortable (1)
));
```

### Custom MD3 Components

For components not covered by Angular Material, we provide custom implementations in our `_md3-components.scss` file that follow the MD3 design system:

```html
<button class="md3-button filled">
  <span class="md3-button-label">Button Label</span>
</button>
```

## Design Token System

Craft Fusion uses Style Dictionary to manage design tokens - the single source of truth for all design values.

### What Are Design Tokens?

Design tokens are the visual design atoms of the design system—specifically, they are named entities that store visual design attributes. We use them in place of hard-coded values to ensure flexibility and consistency.

### Token Structure

Our tokens are organized in a hierarchical structure:

## Implementation Guidelines

When working with component styling, follow these guidelines:

> **IMPORTANT NOTE:** Never modify the `standalone: false` property in the component decorator. This property is critical for NgModule-based components and removing it will cause compilation errors.

### Extending the System

When adding new styles, follow these guidelines:

1. If it's a global token, add it to `_variables.scss`
2. If it's a utility class, add it to `_utilities.scss`
3. If it's a custom component style, add it to `_md3-components.scss`
4. If it's an Angular Material override, add it to `_material-overrides.scss`

### Responsive Design

Always design with mobile-first approach using percentage-based widths and flexbox:

```scss
.element {
  width: 100%; // Mobile default
  
  @media (min-width: map.get(vars.$breakpoints, md)) {
    width: 50%; // Tablet and up
  }
  
  @media (min-width: map.get(vars.$breakpoints, lg)) {
    width: 33.33%; // Desktop and up
  }
}
```

### Accessibility Guidelines

<!-- Kept from original section -->

## Angular Styling Patterns

### Component-Based Styling

Angular encourages a component-based architecture, and our styling system aligns with this principle:

1. **Encapsulation**: Use `ViewEncapsulation.Emulated` (default) to scope styles to components.
2. **Component-Specific SCSS**: Each component should have its own SCSS file for maintainability.
3. **Host Styling**: Use the `:host` selector for styling the component's root element.

```scss
:host {
  display: block;
  padding: 1em;
  background-color: var(--md-sys-color-surface);
}
```

### Angular Material Integration

Extend Angular Material components with custom styles to match our MD3 implementation:

```scss
.mat-mdc-button {
  &.mat-primary {
    background-color: var(--md-sys-color-primary);
    color: var(--md-sys-color-on-primary);
  }
}
```

### Custom MD3 Components

For components not covered by Angular Material, we provide custom implementations in our `_md3-components.scss` file that follow the MD3 design system:

```html
<button class="md3-button filled">
  <span class="md3-button-label">Button Label</span>
</button>
```

## Component Alignment Standards

To ensure consistency across the application, all components should follow these alignment guidelines:

<!-- Continue with the component alignment standards content -->

## Component Configuration Standards

To ensure consistency and maintainability across the application, all components should adhere to the following configuration standards:

<!-- Continue with the component configuration standards content -->

## Theming System

Craft Fusion now implements a comprehensive theming system with both light and dark modes.

<!-- Continue with the theming system content -->

### Last Updated: March 27, 2025
