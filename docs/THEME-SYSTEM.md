# Craft Fusion Theme System

## Overview

The Craft Fusion theme system implements a comprehensive theming architecture based on Material Design 3 principles. The system features vibrant patriotic color schemes and supports multiple theme variants.

## Theme Colors

Our application uses four distinct vibrant patriotic themes:

1. **Light Theme** - Standard light theme with patriotic accents
   - Primary (Navy): #002868
   - Secondary (Red): #B22234
   - Tertiary (Gold): #FFD700

2. **Dark Theme** - Dark theme with patriotic accents
   - Primary (Navy): #4682B4
   - Secondary (Red): #FF6B6B
   - Tertiary (Gold): #FFD700

3. **Bold Patriotic** - Vibrant patriotic theme with bold colors
   - Primary (Deep Navy): #0A3161
   - Secondary (Bright Red): #E40032
   - Tertiary (Rich Gold): #FFBF00

4. **Vintage Patriotic** - Classic vintage patriotic theme
   - Primary (Muted Navy): #19477F
   - Secondary (Muted Red): #A81B31
   - Tertiary (Antique Gold): #DEB841

## Layout Structure & Component Theming

The theme system applies consistent styling to the core layout components:

```
┌─────────────────────────────────────────────┐
│                  HEADER                     │ <- Theme-aware gradients & colors
├────────────┬────────────────────────────────┤
│            │                                │
│            │                                │
│  SIDEBAR   │           MAINSTAGE            │ <- 1em gutter between
│            │                                │    sidebar and mainstage
│ Theme-aware│    Theme-aware surface &       │
│ nav items  │    content containers          │
│            │                                │
├────────────┴────────────────────────────────┤
│                  FOOTER                     │ <- Theme-aware metrics display
└─────────────────────────────────────────────┘
```

### Header
- Gradient background using primary colors
- Contrasting text colors for readability
- Theme-aware shadow and elevation
- Consistent 1em vertical spacing from sidebar and mainstage

### Sidebar
- Theme-consistent surface colors
- Width based on longest button and icon combination (200px-250px)
- Active item highlighting with secondary color
- Hover states with tertiary color accents
- 1em gutter maintained between sidebar and mainstage

### Main Stage
- Flex-grow layout to use all available horizontal space
- Background matching theme surface
- Text using on-surface colors
- Card elements with appropriate elevation
- Red border (#B22234) provides visual distinction from sidebar

### Footer
- Patriotic gradient accents
- Theme-appropriate text contrast
- Interactive elements with tertiary color highlights
- Expandable height with smooth animation

## Theme Implementation

The theme system uses CSS variables for runtime theming capabilities and applies them consistently across the layout pattern. Key implementation details:

- CSS variables are defined at the document root level
- Variables are updated dynamically when themes are switched
- Layout components use these variables instead of hardcoded colors
- Animation transitions ensure smooth theme changes

## Theme Service

The `ThemeService` manages theme selection, persistence, and application:

- `setTheme(theme: string)`: Sets the active theme
- `toggleTheme()`: Toggles between light and dark themes
- `getCurrentTheme()`: Gets the current theme
- `isDarkTheme$`: Observable stream of the dark theme state

## Layout Integration

The theme system works in concert with the `LayoutService` to maintain consistent appearance:

```typescript
// Component example showing theme and layout integration
@Component({
  selector: 'app-example',
  template: `
    <div class="container" [ngClass]="themeClass">
      <!-- Component content -->
    </div>
  `
})
export class ExampleComponent implements OnInit {
  themeClass = '';
  
  constructor(
    private themeService: ThemeService,
    private layoutService: LayoutService
  ) {}
  
  ngOnInit() {
    this.themeService.currentTheme$.subscribe(theme => {
      this.themeClass = theme;
    });
    
    // Respond to sidebar expansion state
    this.layoutService.sidebarExpanded$.subscribe(expanded => {
      // Adjust component layout based on sidebar state
    });
  }
}
```

## User Preferences

Theme preferences are stored and retrieved from:

1. User account preferences (when logged in)
2. LocalStorage as fallback (when not logged in)

## Example Theme Application to Layout

When applying themes to the core layout pattern:

```scss
// Header theming
.app-header {
  background: var(--header-gradient);
  color: var(--md-sys-color-on-primary);
}

// Sidebar theming with 1em gutter
.sidebar {
  background-color: var(--md-sys-color-surface);
  border-right: 2px solid var(--md-sys-color-secondary);
}

// Main stage with gutter and flex-grow
.main-stage {
  flex: 1;
  background-color: var(--md-sys-color-background);
  border-left: 2px solid var(--md-sys-color-primary);
}

// Footer theming
.app-footer {
  background: linear-gradient(to right, 
    var(--md-sys-color-surface), 
    var(--md-sys-color-surface-variant));
}
```

## Related Documentation

- [Layout Patterns](./LAYOUT-PATTERNS.md) - Detailed information on layout structure
- [Component Library](./COMPONENTS.md) - Individual component documentation
