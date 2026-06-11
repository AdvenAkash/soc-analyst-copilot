#!/usr/bin/env bash
# scripts/start_ollama.sh
# Alternative: start Ollama with ROCm support

set -euo pipefail

MODEL="${OLLAMA_MODEL:-llama3.1:8b}"

echo "Pulling model $MODEL via Ollama..."
HSA_OVERRIDE_GFX_VERSION="${HSA_OVERRIDE_GFX_VERSION:-11.0.0}" \
  ollama pull "$MODEL"

echo "Starting Ollama server..."
HSA_OVERRIDE_GFX_VERSION="${HSA_OVERRIDE_GFX_VERSION:-11.0.0}" \
  OLLAMA_HOST=0.0.0.0 ollama serve &

sleep 3
ollama run "$MODEL" --keepalive 60m
