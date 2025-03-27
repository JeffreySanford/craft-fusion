# 🧪 Craft Fusion Testing Guide

This comprehensive guide covers all testing aspects of the Craft Fusion platform, including local development testing, component testing, documentation verification, and automation.

## Table of Contents

- [Local Development Testing](#local-development-testing)
- [Component Testing](#component-testing)
- [End-to-End Testing](#end-to-end-testing)
- [Documentation Testing](#documentation-testing)
- [Performance Testing](#performance-testing)
- [Continuous Integration Testing](#continuous-integration-testing)

## Local Development Testing

### Basic Application Testing

```bash
# Start the Angular frontend
nx serve craft-web

# Start the NestJS backend
nx serve craft-nest

# Start the Go backend
nx serve craft-go
```

### Verify services are running

- Angular: <http://localhost:4200>
- NestJS: <http://localhost:3000/api>
- Go: <http://localhost:4000/api-go>

### Testing AI Integration Locally

```bash
# Start Ollama locally
./scripts/ollama-manager.sh start

# Pull the required models
./scripts/ollama-manager.sh pull
```

### Docker-Based Testing

```bash
# Build and start all services locally
docker-compose build
docker-compose up -d

# Check if all containers are running
docker-compose ps
```

## Component Testing

### Running Unit Tests

```bash
# Test all applications
nx run-many --target=test --all

# Test specific application
nx test craft-web
nx test craft-nest
nx test craft-go
```

### Component Test Coverage

```bash
# Generate coverage reports
nx test craft-web --code-coverage
```

## End-to-End Testing

```bash
# Run E2E tests
nx e2e craft-web-e2e

# Run with UI mode
nx e2e craft-web-e2e --watch
```

## Documentation Testing

### Markdown Validation

We validate markdown files to ensure consistency and quality:

```bash
# Run markdownlint on all docs
npm run lint:markdown

# Fix auto-fixable issues
npm run lint:markdown:fix
```

### Link Checking

```bash
# Verify internal and external links in documentation
npm run check-links
```

### Documentation Preview

Preview documentation with styling applied:

```bash
# Start documentation preview server
npm run docs:serve
```

### Accessibility Testing

Test documentation for accessibility compliance:

```bash
# Run accessibility checker on documentation
npm run docs:a11y
```

## Performance Testing

### API Performance

```bash
# Run API performance tests
nx run craft-go:benchmark
nx run craft-nest:benchmark
```

### Frontend Performance

```bash
# Run Lighthouse performance tests
npm run perf:lighthouse
```

## Continuous Integration Testing

Our CI pipeline runs the following test suites:

1. **Linting**: Code style and quality checks
2. **Unit Tests**: Component and service tests
3. **E2E Tests**: Browser-based functional tests
4. **Build Verification**: Ensures builds complete successfully
5. **Documentation Tests**: Validates documentation format and links

### Running CI Tests Locally

```bash
# Simulate CI test run locally
npm run ci:test
```

## Test Environment Management

### Environment Variables

Test environments use separate environment variables defined in:

- `.env.test` - Shared test variables
- `.env.e2e` - End-to-end testing variables

### Test Data Management

Reset test data before running integration tests:

```bash
# Reset test database to known state
npm run test:db:reset
```

## Last Updated
March 27, 2025

---

Last updated: 2025-03-30
