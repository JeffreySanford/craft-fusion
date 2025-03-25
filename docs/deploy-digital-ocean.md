# Craft Fusion - DigitalOcean Deployment Guide

This guide explains how to deploy Craft Fusion on a DigitalOcean Droplet using our automated scripts.

## Overview

The deployment process involves setting up a Fedora 40 Droplet with necessary components like Docker, Node.js, Go, and Nginx. Optionally, you can install AI capabilities with Ollama, a training environment, and monitoring tools.

## Available Scripts

### 1. Main Deployment Script

`deploy-digitalocean.sh` automates the setup of a new DigitalOcean droplet with the following features:

- System updates and basic utilities installation
- Component installation options:
  - Required components (Docker, Node.js, Go, Nginx)
  - AI capabilities with Ollama
  - Training environment (Python, PyTorch)
  - Monitoring tools (Prometheus, Grafana, ELK Stack)
- Environment selection (development, staging, production)
- Firewall configuration for common ports
- Nginx configuration

Usage:
```bash
./scripts/deploy-digitalocean.sh
```

### 2. Ollama Management

`ollama-manager.sh` provides a convenient interface for managing Ollama containers:

- Start, stop, restart Ollama containers
- Check Ollama status and available models
- Pull models (comma-separated list)
- View container logs

Usage:
```bash
./scripts/ollama-manager.sh {start|stop|restart|status|pull|logs} [models]

# Examples:
./scripts/ollama-manager.sh start
./scripts/ollama-manager.sh pull deepseek:latest,mistral:latest
```

### 3. Ollama Initialization

`init-ollama.sh` initializes Ollama with AI models:

- Waits for Ollama service availability
- Checks for already loaded models to avoid redundant downloads
- Loads models from environment variable or defaults

Usage:
```bash
# With default models (deepseek:latest,mistral:latest)
./scripts/init-ollama.sh

# With custom models
MODELS_TO_LOAD="llama3:latest,codellama:latest" ./scripts/init-ollama.sh
```

## Deployment Process

1. Create a new Fedora 40 Droplet on DigitalOcean
2. SSH into your droplet
3. Clone the Craft Fusion repository:
   ```bash
   git clone https://github.com/your-org/craft-fusion.git
   cd craft-fusion
   ```
4. Make scripts executable:
   ```bash
   chmod +x scripts/*.sh
   ```
5. Run the deployment script:
   ```bash
   ./scripts/deploy-digitalocean.sh
   ```
6. Follow the interactive prompts to select components and environment

## Component Details

### Required Components
- Docker and Docker Compose for containerization
- Node.js for running JavaScript applications
- Go for backend services
- Nginx for web serving and reverse proxy

### AI with Ollama
Installs and configures Ollama to run AI models locally, with default models:
- deepseek:latest
- mistral:latest

### Training Environment
Sets up Python with PyTorch and related libraries for model training:
- Python 3.11 with virtual environment
- PyTorch, Transformers, Datasets, PEFT, etc.

### Monitoring Tools
- Prometheus and Grafana for metrics
- ELK Stack (Elasticsearch, Logstash, Kibana) for logging

## Troubleshooting

If you encounter issues with the deployment:

1. Check the script logs for errors
2. Verify Docker is running: `systemctl status docker`
3. Check Ollama status: `./scripts/ollama-manager.sh status`
4. Review Nginx configuration: `nginx -t`
