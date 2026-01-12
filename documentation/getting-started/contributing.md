```markdown
# Contributing to Craft Fusion

This guide will help you understand how to contribute to the Craft Fusion monorepo project.

## Architecture Overview

Craft Fusion is a monorepo using Nx for workspace management. It contains:

- Angular frontend (craft-web)
- NestJS API (craft-nest)
- Go microservices (craft-go)

## Repository Rules

### Package Management

1. **IMPORTANT: Only ONE package.json file is allowed in the entire repository**
2. The package.json file must be located at the root of the repository
3. Individual applications must NOT have their own package.json files
4. All dependencies must be managed through the root package.json

### Why This Matters

- Ensures consistent dependency versions across all applications
- Prevents dependency conflicts and version mismatches
- Allows proper hoisting of dependencies
- Simplifies maintenance and updates

## Getting Started

1. Clone the repository
2. Install dependencies:
```bash
npm install
```

1. Run a specific application:

```bash
nx serve craft-web
# or
nx serve craft-nest
```

## Adding Dependencies

Always add dependencies at the root level:

```bash
# From the root directory
npm install your-package-name --save
# or for dev dependencies
npm install your-dev-package --save-dev
```

## Making Changes

<!-- Ensure blank lines around headings/lists -->
<!-- Added "Last Updated" -->

Last Updated: 2025-03-25

```
