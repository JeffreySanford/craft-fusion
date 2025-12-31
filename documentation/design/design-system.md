# Craft Fusion Design System

This document defines the MD3-based design system with a bold patriotic visual language. It is the canonical UI reference for Craft Fusion.

## Design principles

- Expressive but readable: bold colors, clear hierarchy, clean spacing.
- Consistent components: reuse cards, tiles, and typography styles.
- Accessible by default: color contrast and focus states are mandatory.

## Color system

### Core palette

- Navy: `#002868`
- Red: `#BF0A30`
- Gold: `#FFD700`
- White: `#FFFFFF`

### System colors

- Primary: Navy
- Secondary: Red
- Tertiary: Gold
- Surface: White / Light Gray
- Error: `#BA1B1B`
- Warning: `#F9AA33`
- Success: `#386A20`
- Info: `#0061A4`

### Gradients

Use gradients sparingly for tiles and headers:

- Navy gradient: `linear-gradient(135deg, #001a3a, #002868)`
- Red gradient: `linear-gradient(135deg, #7a0f22, #bf0a30)`
- Gold gradient: `linear-gradient(135deg, #b38b00, #ffd700)`

## Typography

### Font families

- Primary UI: "Roboto Flex", "Roboto", sans-serif
- Serif/editorial: "IBM Plex Serif", "Lora", "Merriweather", serif
- Display accent: "Playfair Display", serif
- Sans secondary: "Source Sans Pro", "Open Sans", sans-serif
- Monospace: "Fira Code", "Source Code Pro", monospace

### Type scale

- Display Large: 3.5625em
- Display Medium: 2.8125em
- Display Small: 2.25em
- Headline Large: 2em
- Headline Medium: 1.75em
- Headline Small: 1.5em
- Title Large: 1.375em
- Title Medium: 1em
- Title Small: 0.875em
- Body Large: 1em
- Body Medium: 0.875em
- Body Small: 0.75em
- Label Large: 0.875em
- Label Medium: 0.75em
- Label Small: 0.6875em

## Layout and spacing

- 12-column grid on desktop, 8 on tablet, 4 on mobile.
- 8px spacing system implemented as em units in SCSS.

## Components

### Cards

- Use elevated, filled, and outlined variants.
- Cards must be visually distinct from the background.
- Prefer tinted headers for admin dashboards.

### Buttons

- Filled for primary actions.
- Outlined for secondary actions.
- Text for tertiary actions.

### Navigation

- Use top app bar plus side navigation for admin.
- Tabs are allowed only within a view (not for primary nav).

## Motion

- Standard duration: 200ms, complex: 300ms.
- Use reduced-motion fallbacks.
- Staggered reveals for dashboards and tiles.

## Accessibility

- WCAG AA contrast minimum.
- Visible focus states for all interactive elements.
- Keyboard navigation required for all admin tools.

## Design tokens

Tokens are required; do not hard-code values.

```scss
// Bad
.element {
  color: #002868;
}

// Good
.element {
  color: var(--md-sys-color-primary);
}
```

## File structure

```
apps/craft-web/src/styles/
  README.md
  _variables.scss
  _typography.scss
  _theme.scss
  _animations.scss
  _layout.scss
  _utilities.scss
  _reset.scss
  _scrollbar.scss
  _md3-components.scss
  _material-overrides.scss
  styles.scss
```

## Data visualization

- Use navy/red/gold for series ordering.
- Do not rely on color alone; add labels and patterns.
- Use bar or line charts for comparisons; avoid pie charts for large datasets.

---

Last Updated: 2025-12-30
