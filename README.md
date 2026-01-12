# Craft Fusion

Craft Fusion is an Nx monorepo with Angular 19 (Material Design 3 Expressive), NestJS, and Go.

## Quick start

```bash
pnpm install

pnpm dlx nx serve craft-web
pnpm dlx nx serve craft-nest
pnpm dlx nx serve craft-go
```

## Documentation

See `documentation/INDEX.md` for the canonical doc list.

## Deployment

- `documentation/SIMPLE-DEPLOYMENT.md`
- `documentation/deployment-digital-ocean.md`

## Live demo

- <https://jeffreysanford.us>

## Notes

- Use Nx for all workspace commands.
- Authentication: HttpOnly cookie-based JWT with logout-on-refresh and E2E test bypass (2026-01-12). See `documentation/AUTHENTICATION.md` for details.
- Unit Tests: 100% green across all platforms (Angular, Nest, Go).
- E2E: Playwright suite stabilized (90%+ pass rate).
