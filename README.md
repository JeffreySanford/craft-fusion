# Craft Fusion

Craft Fusion is a monorepo featuring a modern tech stack with an Angular frontend and dual backend implementations (NestJS and Go) for benchmarking and development flexibility.

## Overview

This project demonstrates modern web development best practices through three integrated applications:

- **craft-web**: Angular frontend with Material Design 3 and a patriotic theme
- **craft-nest**: NestJS backend with MongoDB integration and real-time capabilities
- **craft-go**: High-performance Go backend for alternative API access

## 🚀 **Installation Guide**

### Prerequisites

Ensure the following software is installed on your system:

| **Software**     | **Version**     | **Installation Link** |
|-------------------|-----------------|------------------------|
| **Node.js**      | `v22.0.0`       | [Node.js Download](https://nodejs.org/en/) |
| **npm**          | `v10.9.0`       | Included with Node.js |
| **Go**           | `v1.23.4`       | [Go Download](https://golang.org/dl/) |
| **NX CLI**       | Latest          | `npm install -g nx` |
| **Angular CLI**  | Latest          | `npm install -g @angular/cli` |
| **NestJS CLI**   | Latest          | `npm install -g @nestjs/cli` |

### Setup

```bash
# Clone repository
git clone https://github.com/JeffreySanford/craft-fusion.git
cd craft-fusion

# Install dependencies
npm install --legacy-peer-deps

# Install Go dependencies
cd apps/craft-go
go mod tidy
cd ../../
```

### Starting Applications

```bash
# Start Angular frontend
nx serve craft-web

# Start NestJS backend
nx serve craft-nest

# Start Go backend
nx serve craft-go
```

## 📊 **Performance Testing**

Compare backend performance:

- NestJS: `http://localhost:3000/api/users?limit=1000000`
- Go: `http://localhost:4000/records?limit=1000000`

## 💅 **Design System**

Craft Fusion implements a comprehensive design system with:

- **Design Tokens**: Centralized design values using Style Dictionary
- **Patriotic Theme**: Now featuring vibrant red (#B22234), navy (#002868), gold (#FFD700), and white (#FFFFFF)
- **Animation System**: Performance-optimized, accessible animations
- **Logger Service**: Enhanced logging with patriotic color scheme and detailed service monitoring
- **Admin Dashboard**: Real-time service monitoring with detailed API endpoint tracking

### Current Implementation Status (60% Complete)

- ✅ Core Material Design 3 token system
- ✅ Typography system and scale
- ✅ Layout containers and responsive grid
- ✅ Button system with all variants
- ✅ Color system with light/dark themes
- ✅ Animation framework for transitions
- ✅ Logger service with vibrant patriotic colors
- ✅ Service monitoring visualizations
- ⬜ Form controls (in progress)
- ⬜ Data tables and visualization components

### Building Design Tokens

```bash
npm run build:tokens
```

## Data Models

### Record Entity

The Record entity is consistently implemented across all platforms with strict validation:

- All Record fields are **required** for data integrity
- Type guards validate entity structure at runtime  
- Frontend and backend models maintain strict type consistency
- See [Entity-Validation.md](./docs/Entity-Validation.md) for implementation details

## 📖 **Documentation Guide**

| Documentation | Purpose | When to Update |
|---------------|---------|---------------|
| [README.md](./README.md) | Main project overview | When project scope changes |
| [CODING-STANDARDS.md](./CODING-STANDARDS.md) | Development guidelines | When standards change |
| [OLLAMA-SETUP.md](./OLLAMA-SETUP.md) | AI integration setup | When AI procedures change |
| [styles/README.md](./apps/craft-web/src/styles/README.md) | Style system docs | When styles change |
| [style-refactoring-plan.md](./prompts/style-refactoring-plan.md) | Style migration roadmap | When migration progresses |

## Markdown Requirements

- Ensure compliance with MD032 by surrounding lists with blank lines
- Use proper heading hierarchy
- Include language identifiers in code blocks
- Format tables consistently

## Important Repository Rules

### Package Management

- **package.json is only allowed in the root directory**
- Individual apps should not have their own package.json files
- All dependencies must be managed through the root package.json
- Use nx commands to manage dependencies and builds

## Working Parts

This monorepo is organized into several key areas:

### Angular Frontend (craft-web)

- Built with Material Design 3 principles
- Implements patriotic-themed styling with vibrant red, navy, gold, and white
- Hosts core UI components (header, footer, sidebar) and data visualizations
- Features enhanced logger display with patriotic color scheme

### NestJS Backend (craft-nest)

- Integrates MongoDB for data persistence
- Features real-time capabilities (WebSockets)
- Supports the same core models as the frontend
- Provides detailed service metrics for admin dashboard

### Go Backend (craft-go)

- Provides an alternative API implementation
- Focuses on high-performance data operations
- Offers a comparable interface to match the NestJS backend

### Shared Refactoring Strategies

- Prompt-based development approach for feature planning
- Style refactoring plan to unify visual elements under MD3
- Component-specific refactoring (footer, header, sidebar) for consistency
- Data visualization plan to standardize chart components and accessibility

## Recent Updates

- Fixed type errors in category detection methods
- Enhanced logger display component with better performance  
- Implemented patriotic color scheme for logger service
- Improved service monitoring visualization in admin dashboard

Last Updated: 2025-03-25

## README Files

- [Styles README](apps/craft-web/src/styles/README.md)

## Prompt & Refactoring Plans

For details on ongoing refactoring, see:

- [Master Prompt Tracking System](./prompts/prompts-tracking.md)
- [Style Refactoring Plan](./prompts/style-refactoring-plan.md)
- [Footer Refactoring Plan](./prompts/footer-refactoring-plan.md)
- [Header Refactoring Plan](./prompts/header-refactoring-plan.md)
- [Sidebar Refactoring Plan](./prompts/sidebar-refactoring-plan.md)
- [Data Visualization Plan](./prompts/data-visualization-plan.md)
- [Feature Refactoring Strategy](./prompts/feature-refactoring-strategy.md)

## Coding Standards

See [CODING-STANDARDS.md](./CODING-STANDARDS.md) for best practices and guidelines.

## Project Status

| Application | Status | Build | Test Coverage |
|-------------|--------|-------|--------------|
| craft-web | Active | [![Build Status](https://img.shields.io/badge/build-passing-brightgreen.svg)](https://github.com/your-org/craft-fusion) | [![Coverage](https://img.shields.io/badge/coverage-75%25-yellow.svg)](https://github.com/your-org/craft-fusion) |
| craft-nest | Active | [![Build Status](https://img.shields.io/badge/build-passing-brightgreen.svg)](https://github.com/your-org/craft-fusion) | [![Coverage](https://img.shields.io/badge/coverage-80%25-yellow.svg)](https://github.com/your-org/craft-fusion) |
| craft-go | Active | [![Build Status](https://img.shields.io/badge/build-passing-brightgreen.svg)](https://github.com/your-org/craft-fusion) | [![Coverage](https://img.shields.io/badge/coverage-90%25-brightgreen.svg)](https://github.com/your-org/craft-fusion) |
| craft-automation | In Development | [![Build Status](https://img.shields.io/badge/build-pending-lightgrey.svg)](https://github.com/your-org/craft-fusion) | [![Coverage](https://img.shields.io/badge/coverage-85%25-yellow.svg)](https://github.com/your-org/craft-fusion) |

## Project Status & Progress

- Core Consolidation: [x] Completed
- MD3 Setup: [x] Completed
- Component Styling Merge: [~] In Progress
- Font Centralization: [x] Completed
- Final Testing & Documentation: [ ] Not Started

## Getting Started with Development

For detailed installation instructions for each application, see:

- [craft-web Setup Guide](./apps/craft-web/README.md)
- [craft-nest Setup Guide](./apps/craft-nest/README.md)
- [craft-go Setup Guide](./apps/craft-go/README.md)
- [craft-automation Setup Guide](./apps/craft-automation/README.md)

### Quick Start

```bash
# Clone repository
git clone https://github.com/your-org/craft-fusion.git
cd craft-fusion

# Install dependencies
npm install

# Start all applications
nx run-many --target=serve --all
```

## Contribution Guidelines

Please read [CONTRIBUTING.md](./CONTRIBUTING.md) for details on our code of conduct and the process for submitting pull requests.

## Versioning Strategy

We use [SemVer](http://semver.org/) for versioning. For available versions, see the [tags on this repository](https://github.com/your-org/craft-fusion/tags).

## License

This project is licensed under the MIT License - see the [LICENSE.md](LICENSE.md) file for details.

## 🌟 Welcome to New Developers

New to the team or just starting your development journey? We're thrilled to have you! Here's a roadmap to help you navigate this project:

### 🧗‍♂️ Learning Path

1. **Start here**: Read through this README completely
2. **Setup your environment**: Follow our [INSTALLATION Guide](./docs/INSTALLATION.md)
3. **Understand our code**: Review [CODING-STANDARDS.md](./CODING-STANDARDS.md)
4. **Pick a small task**: Look for issues tagged with `good-first-issue`

### 🔍 Understanding the Architecture

```ascii
       ┌───────────────┐
       │   craft-web   │
       │   (Angular)   │
       └───────┬───────┘
               │
               ▼
┌──────────────┬──────────────┐
│   craft-go   │  craft-nest  │
│     (Go)     │   (NestJS)   │
└──────────────┴──────────────┘
               │
               ▼
       ┌───────────────┐
       │   MongoDB     │
       └───────────────┘
```

Don't worry if it feels overwhelming at first - we all started somewhere! The monorepo structure allows you to focus on one application while understanding how it fits into the bigger picture.

### 🤔 Common Questions

- **"Which codebase should I work on first?"** - Start with craft-web for frontend or craft-nest for backend, as they have more documentation for beginners
- **"I'm getting strange errors after pulling"** - Try `npm run clean:all` followed by `npm install`
- **"How do I test my changes?"** - Each app has its own testing commands in its README

### 💬 Our Question-Friendly Culture

At Craft Fusion, we believe **the only bad question is the one you don't ask**. Our team was built on the foundation that sharing knowledge elevates everyone's skills:

- **Every question improves our code**: Questions often reveal opportunities to enhance our documentation or codebase
- **Questions lead to examples**: We love providing real-world examples that demonstrate best practices
- **Documentation evolves through questions**: Many of our best docs started as answers to great questions

The developers who ask thoughtful questions are the same ones who help us maintain our clean architecture and consistent practices. Your fresh perspective helps us see our code in new ways!

**Pro tip**: When asking questions in our channels, include what you've tried and what you're trying to accomplish. This helps us provide the most helpful response.

Remember: **Every expert was once a beginner**. Don't hesitate to ask questions in our development channels!
