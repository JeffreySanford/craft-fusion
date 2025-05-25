#!/bin/bash
set -e

echo "🚀 Initializing Ollama with AI models..."

# Wait for Ollama to be ready
echo "Waiting for Ollama service to be available..."
until $(curl --output /dev/null --silent --head --fail http://localhost:11434/api/health); do
  printf '.'
  sleep 5
done

# Function to load a model
load_model() {
  local model=$1
  echo "🔄 Checking if model $model is already loaded..."
  
  # Check if model already exists
  model_exists=$(curl -s http://localhost:11434/api/tags | grep -c "$model" || true)
  
  if [ "$model_exists" -eq 0 ]; then
    echo "🔽 Downloading model $model (this may take some time)..."
    curl -X POST http://localhost:11434/api/pull -d "{\"name\":\"$model\"}"
    echo "✅ Model $model loaded successfully"
  else
    echo "✅ Model $model is already loaded"
  fi
}

# Read models to load from environment variable or use defaults
MODELS=${MODELS_TO_LOAD:-"deepseek:latest,mistral:latest"}
IFS=',' read -ra MODEL_ARRAY <<< "$MODELS"

# Load each model
for model in "${MODEL_ARRAY[@]}"; do
  load_model "$model"
done

echo "🎉 All models loaded and ready to use!"
