# Proxy Configuration Guide

## Overview

Angular uses a dev-server proxy to reach the NestJS and Go backends and to support WebSocket traffic during local development.

## Current configuration

File: `apps/craft-web/src/proxy.config.json`

```json
{
  "/api": {
    "target": "http://127.0.0.1:3000",
    "secure": false,
    "changeOrigin": true,
    "logLevel": "info",
    "timeout": 120000,
    "proxyTimeout": 120000
  },
  "/api-go": {
    "target": "http://127.0.0.1:4000",
    "secure": false,
    "changeOrigin": true,
    "logLevel": "debug",
    "pathRewrite": {
      "^/api-go": "/api-go"
    },
    "timeout": 120000,
    "proxyTimeout": 120000
  },
  "/socket": {
    "target": "ws://127.0.0.1:3000",
    "secure": false,
    "ws": true,
    "changeOrigin": true,
    "timeout": 120000,
    "proxyTimeout": 120000
  },
  "/assets": {
    "target": "http://127.0.0.1:3000",
    "secure": false,
    "changeOrigin": true,
    "timeout": 120000,
    "proxyTimeout": 120000
  }
}
```

## Notes

- `/api` targets the NestJS server on port 3000.
- `/api-go` targets the Go API on port 4000.
- `/socket` is used by `WebsocketService` for Socket.IO transport over the Angular dev server.
- Production proxying is handled by Apache; see `documentation/SIMPLE-DEPLOYMENT.md`.
- `craft-web:serve:production` references `apps/craft-web/src/proxy.config.prod.json`, but that file is not present.
