# Troubleshooting Guide

This guide lists common workspace issues and fixes.

## Nx errors: "The system cannot find the file specified"

```bash
pnpm dlx nx reset

pnpm dlx nx run craft-nest:serve
```

If it persists:

- Verify `apps/craft-nest/src/main.ts` exists.
- Run a clean build: `pnpm dlx nx build craft-nest --skip-nx-cache`.

## API connection refused (frontend proxy)

- Ensure a backend is running:

```bash
pnpm dlx nx run craft-nest:serve
# or
pnpm dlx nx run craft-go:serve
```

- Verify proxy config exists and is referenced: `apps/craft-web/proxy.config.json`.

## Port conflicts

### Windows

```bash
netstat -ano | findstr :3000

taskkill /PID <PID> /F
```

### Linux/macOS

```bash
lsof -i :3000

kill -9 <PID>
```

## Nx cache or daemon issues

```bash
pnpm dlx nx reset
```

If Nx Cloud errors appear, temporarily disable:

```bash
pnpm dlx nx --no-cloud run craft-nest:serve
```

## Node heap out of memory

```bash
NODE_OPTIONS="--max-old-space-size=8192" pnpm dlx nx run craft-web:serve
```

## Go API port conflicts

```bash
set PORT=4001
pnpm dlx nx run craft-go:serve
```

## Health checks

```bash
curl http://localhost:3000/health

curl http://localhost:4000/health
```
