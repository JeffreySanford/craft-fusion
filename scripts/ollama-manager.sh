#!/bin/bash
set -e

SCRIPT_DIR=$(dirname "$0")
DOCKER_COMPOSE_FILE="${SCRIPT_DIR}/../docker-compose.ollama.yml"
ACTION=$1
MODELS=${2:-"deepseek:latest,mistral:latest"}

echo "🧠 Ollama Manager Script"
echo "========================="

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
  echo "❌ Docker is not installed. Please install Docker first."
  exit 1
fi

# Check if Docker Compose is installed
if ! command -v docker compose &> /dev/null && ! command -v docker-compose &> /dev/null; then
  echo "❌ Docker Compose is not installed. Please install Docker Compose first."
  exit 1
fi

# Function to use appropriate docker compose command
docker_compose() {
  if command -v docker compose &> /dev/null; then
    docker compose -f "$DOCKER_COMPOSE_FILE" "$@"
  else
    docker-compose -f "$DOCKER_COMPOSE_FILE" "$@"
  fi
}

start_ollama() {
  echo "🚀 Starting Ollama container..."
  docker_compose up -d
  
  # Wait for Ollama to be ready
  echo "⏳ Waiting for Ollama to start..."
  until $(curl --output /dev/null --silent --head --fail http://localhost:11434/api/health); do
    printf '.'
    sleep 2
  done
  echo -e "\n✅ Ollama is running!"
}

stop_ollama() {
  echo "🛑 Stopping Ollama container..."
  docker_compose down
  echo "✅ Ollama stopped"
}

restart_ollama() {
  stop_ollama
  start_ollama
}

status_ollama() {
  if $(curl --output /dev/null --silent --head --fail http://localhost:11434/api/health); then
    echo "✅ Ollama is running"
    echo "🔍 Available models:"
    curl -s http://localhost:11434/api/tags | jq -r '.models[] | "  - " + .name' 2>/dev/null || echo "  - Failed to fetch models list"
  else
    echo "❌ Ollama is not running"
  fi
}

pull_models() {
  if ! $(curl --output /dev/null --silent --head --fail http://localhost:11434/api/health); then
    echo "❌ Ollama is not running. Starting Ollama first..."
    start_ollama
  fi
  
  IFS=',' read -ra MODEL_ARRAY <<< "$MODELS"
  
  for model in "${MODEL_ARRAY[@]}"; do
    echo "🔽 Pulling model $model..."
    curl -X POST http://localhost:11434/api/pull -d "{\"name\":\"$model\"}"
    echo -e "\n✅ Model $model pulled successfully"
  done
}

logs_ollama() {
  echo "📜 Showing Ollama logs..."
  docker_compose logs -f
}

case "$ACTION" in
  start)
    start_ollama
    ;;
  stop)
    stop_ollama
    ;;
  restart)
    restart_ollama
    ;;
  status)
    status_ollama
    ;;
  pull)
    pull_models
    ;;
  logs)
    logs_ollama
    ;;
  *)
    echo "Usage: $0 {start|stop|restart|status|pull|logs} [models]"
    echo ""
    echo "Commands:"
    echo "  start   - Start Ollama container"
    echo "  stop    - Stop Ollama container"
    echo "  restart - Restart Ollama container"
    echo "  status  - Check Ollama status and available models"
    echo "  pull    - Pull models (comma-separated list)"
    echo "  logs    - Show Ollama container logs"
    echo ""
    echo "Examples:"
    echo "  $0 start"
    echo "  $0 pull deepseek:latest,mistral:latest"
    exit 1
    ;;
esac

exit 0
