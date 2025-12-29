# PM2 Usage Guide (2025 Vibrant Edition)

This document explains how to use PM2 with the production-focused `ecosystem.config.js` configuration.

## Overview

The ecosystem configuration is optimized for production deployment with:

- **craft-nest-api**: Clustered NestJS API on port 3000
- **craft-go-api**: Go API service on port 4000
- Both services configured for `jeffreysanford.us` host

## Production Usage

### Build applications first

```bash
npm run pm2:build
```

### Start services

```bash
npm run pm2:start
```

### Monitor services

```bash
npm run pm2:logs     # View logs from all services
npm run pm2:monitor  # Interactive monitoring dashboard
```

### Stop services

```bash
npm run pm2:stop
```

### Restart services

```bash
npm run pm2:restart
```

## Direct PM2 Commands

You can also use PM2 directly:

```bash
# Start services
pm2 start ecosystem.config.js

# Monitor specific service
pm2 logs craft-nest-api
pm2 logs craft-go-api

# Restart specific service
pm2 restart craft-nest-api
pm2 restart craft-go-api

# Save configuration
pm2 save

# Auto-start on system boot
pm2 startup
```

Note on service user:

- If you manage PM2 under a dedicated user (e.g., `craft-fusion`), prefer:

  ```bash
  sudo pm2 startup systemd -u craft-fusion --hp /home/craft-fusion
  ```

- The deployment scripts will attempt this automatically when such a user exists; otherwise they fall back to the current user.

## Key Features

### Production Optimizations

- **Clustering**: NestJS runs in cluster mode for maximum performance
- **Process Management**: Automatic restarts on memory limits or crashes
- **Logging**: Structured logging to files with timestamps
- **Health Monitoring**: Process monitoring and auto-restart
- **Graceful Shutdown**: Proper process termination with timeouts

### Service Configuration

- **craft-nest-api**:
  - Port 3000 on jeffreysanford.us
  - Cluster mode with max instances
  - 1GB memory limit
- **craft-go-api**:
  - Port 4000 on jeffreysanford.us
  - Fork mode (single instance)
  - 1GB memory limit

## Deployment

The configuration includes automated deployment settings:

```bash
# Deploy to production server
pm2 deploy production
```

This will:

1. Pull latest code from main branch
2. Install dependencies
3. Build applications
4. Reload PM2 services

## Troubleshooting

### Common Issues

1. **Port conflicts**: Ensure ports 3000 and 4000 are available
2. **Build failures**: Run `npm run pm2:build` before starting services
3. **Permission issues**: Ensure log directories exist and are writable
4. **Go binary**: Verify Go app builds correctly for your platform

### Useful Commands

```bash
pm2 list                 # Show all processes
pm2 describe <app-name>  # Detailed process info
pm2 flush               # Clear all logs
pm2 reload <app-name>   # Zero-downtime restart
pm2 delete <app-name>   # Remove process
pm2 reset <app-name>    # Reset process counters
```

## Environment Variables

Services use these production environment variables:

- `NODE_ENV=production`
- `HOST=jeffreysanford.us`
- `LOG_LEVEL=info`
- Ports: 3000 (nest), 4000 (go)

## Development Alternative

For development, use the Nx serve commands instead:

```bash
npm run start:all  # Start all services in development mode
```

This provides:

- Hot reload
- Development-optimized builds
- Source maps
- Debug logging

## 🚦 Script-Driven Service Management

All PM2 services should be started after running `system-prep.sh` and using the provided scripts:

| Script                  | Purpose                                      |
|-------------------------|----------------------------------------------|
| system-prep.sh          | System prep, memory/process cleanup, tuning  |
| memory-monitor.sh       | Live system health dashboard                 |
| deploy-all.sh           | Full build & deployment                      |
| fedramp-minor.sh        | OSCAL/FedRAMP compliance scans               |
| clean-build.sh          | Clean, reset, and build all apps             |
| truenorth-oscal-test.sh   | Validates TrueNorth OSCAL Rev5 profile/test         |

## Example: Start All Services

```bash
bash scripts/deploy-all.sh
```
