# Testing Guide

## Nx/Angular Tests

- Run all Angular tests:

  ```
  nx test craft-web
  ```

- For a single spec, add the file path:

  ```
  nx test craft-web --testFile=path/to/test.spec.ts
  ```

## Nx/NestJS Tests

- Run all NestJS tests:

  ```
  nx test craft-nest
  ```

- To watch tests in real time:

  ```
  nx test craft-nest --watch
  ```

## Go Tests

- Go to the Craft Go app folder:

  ```
  cd apps/craft-go
  ```

- Run tests:

  ```
  go test ./... -v
  ```

- Generate coverage:

  ```
  go test ./... -coverprofile=coverage.out
  ```

## Including Tests in Production

You can integrate these tests into Continuous Integration pipelines or run them manually before deploying. For container-based deployments, add a testing step in your CI/CD process prior to building production images.
