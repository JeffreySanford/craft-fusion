# PM2 Usage Guide

This document explains how to use PM2 with the enhanced `ecosystem.config.js` configuration for both development and production environments.

## Overview

The ecosystem configuration now supports both development and production workflows:

- **Development**: Uses Nx serve commands with hot reload and file watching
- **Production**: Uses built artifacts with clustering and optimizations

## Development Usage

### Start all services in development mode:
```bash
npm run pm2:dev
```

This will start:
- `craft-nest-api`: NestJS API with hot reload
- `craft-go-api`: Go API with file watching  
- `craft-web-dev`: Angular frontend with live reload

### Monitor services:
```bash
npm run pm2:dev:logs     # View logs from all services
npm run pm2:dev:monitor  # Interactive monitoring dashboard
```

### Stop services:
```bash
npm run pm2:dev:stop
```

### Restart services:
```bash
npm run pm2:dev:restart
```

## Production Usage

### Build applications first:
```bash
npm run pm2:build
```

### Start in production mode:
```bash
npm run pm2:prod
```

This will start:
- `craft-nest-api`: Clustered NestJS API from built files
- `craft-go-api`: Go binary with production settings

### Stop production services:
```bash
npm run pm2:prod:stop
```

### Restart production services:
```bash
npm run pm2:prod:restart
```

## Direct PM2 Commands

You can also use PM2 directly:

```bash
# Development
NODE_ENV=development pm2 start ecosystem.config.js
pm2 logs craft-nest-api
pm2 restart craft-nest-api

# Production  
NODE_ENV=production pm2 start ecosystem.config.js --env production
pm2 save  # Save PM2 configuration
pm2 startup  # Auto-start on system boot
```

## Key Features

### Development Mode Features:
- **Hot Reload**: Files are watched and services restart automatically
- **Source Maps**: Better debugging with source map support
- **Nx Integration**: Uses Nx serve commands for optimal development experience
- **Frontend Included**: Angular app runs alongside APIs

### Production Mode Features:
- **Clustering**: NestJS runs in cluster mode for better performance
- **Optimized Builds**: Uses production-optimized builds
- **Process Management**: Better memory limits and restart policies
- **Deployment Ready**: Includes deployment configuration

### Shared Features:
- **Logging**: Structured logging to files with timestamps
- **Memory Management**: Automatic restart on memory limits
- **Graceful Shutdown**: Proper process termination
- **Health Monitoring**: Process monitoring and auto-restart

## Troubleshooting

### Common Issues:

1. **Port conflicts**: Make sure ports 3000, 4000, and 4200 are available
2. **Build failures**: Run `npm run pm2:build` before production mode
3. **Permission issues**: Ensure log directories exist and are writable
4. **Go binary**: Make sure Go app builds correctly for your platform

### Useful Commands:

```bash
pm2 list                 # Show all processes
pm2 describe <app-name>  # Detailed process info
pm2 flush               # Clear all logs
pm2 reload <app-name>   # Zero-downtime restart
pm2 delete <app-name>   # Remove process
```

## Environment Variables

The configuration respects these environment variables:

- `NODE_ENV`: Determines development vs production mode
- `PORT`: Override default ports (3000 for nest, 4000 for go, 4200 for web)
- `HOST`: Override default hosts
- `LOG_LEVEL`: Set logging verbosity

Example:
```bash
NODE_ENV=development PORT=3001 npm run pm2:dev
```
