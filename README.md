# Craft Fusion

A comprehensive web application with responsive layout, interactive data visualizations, and patriotic theming.

![Craft Fusion](https://placehold.co/600x400?text=Craft+Fusion)

## 🚀 Features

- **Patriotic Design System** - Navy blue, red, and gold theme with elegant UI components
- **Fixed Header/Footer Layout** - Modern layout with fixed navigation elements
- **Responsive Content Area** - Flexible mainstage with collapsible sidebar
- **Data Visualizations** - Performance metrics and health monitoring dashboards
- **Security Settings** - User security preferences and password management
- **Theme Switcher** - Multiple patriotic themes (Light, Dark, Bold, Vintage)
- **Performance Metrics** - Real-time system monitoring and reporting
- **Admin Dashboard** - Protected admin section for authorized users

## 📋 Project Structure

```plaintext
craft-fusion/
│
├── apps/                   # Application code
│   ├── craft-web/          # Frontend Angular application
│   │   ├── src/
│   │   │   ├── app/        # Application code
│   │   │   │   ├── common/       # Shared services, utilities, components
│   │   │   │   │   ├── guards/   # Auth and admin guards
│   │   │   │   │   ├── services/ # Core services including layout
│   │   │   │   │   └── ...
│   │   │   │   ├── pages/        # Main application pages
│   │   │   │   │   ├── header/   # Fixed header components
│   │   │   │   │   ├── footer/   # Fixed footer components
│   │   │   │   │   ├── sidebar/  # Collapsible sidebar components
│   │   │   │   │   └── ...
│   │   │   │   └── projects/     # Project-specific feature modules
│   │   │   └── styles/          # Global styles
│   │   │       ├── _variables.scss
│   │   │       ├── _animations.scss
│   │   │       └── ...
│   └── craft-nest/         # Backend NestJS application
│
├── docs/                   # Documentation
│   ├── LAYOUT-PATTERNS.md  # Layout documentation
│   ├── THEME-SYSTEM.md     # Theme system documentation
│   └── ...
│
└── prompts/                # Project planning and status
    ├── layout-refactoring-plan.md
    └── ...
```

## 🎨 Design System

The application implements a comprehensive theming architecture based on Material Design 3 principles with vibrant patriotic color schemes:

- **Light Theme**: Navy (#002868), Red (#B22234), Gold (#FFD700)
- **Dark Theme**: Navy (#4682B4), Red (#FF6B6B), Gold (#FFD700)
- **Bold Patriotic**: Deep Navy (#0A3161), Bright Red (#E40032), Rich Gold (#FFBF00)
- **Vintage Patriotic**: Muted Navy (#19477F), Muted Red (#A81B31), Antique Gold (#DEB841)

## 🧩 Layout Components

The layout follows a fixed structure with header and footer anchored to the viewport:

```plaintext
┌─────────────────────────────────────────────┐
│                  HEADER                     │ <- Fixed to top
├────────────┬────────────────────────────────┤
│            │                                │
│            │                                │
│  SIDEBAR   │           MAINSTAGE            │ <- 1em gutter between
│            │                                │    sidebar and mainstage
│            │                                │
│            │                                │
│            │                                │
├────────────┴────────────────────────────────┤
│                  FOOTER                     │ <- Fixed to bottom
└─────────────────────────────────────────────┘
```

## 🛠️ Development

### Prerequisites

- Node.js (v18 or later)
- npm (v8 or later)
- Angular CLI

### Setup

```bash
# Clone the repository
git clone https://github.com/your-org/craft-fusion.git
cd craft-fusion

# Install dependencies
npm install

# Start development server
npm run start
```

### Building

```bash
# Build for production
npm run build

# Run tests
npm run test
```

## 📊 Current Status

See [STATUS-AND-VISUALIZATION.md](./prompts/STATUS-AND-VISUALIZATION.md) for detailed project status and visualizations.

## 📑 Documentation

- [Layout Patterns](./docs/LAYOUT-PATTERNS.md)
- [Theme System](./docs/THEME-SYSTEM.md)

## 🔗 Related Projects

- **craft-design-system** - Component library for the Craft UI system
- **craft-analytics** - Analytics dashboard for user metrics

## 📝 License

MIT
