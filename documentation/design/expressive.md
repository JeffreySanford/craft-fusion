# Material Design 3 Expressive Notes (Reference)

This file is reference-only. It is not a step-by-step install guide. For the canonical styling rules, use `documentation/design/design-system.md`.

## Constraints

- Use Nx commands for all workspace operations.
- Avoid standalone components per `documentation/CODING-STANDARDS.md`.
- Prefer `@angular/material` (not `@material/web`).

## Expressive theming snapshot

```scss
@use '@angular/material' as mat;

$theme: mat.define-theme((
  color: (
    theme-type: light,
    primary: mat.$blue-palette,
    tertiary: mat.$red-palette,
    use-system-variables: true
  ),
  typography: (
    use-system-variables: true
  )
));

html {
  @include mat.system-level-colors($theme);
  @include mat.system-level-typography($theme);
}
```

## Expressive component notes

- Prefer rounded shapes and bold color blocks for key actions.
- Use animated state transitions (200-300ms) with reduced motion support.
- Keep density comfortable; avoid cramped layouts.

## References

- `documentation/design/design-system.md`
- `documentation/CODING-STANDARDS.md`
