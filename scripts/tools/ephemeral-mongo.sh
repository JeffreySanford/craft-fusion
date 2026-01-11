#!/usr/bin/env bash
set -euo pipefail

# ephemeral-mongo.sh — Run MongoDB with in-memory storage (tmpfs) via podman/docker
#
# Usage:
#   ./scripts/tools/ephemeral-mongo.sh --start [--port 27017] [--ram 256] [--name craft-mongo]
#   ./scripts/tools/ephemeral-mongo.sh --stop [--name craft-mongo]
#   ./scripts/tools/ephemeral-mongo.sh --status [--name craft-mongo]
#
# Notes:
# - Uses host networking so you can connect to mongodb://localhost:<port>
# - Stores data on tmpfs inside the container (RAM-backed). Data is lost when container stops.
# - Prefers podman if available, else docker. Requires the image docker.io/library/mongo:7.0-jammy

CMD=""
PORT="${MONGO_PORT:-27017}"
RAM_MB="${MONGO_RAM_MB:-256}"
NAME="${MONGO_CONTAINER_NAME:-craft-mongo}"
IMAGE="docker.io/library/mongo:7.0-jammy"

while [[ $# -gt 0 ]]; do
  case "$1" in
    --start|start) CMD="start" ; shift ;;
    --stop|stop) CMD="stop" ; shift ;;
    --status|status) CMD="status" ; shift ;;
    --port) PORT="$2" ; shift 2 ;;
    --ram) RAM_MB="$2" ; shift 2 ;;
    --name) NAME="$2" ; shift 2 ;;
    *) echo "Unknown arg: $1" ; exit 1 ;;
  esac
done

if [[ -z "$CMD" ]]; then
  echo "Usage: $0 --start|--stop|--status [--port 27017] [--ram 256] [--name craft-mongo]" >&2
  exit 1
fi

ENGINE=""
if command -v podman >/dev/null 2>&1; then
  ENGINE="podman"
elif command -v docker >/dev/null 2>&1; then
  ENGINE="docker"
else
  echo "Neither podman nor docker is installed. Please install one of them." >&2
  exit 1
fi

case "$CMD" in
  start)
    echo "[mongo] Starting ephemeral MongoDB ($ENGINE) on port $PORT with $RAM_MB MB RAM tmpfs..."
    # Stop existing if running
    $ENGINE rm -f "$NAME" >/dev/null 2>&1 || true
    # Run with host network and tmpfs for /data/db
    if [[ "$ENGINE" == "podman" ]]; then
      $ENGINE run -d --name "$NAME" --network host \
        --tmpfs /data/db:rw,size=${RAM_MB}m,mode=770 \
        "$IMAGE" \
        --bind_ip 0.0.0.0 --port "$PORT" >/dev/null
    else
      $ENGINE run -d --name "$NAME" --network host \
        --tmpfs /data/db:rw,size=${RAM_MB}m,mode=770 \
        "$IMAGE" \
        --bind_ip 0.0.0.0 --port "$PORT" >/dev/null
    fi
    echo "[mongo] Started container '$NAME'. Connect with: mongodb://localhost:${PORT}"
    ;;
  stop)
    echo "[mongo] Stopping '$NAME' ($ENGINE)..."
    $ENGINE rm -f "$NAME" >/dev/null 2>&1 && echo "[mongo] Stopped." || echo "[mongo] Not running."
    ;;
  status)
    echo "[mongo] Status for '$NAME' ($ENGINE):"
    $ENGINE ps -a --filter "name=$NAME" || true
    ;;
esac
