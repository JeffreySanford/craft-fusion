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

## TypeScript Standards

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

## Animations

### Development Standards
- Use Angular's animation system for all UI transitions
- Create reusable animations in shared files
- Apply animations to route transitions, list items, and interactive elements
- Use easing functions that match Material Design specifications
- Keep animations under 400ms for optimal user experience

### Performance Considerations
- Avoid animating layout properties (prefer opacity, transform)
- Use `will-change` property judiciously
- Test animations on lower-end devices

### QA Process
- **Remove or disable complex animations during QA testing**
- Provide configuration options to disable animations for accessibility testing
- Ensure all interactive components are usable without animations
- Test all animations with reduced motion preferences enabled

```typescript
// Reusable animation example
export const fadeAnimation = trigger('fadeAnimation', [
  transition(':enter', [
    style({ opacity: 0 }),
    animate('200ms ease-out', style({ opacity: 1 }))
  ]),
  transition(':leave', [
    animate('200ms ease-in', style({ opacity: 0 }))
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
