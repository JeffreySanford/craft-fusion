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

## Development Workflow

1. **Feature Branches**: Create a branch for your feature or bugfix

   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Commit Often**: Make small, focused commits with clear messages

   ```bash
   git commit -m "feat: add new chart component"
   ```

3. **Follow Conventional Commits**: Use conventional commit format
   - `feat:` for new features
   - `fix:` for bug fixes
   - `docs:` for documentation changes
   - `style:` for formatting changes
   - `refactor:` for code refactoring
   - `test:` for adding tests
   - `perf:` for performance improvements
   - `chore:` for build process or tooling changes

4. **Testing**: Always include tests for your changes

   ```bash
   nx test craft-web --testFile=path/to/your/test.spec.ts
   ```

5. **Pull Request**: Submit a pull request with your changes
   - Include a clear description of the changes
   - Reference any related issues
   - Ensure all tests pass
   - Request reviewers

## Code Style and Standards

- Follow the [Coding Standards](./CODING-STANDARDS.md) for the project
- Use ESLint and Prettier for code formatting
- Ensure your code passes all linting rules

  ```bash
  nx lint craft-web
  ```

## Documentation

- Update documentation for any features you add or modify
- Follow the [Markdown Standards](./MARKDOWN-STANDARDS.md) for documentation
- Ensure your code includes proper JSDoc comments

## Version Control Best Practices

- Keep pull requests focused on single concerns
- Squash commits when merging to maintain a clean history
- Include issue numbers in commit messages when applicable
- Use descriptive branch names that reflect the work being done

## Testing Guidelines

- Write unit tests for all new functionality
- Include integration tests where appropriate
- Follow the [Testing Guide](./TESTING.md) for detailed testing approaches
- Ensure good test coverage for your changes

## Working with the Monorepo

- Use Nx commands to interact with the repository
- Leverage Nx's caching capabilities for faster builds
- Use affected commands to only run tests for affected code:

  ```bash
  nx affected:test
  nx affected:lint
  ```

## Getting Help

If you need assistance or have questions:

- Check the existing documentation first
- Review the [Troubleshooting Guide](./TROUBLESHOOTING.md)
- Reach out to the team via the project communication channels

Last Updated: 2025-03-28
