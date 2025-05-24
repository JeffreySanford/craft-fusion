# Production Scripts

## Essential Deployment Scripts

### Core Deployment
- `deploy-all.sh` - **Main production deployment orchestrator**
- `deploy-backend.sh` - Backend-only deployment
- `deploy-frontend.sh` - Frontend-only deployment
- `clean-build.sh` - Build cleanup utility

### Testing & Validation
- `test-backends.sh` - API endpoint testing
- `verify-deployment.sh` - Post-deployment validation
- `nginx-test.sh` - Nginx configuration testing

### Infrastructure
- `memory-monitor.sh` - Real-time system monitoring
- `ssl-setup.sh` - SSL certificate configuration
- `wss-setup.sh` - WebSocket Secure setup
- `system-optimize.sh` - VPS optimization

## Archived Scripts

Experimental and completed scripts have been moved to `scripts/archive/`:
- `deploy-timed.sh` - Development version with progress tracking
- `deploy-low-memory.sh` - Memory optimization experiments
- `deploy-with-monitor.sh` - Combined deployment with monitoring
- `fix-pm2-permissions.sh` - One-time PM2 user setup (completed)
- `fix-ecosystem-config.sh` - One-time configuration fix (completed)

## Usage

```bash
# Full production deployment
./scripts/deploy-all.sh

# Test deployment
./scripts/test-backends.sh

# Monitor system resources
./scripts/memory-monitor.sh
```
