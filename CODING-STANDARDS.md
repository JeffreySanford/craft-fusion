# Craft Fusion Coding Standards

## Table of Contents
1. [General Guidelines](#general-guidelines)
2. [File and Folder Structure](#file-and-folder-structure)
3. [Angular Components](#angular-components)
4. [TypeScript Standards](#typescript-standards)
5. [Reactive Programming (RxJS)](#reactive-programming-rxjs)
6. [UI Framework](#ui-framework)
7. [CSS/SCSS Standards](#cssscss-standards)
8. [Animations](#animations)
9. [Testing](#testing)
10. [Performance](#performance)
11. [Accessibility](#accessibility)
12. [Documentation](#documentation)
13. [Master Component Pattern](#master-component-pattern)
14. [Design Tokens](#design-tokens)
15. [Monorepo Architecture](#monorepo-architecture)

## General Guidelines

### Standalone Components
- **Always set `standalone: false`** in component decorators when using NgModules
- Use module-based architecture for consistency across the application

### Code Formatting
- Use consistent indentation (2 spaces)
- Maximum line length: 100 characters
- Use semicolons at the end of statements
- Prefer single quotes for string literals
- Include trailing commas in multi-line objects and arrays

### Naming Conventions
- Use kebab-case for file names: `my-component.ts`
- Use PascalCase for class names: `MyComponent`
- Use camelCase for methods and properties: `myMethod()`
- Use snake_case for database field names: `user_id`
- Prefix interfaces with `I`: `IUser`
- Prefix Angular components with application prefix: `app-my-component`

## File and Folder Structure

### Component Structure
- One component per file
- Related files should be grouped in the same directory
- Components should follow this file structure:

## Angular Components

### File Organization
- Always use separate files for component templates and styles
- Avoid inline templates and styles except for very simple directives
- Follow the naming convention:
  - `component-name.component.ts`
  - `component-name.component.html`
  - `component-name.component.scss`
  - `component-name.component.spec.ts`

### Component Decorators
```typescript
@Component({
  selector: 'app-my-component',
  templateUrl: './my-component.component.html',
  styleUrls: ['./my-component.component.scss',
  standalone: false, // Always set explicitly
  changeDetection: ChangeDetectionStrategy.OnPush // Prefer OnPush
})
```

## TypeScript Standards

### Entity Models

- Make all entity fields **required by default** unless explicitly optional
- Implement type guard functions for runtime validation
- Keep frontend and backend models in sync
- Use strict typing on service methods that handle entity data

Example type guard implementation:

```typescript
export function isRecord(value: any): value is Record {
  return (
    value &&
    typeof value.id === 'number' &&
    typeof value.UID === 'string' &&
    // Additional property checks
    // ...
  );
}
```

## Reactive Programming (RxJS)

### Observable Patterns
- **Prefer hot observables** over cold observables to keep streams alive across multiple subscribers
- Use `shareReplay()` to create hot observables from cold observables
- Avoid creating new observable streams for each subscription
- Always unsubscribe from observables in `ngOnDestroy`

### Subject Usage
- Use `BehaviorSubject` for state management that requires an initial value
- Use `Subject` for simple publish-subscribe patterns
- Use `ReplaySubject` when new subscribers need access to previous emissions

### Avoiding Anti-patterns
- **Avoid nested subscriptions** - use operators like `switchMap`, `mergeMap`, or `concatMap`
- **Never use the outdated async/promise pattern** when RxJS operators can accomplish the same task
- Prefer `catchError` operator over try/catch for error handling in observables
- Always handle errors in the observable chain

```typescript
// Good
this.userService.getUser().pipe(
  switchMap(user => this.orderService.getOrdersForUser(user.id)),
  shareReplay(1),
  catchError(err => {
    this.logService.error('Failed to load orders', err);
    return of([]);
  })
).subscribe(orders => this.orders = orders);

// Avoid
this.userService.getUser().subscribe(user => {
  this.orderService.getOrdersForUser(user.id).subscribe(
    orders => this.orders = orders,
    err => console.error('Failed to load orders', err)
  );
});
```

## UI Framework

### Material Design
- **Always prefer Angular Material components** for UI elements
- Use the Angular CDK for complex behaviors (virtual scrolling, drag-drop, etc.)
- Follow Material Design specifications for spacing, typography, and elevation
- Use Material theming system to ensure visual consistency

### Component Usage
- Use `mat-form-field` for all form inputs
- Use `mat-card` for content containers
- Use `mat-table` instead of regular HTML tables
- Prefer Material icons over custom icon sets

### Theme
- Implement a **vibrant patriotic theme** throughout the application
- Primary palette should include vibrant reds and blues
- Secondary palette should include white and subtle gold accents
- Use accent colors sparingly for highlighting important actions

## CSS/SCSS Standards

### Styling Architecture
- Follow the modular SCSS architecture documented in `apps/craft-web/src/styles/README.md`
- Use partial files for organizing related styles (prefixed with `_`)
- Import all partials through the main `styles.scss` file

### Naming Conventions
- Use kebab-case for class names: `my-component`
- Use BEM methodology for component styling:
  - Block: `.card`
  - Element: `.card__title`
  - Modifier: `.card--featured`
- Prefix utility classes with their purpose: `.text-center`, `.bg-primary`

### Stylelint Integration
- Run stylelint before committing any SCSS changes: `npm run stylelint`
- Fix automated issues with: `npm run stylelint:fix`
- Adhere to the rules in `stylelint.config.js` and `.stylelintrc.json`
- Maintain alphabetical property ordering
- Follow SCSS best practices for nesting (maximum 3 levels)

### Styling Best Practices
- Use CSS variables for theming tokens (colors, spacing, etc.)
- Prioritize percentage-based and em units over fixed pixels
- Avoid utility classes for one-off styles
- Minimize component-specific overrides of Material components
- Test styles across all supported browsers and device sizes

### Material Components
- Use the `mat-mdc-` prefixed components from Angular Material
- Style with CSS variables for easier theming
- Follow MD3 specifications for spacing, elevation, and states
- Override material components in the dedicated `_material-overrides.scss` file

### Responsive Design
- Build mobile-first, then add media queries for larger screens
- Use flexbox and grid for complex layouts
- Test on all defined breakpoints in `$breakpoints` map
- Ensure text remains readable at all viewport sizes

## Animations

### Development Standards
- Use Angular's animation system for all UI transitions
- Create reusable animations from shared SCSS in `_animations.scss`
- Import and use animations via mixins or utility classes
- Apply animations to route transitions, list items, and interactive elements
- Use easing functions that match Material Design specifications
- Keep animations under 400ms for optimal user experience

### Animation Classes
- Use the patriotic flag-wave animation for USA-themed elements
- Apply `.patriotic-pulse` class for attention-grabbing elements
- Add `.ripple` class to all clickable elements for tactile feedback
- Use `.elevate-on-hover` for card-like elements

### AI Prompt Guidance for Animations
- When using AI assistants to generate animations, always specify:
  - Animation duration (ideally 300-400ms)
  - Easing function (preferably using `var(--ease-patriotic)`)
  - Target selector specificity
  - Hardware acceleration requirements
- Example prompt: "Create a flag-wave animation that uses transform and opacity, runs for 400ms with the patriotic easing curve, and includes hardware acceleration properties"
- Always review generated animations for performance impact

### Performance Considerations
- Avoid animating layout properties (prefer opacity, transform)
- Use `will-change` property judiciously
- Test animations on lower-end devices
- Always respect `prefers-reduced-motion` settings

### QA Process
- **Remove or disable complex animations during QA testing**
- Provide configuration options to disable animations for accessibility testing
- Ensure all interactive components are usable without animations
- Test all animations with reduced motion preferences enabled

```typescript
// Example Angular animation using our shared system
import { trigger, transition, style, animate } from '@angular/animations';

export const cardAnimation = trigger('cardAnimation', [
  transition(':enter', [
    style({ opacity: 0, transform: 'translateY(20px)' }),
    animate('300ms var(--ease-patriotic)', 
      style({ opacity: 1, transform: 'translateY(0)' }))
  ])
]);
```

## Testing

## Master Component Pattern

Our custom Master Component Pattern (MCP) requires:

1. Module-based architecture (not standalone)
2. Clear separation of concerns
3. Implementation of standard lifecycle hooks
4. Proper error and loading state handling
5. Consistent UI patterns
6. BehaviorSubject-based state management
7. CDK integration
8. Consistent animation patterns

The MCP has been implemented in:

## Design Tokens

### Token Usage Guidelines
- Always use design tokens instead of hard-coded values
- Reference tokens via CSS variables or the TypeScript token interfaces
- Update tokens through Style Dictionary, never override locally
- Follow the patriotic theme token naming conventions
- Test all token changes in both light and dark modes

### Style Dictionary Workflow
- Make changes to JSON files in the `tokens/` directory
- Run `npm run build:tokens` to generate all formats
- Import the generated files in your components
- Never modify the generated files directly

```typescript
// Example token usage in TypeScript
import { colorTokens } from '@core/tokens/design-tokens';

const primaryColor = colorTokens.color.base.usa.blue;
```

```scss
// Example token usage in SCSS
.my-element {
  color: var(--color-usa-blue);
  background-color: var(--color-usa-white);
}
```

## Monorepo Architecture

### Package Management

- **Only ONE package.json file is allowed in the entire repository (at the root)**
- Individual apps must NOT have their own package.json files
- All dependencies must be declared in the root package.json
- Use Nx commands to manage dependencies and build/run apps

### Dependency Management

```bash
# Add a dependency for the entire monorepo
npm install some-package --save

# Add a dev dependency for the entire monorepo
npm install some-dev-package --save-dev

# Run a specific app
nx serve craft-web

# Build a specific app
nx build craft-nest
```

### Versioning

- All TypeScript/JavaScript packages must use compatible versions
- Version management happens in a single place (root package.json)
- Version mismatches must be resolved at the root level
