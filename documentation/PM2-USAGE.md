# PM2 Usage Guide

This document describes how to run production services with PM2 using `ecosystem.config.js`.

## Build first

```bash
pnpm dlx nx build craft-nest
pnpm dlx nx build craft-go
```

## Start services

```bash
pm2 start ecosystem.config.js
```

## Common commands

```bash
pm2 list
pm2 logs craft-nest-api
pm2 logs craft-go-api
pm2 restart craft-nest-api
pm2 restart craft-go-api
pm2 save
```

## Notes

- Helper scripts referenced in older docs are not present in this repo.
- Use Nx for development (`pnpm dlx nx serve <app>`).
