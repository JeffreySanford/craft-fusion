# Craft Fusion Typography System

## Overview

This document provides comprehensive guidelines on the typography system used in Craft Fusion applications. Our typography is based on Material Design 3 principles with adaptations for our patriotic theme.

## Font Family

We use Roboto Flex as our primary font family for its excellent readability and flexibility:

```css
font-family: 'Roboto Flex', sans-serif;
```

For monospaced text (code examples, terminal output), we use:

```css
font-family: 'Roboto Mono', monospace;
```

## Type Scale

Our type scale follows MD3 guidelines with these key text styles:

| Style | Size (em) | Line Height | Weight | Usage |
|-------|-----------|-------------|--------|-------|
| Display Large | 3.5625 | 1.12 | 400 | Hero headers |
| Display Medium | 2.8125 | 1.16 | 400 | Major section headers |
| Display Small | 2.25 | 1.22 | 400 | Secondary section headers |
| Headline Large | 2 | 1.25 | 400 | Important content headers |
| Headline Medium | 1.75 | 1.29 | 400 | Card titles, major UI elements |
| Headline Small | 1.5 | 1.33 | 400 | Minor section headers |
| Title Large | 1.375 | 1.27 | 500 | Bold titles, interactive elements |
| Body Large | 1 | 1.5 | 400 | Primary body text |
| Label Medium | 0.75 | 1.33 | 500 | Button labels, annotations |

## Usage Guidelines

1. **Consistency**: Use the defined type scale exclusively - don't create custom sizes
2. **Hierarchy**: Maintain proper heading hierarchy (h1 → h2 → h3) for accessibility
3. **Responsiveness**: Our typography automatically scales on different viewports
4. **Color**: Use semantic color tokens for text (`--md-sys-color-on-surface`, etc.)

## Patriotic Accents

For special patriotic emphasis:

1. **Navy Blue Headers**: Primary section headers use `--md-sys-color-primary`
2. **Red Accents**: Important callouts and warnings use `--md-sys-color-secondary`
3. **Gold Highlights**: Special achievements or featured content use `--md-sys-color-tertiary`

## Implementation

```scss
// Example implementation in a component
.article-header {
  @extend .headline-large;
  color: var(--md-sys-color-primary);
  margin-bottom: 1em;
}

.article-subheader {
  @extend .headline-small;
  color: var(--md-sys-color-on-surface-variant);
  margin-bottom: 0.5em;
}

.article-body {
  @extend .body-large;
  color: var(--md-sys-color-on-surface);
}
```

## Accessibility Considerations

- Maintain minimum 4.5:1 contrast ratio for normal text
- Use relative units (em) to support user font size preferences
- Include proper ARIA attributes where typography conveys meaning
- Ensure text remains legible when zoomed up to 200%

## Additional Notes
- Note regarding recommended font pairs
- Minor adjustments for digital readability

Last Updated: March 26, 2025
