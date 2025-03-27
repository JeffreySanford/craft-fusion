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

3.Run a specific application:

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

## Additional Contribution Guidelines (Added July 2024)

### Code Review Process

1. All PRs require at least one approving review before merging
2. Documentation changes must be included in the same PR as code changes
3. All tests must pass before code review begins
4. Commits should follow conventional commit format

### Material Design 3 Compliance

As of March 2025, our entire component library has been migrated to Material Design 3. When contributing:

1. Use the latest MD3 patterns documented in the [MD3-MIGRATION-GUIDE.md](../apps/craft-web/src/styles/MD3-MIGRATION-GUIDE.md)
2. Follow our patriotic theme color system for new components
3. Ensure dark mode compatibility for all UI elements

## Progress Tracking

1. All project tasks are centrally tracked in the [TODO document](TODO.md)
2. Before starting work, check the TODO document for task status
3. Mark tasks as "In Progress" with your name when working on them
4. Update the TODO document, [ROADMAP](ROADMAP.md), and [CHANGELOG](CHANGELOG.md) when completing tasks
5. Always update the "Last Updated" date in document sections you modify

Last Updated: March 27, 2025
