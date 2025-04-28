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

### Verify services are running:
- Angular: http://localhost:4200
- NestJS: http://localhost:3000/api
- Go: http://localhost:4000/api-go

## 2. Testing AI Integration Locally

### Start Ollama locally
```bash
# Navigate to project root
cd craft-fusion

# Run the Ollama manager script
chmod +x scripts/ollama-manager.sh
./scripts/ollama-manager.sh start

# Pull the required models
./scripts/ollama-manager.sh pull
```

### Test AI endpoints:
- NestJS AI health: http://localhost:3000/api/ai/health
- Go AI health: http://localhost:4000/ai/health

## 3. Testing Docker Setup

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

## 4. Testing Training Environment

```bash
# Install Python dependencies
cd apps/training
pip install -r requirements.txt

# Run a simple test using a small dataset
python finetune-mistral-lora.py --data sample-data.json --output ./test-output --epochs 1
```

## 5. End-to-End Testing

Once all services are running:

1. Navigate to http://localhost:4200
2. Test authentication features
3. Test data visualization components
4. Test AI-powered features (chat, analysis)
5. Test file uploads and processing

## 6. Monitoring Local Resources

```bash
# Monitor Docker resources
docker stats

# Check disk space for models
df -h

# Check system resources
htop
```

## Troubleshooting

### Common Issues and Solutions

- **Ports already in use**: Kill the process using `kill $(lsof -t -i:<port_number>)`
- **Ollama not responding**: Check Ollama logs with `./scripts/ollama-manager.sh logs`
- **Missing models**: Pull models manually with the script
- **Angular CORS issues**: Ensure proxy configuration is properly set in your `proxy.conf.json`