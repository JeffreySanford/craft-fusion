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
| **Node.js**      | `v20.16.0`      | [Node.js Download](https://nodejs.org/en/) |
| **npm**          | `v10.8.1`       | Included with Node.js |
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
- **Patriotic Theme**: USA-inspired colors with consistent application
- **Animation System**: Performance-optimized, accessible animations

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
