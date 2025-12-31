# Local Testing Guide

This guide covers local testing for the frontend and backends.

## Start services (Nx)

```bash
# Angular frontend
pnpm dlx nx serve craft-web

# NestJS backend
pnpm dlx nx serve craft-nest

# Go backend
pnpm dlx nx serve craft-go
```

### Local URLs

- Angular: http://localhost:4200
- NestJS: http://localhost:3000/api
- Go: http://localhost:4000/api-go

## AI integration (optional)

Local model tooling is not currently tracked in this repository. If you add an AI manager script, document it here.

## Docker (optional)

Docker compose files are not tracked in this repo. If you add them, document the commands here.

## Training tools (optional)

```bash
cd apps/training

pip install -r requirements.txt

python finetune-mistral-lora.py --data sample-data.json --output ./test-output --epochs 1
```

## E2E smoke checklist

1. Log in and log out.
2. Load the admin dashboard and verify tiles render.
3. Trigger a file upload and confirm backend receipt.
4. Validate a WebSocket view for real-time updates.

## Troubleshooting

- Port conflicts: stop the process holding the port.
- Proxy config: ensure `proxy.config.json` exists and is referenced correctly.
- Local model tooling is not tracked; use your own setup.
