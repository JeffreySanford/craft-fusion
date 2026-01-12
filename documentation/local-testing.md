# Local Testing Guide for Craft Fusion

This guide covers how to test all aspects of Craft Fusion on your local development machine.

## 1. Basic Application Testing

### Start the applications separately

```bash
# Start the Angular frontend
nx serve craft-web

# Start the NestJS backend
nx serve craft-nest

# Start the Go backend
nx serve craft-go
```

### Verify services are running

- Angular: <http://localhost:4200>
- NestJS: <http://localhost:3000/api>
- Go: <http://localhost:4000/api-go>

## 2. Testing Docker Setup

Test the full Docker configuration locally:

```bash
# Build and start all services locally
docker-compose build
docker-compose up -d

# Check if all containers are running
docker-compose ps

# Check the logs
docker-compose logs -f

# Access the applications
# - Frontend: http://localhost
# - NestJS API: http://localhost/api
# - Go API: http://localhost/api/go
```

## 3. End-to-End Testing

Once all services are running:

1. Navigate to <http://localhost:4200>
2. Test authentication features
3. Test data visualization components
4. Test file uploads and processing

## 4. Monitoring Local Resources

```bash
# Monitor Docker resources
docker stats

# Check system resources
htop
```

## Project-wide Standards

- All scripts use DRY system prep via `system-prep.sh`.
- Vibrant, color-coded output is standard for all CLI tools.

Last Updated: 2026-01-08

## Troubleshooting

### Common Issues and Solutions

- **Ports already in use**: Kill the process using `kill $(lsof -t -i:<port_number>)`.
- **Angular CORS issues**: Ensure proxy configuration is properly set in your `proxy.config.json`.
- **WebSocket connection issues**: Check if the NestJS backend is running and the proxy is routing correctly.
