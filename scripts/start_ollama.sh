#!/usr/bin/env bash
# scripts/start_ollama.sh
# Start Ollama with ROCm support and keep the model loaded

set -euo pipefail

MODEL="${OLLAMA_MODEL:-llama3.1:8b}"
# GFX version by GPU family:
#   AMD MI300X (notebooks.amd.com) → 9.4.2
#   AMD MI250X                     → 9.0.10
#   AMD RX 7000 (RDNA3 consumer)   → 11.0.0
#   AMD RX 6000 (RDNA2 consumer)   → 10.3.0
HSA_VERSION="${HSA_OVERRIDE_GFX_VERSION:-9.4.2}"

# Check ollama is installed
if ! command -v ollama &>/dev/null; then
  echo "Ollama not found. Installing..."
  curl -fsSL https://ollama.ai/install.sh | sh
fi

# Start the server in background (idempotent — safe to call if already running)
echo "Starting Ollama server..."
HSA_OVERRIDE_GFX_VERSION="$HSA_VERSION" \
  OLLAMA_HOST=0.0.0.0 \
  OLLAMA_KEEP_ALIVE=60m \
  ollama serve &

SERVER_PID=$!

# Wait for server to be ready
echo "Waiting for server..."
for i in $(seq 1 15); do
  if curl -sf http://localhost:11434/api/tags >/dev/null 2>&1; then
    echo "Server is up."
    break
  fi
  sleep 1
done

# Pull the model if not already present
echo "Pulling model $MODEL (skipped if already cached)..."
HSA_OVERRIDE_GFX_VERSION="$HSA_VERSION" ollama pull "$MODEL"

echo ""
echo "✓ Ollama running at http://localhost:11434"
echo "✓ Model: $MODEL"
echo "  Backend config: LLM_BACKEND=ollama in backend/.env"
echo ""
echo "Press Ctrl+C to stop."
wait $SERVER_PID
