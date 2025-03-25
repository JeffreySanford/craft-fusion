# Craft Fusion Styling System

This document provides a comprehensive guide to the styling architecture used in the Craft Fusion application. The system follows Material Design 3 (MD3) principles and implements best practices for Angular applications, with a distinctive patriotic theme.

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Documentation Standards](#documentation-standards)
3. [Stylelint Integration](#stylelint-integration)
4. [Material Design 3 Integration](#material-design-3-integration)
5. [Design Token System](#design-token-system)
6. [Animation System](#animation-system)
7. [Modern Angular Styling Patterns](#modern-angular-styling-patterns)
8. [Units and Sizing Standards](#units-and-sizing-standards)
9. [Container Guidelines](#container-guidelines)
10. [Patriotic Theme Implementation](#patriotic-theme-implementation)
11. [File Structure](#file-structure)
12. [Core Files Explained](#core-files-explained)
13. [Testing Plan](#testing-plan)
14. [Refactoring Plans](#refactoring-plans)
15. [Generating Styles with AI](#generating-styles-with-ai)
16. [Component Alignment Standards](#component-alignment-standards)

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

- Use fenced code blocks with language identifiers
- Prefer triple backticks over indentation

```markdown
console.log('This is properly formatted code');
```

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
nx run craft-web:lint-styles --fix

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

## Modern Angular Styling Patterns

### Component Styling Architecture

1. **Component-Specific Styles**: Each component should have its own `.scss` file
   ```typescript
   @Component({
     selector: 'app-my-component',
     templateUrl: './my-component.component.html',
     styleUrls: ['./my-component.component.scss'], // Separate SCSS file
     standalone: false
   })
   ```

2. **No Inline Styles**: Avoid inline styles in component decorators
   ```typescript
   // Avoid this:
   @Component({
     styles: [`
       .my-component { color: red; }
     `]
   })
   ```

3. **Use SCSS Modules**: Structure component SCSS files with sections
   ```scss
   // my-component.component.scss
   @use '../../../styles/variables' as vars;
   @use '../../../styles/mixins' as mix;
   
   .my-component {
     // Base styles
     
     &__header {
       // Header styles
     }
     
     &__content {
       // Content styles
     }
     
     // Component states
     &--active {
       // Active state styles
     }
   }
   ```

### Component Styling Architecture

1. **View Encapsulation**: Prefer `ViewEncapsulation.Emulated` (default) for component styles
   ```typescript
   @Component({
     selector: 'app-my-component',
     templateUrl: './my-component.component.html',
     styleUrls: ['./my-component.component.scss'],
     // Default is ViewEncapsulation.Emulated
   })
   ```

2. **Component Class Selectors**: Add a class to the host element for targeting
   ```typescript
   @Component({
     selector: 'app-my-component',
     host: { 'class': 'app-my-component' },
     // ...
   })
   ```

3. **Modular SCSS Files**: Structure component SCSS files with sections
   ```scss
   // Component Variables
   $component-padding: 16px;
   
   // Host Styles
   :host {
     display: block;
     position: relative;
   }
   
   // Component Layout
   .app-my-component {
     &__header { /* ... */ }
     &__content { /* ... */ }
     &__footer { /* ... */ }
   }
   
   // Component States
   .app-my-component {
     &--active { /* ... */ }
     &--disabled { /* ... */ }
   }
   
   // Responsive Adjustments
   @media (max-width: 768px) {
     .app-my-component { /* ... */ }
   }
   ```

4. **CSS Custom Properties Scoping**: Scope component-specific variables
   ```scss
   :host {
     --component-specific-spacing: 12px;
     
     .component-element {
       margin: var(--component-specific-spacing);
     }
   }
   ```

### Advanced CSS Grid Usage

Modern Angular applications benefit from CSS Grid for complex layouts:

1. **Grid Layout Component**: Create a dedicated grid system
   ```scss
   .grid-container {
     display: grid;
     grid-template-columns: repeat(12, 1fr);
     grid-gap: 16px;
     
     @media (max-width: 768px) {
       grid-template-columns: repeat(6, 1fr);
     }
     
     @media (max-width: 480px) {
       grid-template-columns: repeat(4, 1fr);
     }
   }
   
   // Grid items spanning different columns
   .grid-item {
     &--span-3 { grid-column: span 3; }
     &--span-4 { grid-column: span 4; }
     &--span-6 { grid-column: span 6; }
     &--span-12 { grid-column: span 12; }
   }
   ```

2. **Named Grid Areas**: For more semantic layouts
   ```scss
   .dashboard-layout {
     display: grid;
     grid-template-areas:
       "header header header"
       "sidebar main main"
       "footer footer footer";
     grid-template-columns: 250px 1fr 1fr;
     grid-template-rows: auto 1fr auto;
     height: 100vh;
     
     @media (max-width: 768px) {
       grid-template-areas:
         "header header"
         "main main"
         "sidebar sidebar"
         "footer footer";
       grid-template-columns: 1fr 1fr;
     }
   }
   
   .header { grid-area: header; }
   .sidebar { grid-area: sidebar; }
   .main { grid-area: main; }
   .footer { grid-area: footer; }
   ```

### Performance Optimization

1. **Critical CSS**: Identify and inline critical CSS for faster First Contentful Paint
   ```typescript
   // In angular.json
   "styles": [
     {
       "input": "src/styles/critical.scss",
       "bundleName": "critical",
       "inject": true
     },
     "src/styles/styles.scss"
   ]
   ```

2. **Reduced Motion**: Support users who prefer reduced motion
   ```scss
   @media (prefers-reduced-motion: reduce) {
     * {
       transition-duration: 0.01ms !important;
       animation-duration: 0.01ms !important;
       animation-iteration-count: 1 !important;
       scroll-behavior: auto !important;
     }
   }
   ```

3. **Lazy-loaded Styles**: Use Angular's lazy loading to defer non-critical styles
   ```typescript
   // In lazy-loaded module
   @NgModule({
     imports: [
       CommonModule,
       RouterModule.forChild([...]),
     ],
     // Add module-specific styles
     declarations: [LazyComponent]
   })
   export class LazyModule {}
   ```

4. **View Transitions API**: For modern browsers, use the View Transitions API
   ```typescript
   // In navigation component
   import { Router, NavigationStart } from '@angular/router';
   
   @Component({...})
   export class AppComponent {
     constructor(private router: Router) {
       this.router.events.subscribe(event => {
         if (event instanceof NavigationStart && document.startViewTransition) {
           document.startViewTransition(() => {});
         }
       });
     }
   }
   ```

### Dark Mode Implementation

Our system supports both light and dark modes using MD3 conventions:

1. **Theme Configuration**:
   ```scss
   // In _theme.scss
   $craft-fusion-light-theme: mat.define-light-theme((/* ... */));
   $craft-fusion-dark-theme: mat.define-dark-theme((/* ... */));
   
   // In styles.scss
   .theme-light {
     @include mat.all-component-themes($craft-fusion-light-theme);
     // Light mode CSS variables
   }
   
   .theme-dark {
     @include mat.all-component-themes($craft-fusion-dark-theme);
     // Dark mode CSS variables
   }
   ```

2. **System Preference Detection**:
   ```typescript
   // In theme service
   @Injectable({providedIn: 'root'})
   export class ThemeService {
     prefersDark = window.matchMedia('(prefers-color-scheme: dark)');
     
     constructor() {
       this.prefersDark.addEventListener('change', e => {
         this.setTheme(e.matches ? 'dark' : 'light');
       });
     }
     
     setTheme(theme: 'light' | 'dark') {
       document.body.classList.remove('theme-light', 'theme-dark');
       document.body.classList.add(`theme-${theme}`);
     }
   }
   ```

3. **User Preference Storage**:
   ```typescript
   // Store user preference
   setUserThemePreference(theme: 'light' | 'dark' | 'system') {
     localStorage.setItem('theme-preference', theme);
   }
   
   // Apply on startup
   applyStoredThemePreference() {
     const preference = localStorage.getItem('theme-preference') || 'system';
     if (preference === 'system') {
       this.setTheme(this.prefersDark.matches ? 'dark' : 'light');
     } else {
       this.setTheme(preference as 'light' | 'dark');
     }
   }
   ```

## Units and Sizing Standards

For responsive and adaptable designs, we follow these unit standards:

1. **Percentages (%)**: First choice for widths, heights, and layout dimensions to ensure responsiveness
   ```scss
   .container {
     width: 100%;
     max-width: 90%;
     margin: 0 auto;
   }
   ```

2. **EM Units**: Second choice, especially for typography and component dimensions relative to their context
   ```scss
   .card-title {
     font-size: 1.25em;
     margin-bottom: 0.75em;
   }
   ```

3. **Limited Usage of PX**: Only for very small, specific values like borders and when necessary for precise control
   ```scss
   .divider {
     border: 1px solid rgba(0, 0, 0, 0.12);
   }
   ```

4. **Avoid REM**: Unless absolutely necessary for specific edge cases

### The 8px Grid System

We follow an 8px grid system for spacing and component sizing:

```scss
$spacing-unit: 8px;
$spacing: (
  0: 0,
  1: $spacing-unit,     // 8px
  2: $spacing-unit * 2, // 16px
  3: $spacing-unit * 3, // 24px
  4: $spacing-unit * 4, // 32px
  5: $spacing-unit * 5, // 40px
  6: $spacing-unit * 6, // 48px
  7: $spacing-unit * 7, // 56px
  8: $spacing-unit * 8  // 64px
);
```

All component dimensions and spacing should align with this 8px grid for visual consistency.

## Container Guidelines

- **No Overflows**: All content should fit within its container without causing page scrolling
  ```scss
  .page-container {
    height: 100%;
    overflow: hidden;
    display: flex;
    flex-direction: column;
  }
  
  .content-area {
    flex: 1;
    overflow-y: auto; // Only internal scrolling when needed
  }
  ```

- **Adaptive Height Management**: Using percentage-based heights and flexbox for layout
  ```scss
  .adaptive-container {
    display: flex;
    flex-direction: column;
    min-height: 100%;
    
    .header {
      flex: 0 0 auto;
    }
    
    .content {
      flex: 1 1 auto;
    }
    
    .footer {
      flex: 0 0 auto;
    }
  }
  ```

## Patriotic Theme Implementation

Our application applies a consistent patriotic theme across all components, including documentation.

We have updated our theme to use vibrant patriotic colors:
- Red: #B22234
- Navy: #002868
- Gold: #FFD700
- White: #FFFFFF

### Core Color Palette

| Color Role | Value | Usage |
|------------|-------|-------|
| Primary Blue | #002868 | Primary actions, headers, key UI elements |
| Accent Red | #BF0A30 | Secondary actions, highlights, alerts |
| Neutral White | #FFFFFF | Backgrounds, text on dark surfaces |
| Gold | #FFD700 | Tertiary actions, accents, special elements |

### Visual Elements

1. **Flag-Inspired Gradients**: Use for special UI elements like cards
   ```scss
   .patriotic-card {
     background: linear-gradient(135deg, rgba(255,255,255,0.9) 0%, rgba(187,10,48,0.1) 100%);
     border-left: 3px solid var(--md-sys-color-primary);
   }
   ```

2. **Star Motifs**: Implement subtly in lists, bullets, and special indicators
   ```scss
   .patriotic-list li::before {
     content: "★";
     color: var(--md-sys-color-tertiary);
     margin-right: 0.5em;
   }
   ```

### Data Visualization Standards

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

4. **Infographic Placeholders**:
   - [INSERT: Patriotic themed template for demographic data]
   - [INSERT: USA map visualization template for geographic data]
   - [INSERT: Timeline template for historical data]

## File Structure

```
styles/
├── README.md              # This documentation file
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

## Core Files Explained

### _variables.scss
Contains all design tokens including colors, spacing, breakpoints, and elevation. These variables are used throughout the application for consistent styling.

```scss
// Example usage of variables
.my-component {
  color: var(--md-sys-color-primary);
  padding: map.get(vars.$spacing, 3);
  margin-top: map.get(vars.$spacing, 2);
}
```

### _typography.scss
Defines the MD3 type scale and typography-related styles. Includes font families, sizes, weights, and spacing.

```scss
// Example usage of typography
.my-heading {
  @extend .headline-large;
  color: var(--md-sys-color-on-surface);
}
```

### _theme.scss
Configures Angular Material theming using our custom color palettes. This is where we integrate our design tokens with the Angular Material component library.

### _animations.scss
Contains reusable animation keyframes and utility classes for adding motion to components.

```scss
// Example usage of animations
.my-animated-element {
  @extend .animate-fade-in;
  animation-delay: 0.3s;
}
```

### _layout.scss
Provides layout utilities, flexbox helpers, and grid systems for creating responsive layouts.

```scss
// Example usage of layout utilities
<div class="flex flex-col items-center justify-between p-4">
  <div class="flex-1">Content</div>
  <div class="mt-4">Footer</div>
</div>
```

### _utilities.scss
Contains atomic utility classes for common styling needs like spacing, colors, borders, etc.

```scss
// Example usage of utilities
<button class="bg-primary text-on-primary p-2 rounded shadow-md">
  Click Me
</button>
```

### _md3-components.scss
Implements custom components following MD3 guidelines that aren't covered by Angular Material.

```scss
// Example usage of MD3 components
<button class="md3-button filled">
  Primary Action
</button>
```

### _material-overrides.scss
Contains custom styles that override Angular Material defaults to match our design system.

## Design Tokens

### Colors
Our color system follows the MD3 color roles pattern, with primary, secondary, and tertiary colors, along with their on- variants and containers.

#### Primary Palette
- Primary: `#002868` (USA Navy Blue)
- On Primary: `#FFFFFF`
- Primary Container: `#D6E2FF`
- On Primary Container: `#001849`

#### Secondary Palette
- Secondary: `#BF0A30` (USA Red)
- On Secondary: `#FFFFFF`
- Secondary Container: `#FFD9D9`
- On Secondary Container: `#400012`

#### Tertiary Palette
- Tertiary: `#FFD700` (USA Gold)
- On Tertiary: `#000000`
- Tertiary Container: `#FFF8DC`
- On Tertiary Container: `#493900`

### Typography

We follow the MD3 type scale with these key text styles. All font sizes use em units for better scaling:

- Display Large: 3.5625em (57px equivalent)
- Display Medium: 2.8125em (45px equivalent)
- Display Small: 2.25em (36px equivalent)
- Headline Large: 2em (32px equivalent)
- Headline Medium: 1.75em (28px equivalent)
- Headline Small: 1.5em (24px equivalent)
- Title Large: 1.375em (22px equivalent)
- Body Large: 1em (16px equivalent)
- Label Medium: 0.75em (12px equivalent)

### Spacing

Spacing follows an 8px-based system but implemented as em units:

```scss
$spacing-unit: 0.5em; // 8px equivalent
$spacing: (
  0: 0,
  1: $spacing-unit,     // 0.5em
  2: $spacing-unit * 2, // 1em
  3: $spacing-unit * 3, // 1.5em
  4: $spacing-unit * 4, // 2em
  5: $spacing-unit * 5, // 2.5em
  6: $spacing-unit * 6, // 3em
  7: $spacing-unit * 7, // 3.5em
  8: $spacing-unit * 8  // 4em
);
```

### Breakpoints

```scss
$breakpoints: (
  sm: 36em,   // 576px equivalent
  md: 48em,   // 768px equivalent
  lg: 62em,   // 992px equivalent
  xl: 75em,   // 1200px equivalent
  xxl: 87.5em // 1400px equivalent
);
```

## Best Practices

### Using CSS Variables
Always use CSS variables for theming-related properties rather than hard-coded values:

```scss
// Good
.element {
  color: var(--md-sys-color-primary);
}

// Bad
.element {
  color: #002868;
}
```

### Component-Specific Styles
Component-specific styles should be placed in the component's SCSS file, not in global styles:

```scss
// In component.scss
:host {
  display: block;
  
  .component-title {
    color: var(--md-sys-color-on-surface);
  }
}
```

> **IMPORTANT NOTE:** When working with component styling, never modify the `standalone: false` property in the component decorator. This property is critical for NgModule-based components and removing it will cause compilation errors.

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

## Accessibility Guidelines

### WCAG 2.1 AA Compliance

We adhere to WCAG 2.1 AA standards:

1. **Color Contrast**: Maintain a minimum contrast ratio of 4.5:1 for normal text and 3:1 for large text
   ```scss
   // Use built-in accessibility tools to verify contrast
   // For example, with the MD3 color system:
   .text-primary-on-light {
     // Ensure this combination meets contrast requirements
     color: var(--md-sys-color-primary);
     background-color: var(--md-sys-color-surface);
   }
   ```

2. **Focus Indicators**: Ensure visible focus indicators for keyboard navigation
   ```scss
   // Do not remove outlines without providing alternatives
   .interactive-element:focus-visible {
     outline: 2px solid var(--md-sys-color-primary);
     outline-offset: 2px;
   }
   ```

3. **Text Resizing**: Ensure text can be resized up to 200% without loss of content
   ```scss
   // Use relative units and fluid layouts
   .container {
     width: 100%;
     max-width: 1200px;
     padding: 0 5%;
   }
   ```

4. **Touch Targets**: Ensure touch targets are at least 44px × 44px
   ```scss
   .interactive-element {
     min-width: 44px;
     min-height: 44px;
     // For smaller visual elements, use padding
     padding: calc((44px - actual-height) / 2) calc((44px - actual-width) / 2);
   }
   ```

### Patriotic Design and Accessibility
- Ensure that patriotic design elements don't reduce readability
- Maintain sufficient contrast even with red, white and blue color schemes
- Provide alternative styling for users with color vision deficiencies
- Allow users to disable animated effects that could trigger sensitivities

```scss
// Support for users with deuteranopia
@media (prefers-contrast: more) {
  :root {
    --md-sys-color-primary: navy; // Darker blue for better contrast
    --md-sys-color-error: maroon; // Darker red for better contrast
  }
  
  .patriotic-gradient {
    // Simpler, higher contrast alternative
    background: var(--md-sys-color-surface);
    border: 2px solid var(--md-sys-color-primary);
  }
}
```

## References

- [Material Design 3 Guidelines](https://m3.material.io/)
- [Angular Material Documentation](https://material.angular.io/)
- [Sass Documentation](https://sass-lang.com/documentation)
- [CSS Custom Properties (Variables)](https://developer.mozilla.org/en-US/docs/Web/CSS/Using_CSS_custom_properties)
- [WCAG 2.1 Accessibility Standards](https://www.w3.org/TR/WCAG21/)
- [Angular Coding Style Guide](https://angular.io/guide/styleguide)
- [BEM Methodology](https://getbem.com/)
- [CSS Grid Layout](https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_Grid_Layout)
- [Stylelint Documentation](https://stylelint.io/)

## Testing Plan

### [WIP] Step 3: Test Style System with Sample Components

Our testing phase involves systematic evaluation of the style system's implementation across all key UI components.

#### 1. Component Library Test Suite

We will create a comprehensive test suite covering:

- **Content Containers**
  - [x] Page containers (varying heights/widths)
  - [x] Cards (all variants: basic, elevated, outlined, interactive)
  - [ ] Panels (collapsible, tabbed, scrollable)
  - [ ] Dialog/modal containers

- **Navigation Elements**
  - [x] Navigation bars (top, side, responsive)
  - [x] Tab groups (horizontal, vertical)
  - [x] Breadcrumbs
  - [ ] Pagination
  - [ ] Menus (dropdown, context, nested)

- **Actions & Controls**
  - Button hierarchy (primary, secondary, tertiary, icon)
  - Form controls (inputs, selectors, checkboxes, switches)
  - Sliders and progress indicators
  - Search components
  - Upload controls

- **Data Display**
  - Tables (sortable, filterable, expandable rows)
  - Lists (interactive, icon, avatar, multi-line)
  - Badges and status indicators
  - Charts and data visualization
  - Timeline displays

#### 2. Testing Methodology

##### Visual Regression Testing

For each component, we'll establish a baseline appearance and perform comparison checks for:

- Light and dark theme rendering
- Color application from our patriotic theme
- Typography consistency
- Spacing and alignment
- Interactive state styling (hover, active, focus, disabled)
- Animation implementation

##### Responsive Testing Protocol

On each breakpoint (320px, 480px, 768px, 1024px, 1200px, 1440px):

1. Layout integrity (no overflow, text wrapping correctly)
2. Appropriate component resizing
3. Touch target accessibility on mobile views
4. Functionality preservation in all viewports

##### Accessibility Validation

- Color contrast ratio verification (WCAG AA minimum)
- Focus state visibility for keyboard navigation
- Text sizing and readability assessment
- Motion reduction accommodation

##### Performance Metrics

- Style bundle size analysis before/after refactoring
- Rendering performance comparison
- Animation frame rate monitoring
- CSS specificity scoring improvement

#### 3. Testing Tools

- Storybook for isolated component testing
- Chrome DevTools for responsive testing and performance analysis
- Lighthouse for accessibility auditing
- Custom visual regression testing with screenshots
- axe DevTools for WCAG compliance checking

#### 4. Documentation Requirements

For each component tested, document:

- Component name and purpose
- Style implementation approach
- Global tokens utilized
- Component-specific customizations
- Before/after bundle size
- Screenshots in various states and breakpoints
- A11y compliance status

## Refactoring Plans

The Craft Fusion project is currently undergoing a comprehensive style system refactoring effort. Progress on these efforts is tracked through detailed prompt files that outline the plan, current status, and next steps.

### Core Style System Refactoring

The main style system refactoring plan is documented in [style-refactoring-plan.md](../../prompts/style-refactoring-plan.md), which outlines:

- Implementation of Material Design 3 principles
- Creation of a consistent patriotic theme
- Proper structuring of SCSS modules
- Component testing methodology

### Component-Specific Refactoring

Individual components are being refactored to align with the core style system:

- [Footer Component](../../prompts/footer-refactoring-plan.md): Performance metrics visualization and layout improvements
- [Header Component](../../prompts/header-refactoring-plan.md): Navigation, search, and notification system enhancements
- [Sidebar Component](../../prompts/sidebar-refactoring-plan.md): Navigation structure and responsive behavior

### Data Visualization System

A dedicated [Data Visualization Plan](../../prompts/data-visualization-plan.md) outlines our approach to creating consistent, accessible, and themed charts and graphs throughout the application.

### Progress Tracking

Overall progress on the refactoring efforts can be tracked in the [Master Prompt Tracking System](../../prompts/prompts-tracking.md), which provides a centralized view of all refactoring initiatives.

### Contribution to Refactoring

To contribute to the refactoring efforts:

1. Review the relevant prompt files for the component you're working on
2. Follow the established patterns and guidelines
3. Extract component-specific styles to core modules where appropriate
4. Update the prompt files with your progress
5. Ensure all implemented styles follow MD3 principles and our patriotic theme

## Coding Standards
For overall development guidelines, see [CODING-STANDARDS.md](../../../../CODING-STANDARDS.md).

## Component Alignment Standards

To ensure consistency across the application, all components should follow these alignment guidelines:

### Core Layout Structure

1. **Container Spacing**
   - All outer containers should have uniform 0.5em margins around them
   - Fixed components (header, footer, sidebar) should align with these margins
   - Example: `.footer-container { left: 0.5em; right: 0.5em; bottom: 0.5em; }`

2. **Vertical Layout**
   - Header: Fixed at top with 0.5em spacing
   - Main content: Fills available space between header and footer
   - Footer: Fixed at bottom with 0.5em spacing
   - Use `calc(100% - Xem)` for precise width calculations that account for margins

3. **Horizontal Layout**
   - Sidebar: Fixed to left with 0.5em margin from edge
   - Content area: Fills remaining space with responsive padding
   - Use flexible layouts that maintain proper spacing across screen sizes

### Component-Specific Standards

1. **Header Component**
   - Full width with 0.5em margins on left and right sides
   - Fixed height based on content with minimum of 3em
   - Navigation elements left-aligned with consistent spacing

2. **Sidebar Component**
   - Fixed width on desktop (250px)
   - Collapsible on mobile with touch-friendly toggle
   - Consistent padding: 0.5em

3. **Main Content Area**
   - Responsive padding that scales with viewport
   - Default: 1em padding on all sides
   - Mobile: 0.5em padding on all sides

4. **Footer Component**
   - Full width with 0.5em margins on all sides
   - Expandable with smooth transition
   - Default height when collapsed for optimal screen space utilization

5. **Card Components**
   - Consistent corner radius (standard: 8px, or 0.5em)
   - Uniform padding (standard: 1em, mobile: 0.75em)
   - Consistent elevation (use `var(--md-sys-elevation-level1)`)

### Responsive Behavior

- All core layouts should dynamically adjust based on these breakpoints:
  - Small: 576px
  - Medium: 768px
  - Large: 992px
  - XLarge: 1200px

- On smaller screens:
  - Sidebar becomes collapsible or transforms to bottom navigation
  - Horizontal layouts convert to vertical stacks
  - Spacing reduces proportionally (typically by 25-50%)

### Integration with Design System

- Utilize the established mixins for layout consistency:
  ```scss
  @include utilities.performance-chart(5em);
  @include utilities.footer-expansion-panel(...);
  @include utilities.logo-containers();
  ```

- Apply position helpers from _utilities.scss for standard positioning

### Documentation and Testing

- Each component should include responsive adjustment notes in its documentation
- All layouts should be tested at each standard breakpoint
- Use Chrome DevTools device emulation for verification

_This standard was established in March 2025 and should be followed for all new components and layout modifications._

_Last Updated: 2025-03-24_

## Header Layout Standards

The header component must follow a specific layout pattern to ensure consistency across the application:

## Theming System

Craft Fusion now implements a comprehensive theming system with both light and dark modes.

### Theme Implementation Details

The theming system uses three levels of styling:

1. **CSS Variables**: Core design tokens defined in `:root` and `.dark-theme` selectors
2. **Angular Material Theming**: Custom Material palettes for components
3. **Theme-Aware Components**: CSS that responds to the current theme context

### Theme Files Organization

- `_theming.scss`: Contains theme configuration, palette definitions, and Material integration
- `_variables.scss`: Core design tokens and system-wide values
- Individual component SCSS files: Apply theme-aware styles

### How Themes Are Applied

Our theming system follows a CSS-variables first approach with Angular Material integration:

```scss
// In _theming.scss
@mixin apply-theme-variables() {
  // Light theme variables (default)
  :root, .light-theme, [data-theme="light"] {
    --md-sys-color-primary: #002868;
    --md-sys-color-on-primary: #FFFFFF;
    // ...other variables
  }
  
  // Dark theme variables
  .dark-theme, [data-theme="dark"] {
    --md-sys-color-primary: #B6C5FF;
    --md-sys-color-on-primary: #002E6A;
    // ...other variables
  }
}
```

The themes are controlled by the ThemeService which:

1. Detects system preference using `prefers-color-scheme`
2. Saves user preference to localStorage
3. Applies the appropriate theme class to the body element

### Using Themes In Components

Components can respond to theme changes in several ways:

1. **CSS Variables**
   ```scss
   .my-component {
     color: var(--md-sys-color-on-surface);
     background-color: var(--md-sys-color-surface);
   }
   ```

2. **Theme Context Selectors**
   ```scss
   .my-component {
     // Base styles
     
     .light-theme & {
       box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
     }
     
     .dark-theme & {
       box-shadow: 0 2px 8px rgba(0, 0, 0, 0.4);
     }
   }
   ```

3. **Programmatic Theme Access**
   ```typescript
   constructor(private themeService: ThemeService) {}
   
   ngOnInit() {
     this.themeService.isDarkTheme$.subscribe(isDark => {
       // Respond to theme changes
     });
   }
   ```

### Custom Theme Palettes

Our Material theme uses custom patriotic palettes:

- **Primary**: Navy blue (#002868) - For primary actions, headers
- **Accent**: USA red (#BF0A30) - For highlights, secondary actions
- **Warn**: Gold (#FFD700) - For warnings, tertiary elements

These colors shift appropriately in dark mode for better visibility and reduced eye strain.

## MD3 & Transparency
We have implemented MD3 tokens and used automated suggestions to merge them. This improves design consistency while acknowledging machine-assisted updates.

_Last Updated: 2025-03-24_
