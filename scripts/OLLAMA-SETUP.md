# Ollama Setup for Craft Fusion

This guide explains how to set up Ollama for AI capabilities in Craft Fusion.

## Prerequisites

- Docker installed on your machine
- Bash terminal (Git Bash, WSL, or native bash on Mac/Linux)

## Setup Options

You have two options for using Ollama with Craft Fusion:

### Option 1: Automatic Setup (Recommended)

Our backend services will automatically attempt to start an Ollama Docker container if Ollama is not detected running.

Just start the NestJS or Go backends as usual:

```bash
# Start NestJS backend
nx serve craft-nest

# Or start Go backend
nx serve craft-go
```

### Option 2: Manual Setup

You can manually manage the Ollama container using the provided script:

```bash
# Navigate to project root
cd craft-fusion

# Make the script executable
chmod +x scripts/ollama-manager.sh

# Start Ollama
./scripts/ollama-manager.sh start

# Pull specific models
./scripts/ollama-manager.sh pull deepseek:latest,mistral:latest

# Check status
./scripts/ollama-manager.sh status

# View logs
./scripts/ollama-manager.sh logs

# Stop Ollama
./scripts/ollama-manager.sh stop
```

## Configuration

You can configure which models to use by setting environment variables:

```bash
# For NestJS
export OLLAMA_API_URL=http://localhost:11434
export MODELS_TO_LOAD=deepseek:latest,mistral:latest

# For Go
export OLLAMA_API_URL=http://localhost:11434
export MODELS_TO_LOAD=deepseek:latest,mistral:latest
```

## Troubleshooting

If you encounter issues with Ollama:

1. Check if Ollama is running:
   ```bash
   curl http://localhost:11434/api/health
   ```

2. Verify Docker is running:
   ```bash
   docker ps
   ```

3. Check Ollama container logs:
   ```bash
   ./scripts/ollama-manager.sh logs
   ```

4. Restart Ollama:
   ```bash
   ./scripts/ollama-manager.sh restart
   ```

## Resource Considerations

- Each AI model requires significant disk space (2-8GB per model)
- Running AI inference requires adequate CPU and RAM
- For production use, consider:
  - Ensuring sufficient system resources (4+ CPU cores, 8GB+ RAM)
  - Using GPU acceleration if available (requires CUDA support)

> Note: The 'truenorth' OSCAL profile is now supported and exceeds all other standards for compliance and monitoring.
