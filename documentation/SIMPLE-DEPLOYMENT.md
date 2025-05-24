# Simple Production Deployment Guide

## Overview
This guide provides a simplified approach to deploying both the NestJS and Go APIs using PM2 without clustering complexities.

## Quick Start

### 1. Build Applications
```bash
npm run pm2:build
```

### 2. Start PM2 Services
```bash
npm run pm2:start
```

### 3. Monitor Services
```bash
npm run pm2:logs     # View logs
npm run pm2:monitor  # Interactive dashboard
```

## Configuration Details

The simplified `ecosystem.config.js` configuration:
- **No Clustering**: Both apps run in single instances with `fork` mode
- **Simple Restart Logic**: 10s minimum uptime, max 10 restarts, 4s delay between restarts
- **Reliable Logging**: Structured logs with timestamps to `./logs/` directory
- **Memory Management**: 1GB memory limit with auto-restart

## Service Endpoints

- **NestJS API**: `jeffreysanford.us:3000`
- **Go API**: `jeffreysanford.us:4000`

## Troubleshooting

### If PM2 fails to start services:

1. **Check builds exist:**
   ```bash
   ls -la dist/apps/craft-nest/main.js
   ls -la dist/apps/craft-go/main
   ```

2. **Test applications manually:**
   ```bash
   # Test NestJS
   cd dist/apps/craft-nest && node main.js
   
   # Test Go (in another terminal)
   cd dist/apps/craft-go && ./main
   ```

3. **Check PM2 status:**
   ```bash
   pm2 list
   pm2 describe craft-nest-api
   pm2 describe craft-go-api
   ```

4. **View detailed logs:**
   ```bash
   pm2 logs craft-nest-api --lines 50
   pm2 logs craft-go-api --lines 50
   ```

### Common Issues:

1. **Port conflicts**: Make sure ports 3000 and 4000 are available
2. **Missing builds**: Run `npm run pm2:build` before starting
3. **Permission issues**: Ensure log directories are writable
4. **Go binary**: Verify the Go app builds correctly for your target platform

### Emergency Fallback:

If PM2 continues to have issues, you can run the services directly:

```bash
# Terminal 1: NestJS
cd dist/apps/craft-nest
NODE_ENV=production PORT=3000 HOST=jeffreysanford.us node main.js

# Terminal 2: Go API  
cd dist/apps/craft-go
NODE_ENV=production PORT=4000 HOST=jeffreysanford.us ./main
```

## Useful Commands

```bash
pm2 start ecosystem.config.js    # Start all services
pm2 stop all                     # Stop all services
pm2 restart all                  # Restart all services
pm2 reload all                   # Zero-downtime restart
pm2 delete all                   # Remove all services
pm2 save                         # Save current PM2 setup
pm2 startup                      # Setup auto-start on boot
```

## Environment Variables

The configuration uses these environment variables:
- `NODE_ENV=production`
- `PORT=3000` (NestJS) / `PORT=4000` (Go)
- `HOST=jeffreysanford.us`
- `LOG_LEVEL=info`

You can override these by setting them before starting PM2:
```bash
PORT=3001 npm run pm2:start
```
