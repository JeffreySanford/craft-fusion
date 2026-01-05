# Craft Fusion Installation Guide

This guide covers local setup for the Nx monorepo.

## Prerequisites

- Node.js 20.x
- pnpm 9.x (via Corepack)
- Go 1.23+ (for `craft-go`)
- Git

Optional:

- Python 3.11+ (only if training tools are used)

## Install tooling

```bash
corepack enable
corepack prepare pnpm@latest --activate
```

## Clone and install

```bash
git clone <repo-url>
cd craft-fusion
pnpm install
```

## Run the apps (Nx)

```bash
# Frontend
pnpm dlx nx serve craft-web

# Backend (Nest)
pnpm dlx nx serve craft-nest

# Backend (Go)
pnpm dlx nx serve craft-go
```

## Environment variables

Use `.env` for local configuration:

```env
NODE_ENV=development
HOST=0.0.0.0
PORT=3000
DOMAIN=localhost
```

## System prep (optional)

No system prep scripts are currently tracked in this repository.

## Common cleanup commands

```bash
# Remove build output
pnpm dlx nx reset

# Clean dependencies
pnpm install --force
```

## Notes

- All workspace commands should be run through Nx.
- Avoid creating new `package.json` files inside apps or libs.
