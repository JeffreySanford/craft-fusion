# Testing Guide

This workspace uses Nx for all JavaScript/TypeScript testing. Go tests are run with `go test`.

## Workspace tests (Nx)

```bash
# Lint all projects with a lint target
pnpm dlx nx run-many -t lint

# Test all projects with a test target
pnpm dlx nx run-many -t test
```

## Project tests (Nx)

```bash
# Angular frontend
pnpm dlx nx test craft-web

# NestJS backend
pnpm dlx nx test craft-nest

# E2E
pnpm dlx nx e2e craft-web-e2e
```

## Go tests

```bash
cd apps/craft-go

go test ./... -v

go test ./... -coverprofile=coverage.out
```

## Notes

- Angular 19 test runner decisions are tracked in `TODO.md`.
- Keep Jest and Vitest strictly scoped if both are used.
