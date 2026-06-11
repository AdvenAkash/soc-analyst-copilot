#!/usr/bin/env bash
# scripts/start_vllm.sh
# Start vLLM server on AMD ROCm GPU

set -euo pipefail

MODEL="${VLLM_MODEL:-meta-llama/Llama-3.1-8B-Instruct}"
PORT="${VLLM_PORT:-8001}"
TENSOR_PARALLEL="${TENSOR_PARALLEL_SIZE:-1}"
GPU_MEMORY_UTIL="${GPU_MEMORY_UTILIZATION:-0.90}"

echo "Starting vLLM server..."
echo "  Model:           $MODEL"
echo "  Port:            $PORT"
echo "  Tensor Parallel: $TENSOR_PARALLEL"

export ROCR_VISIBLE_DEVICES="${ROCR_VISIBLE_DEVICES:-0}"
export HIP_VISIBLE_DEVICES="${ROCR_VISIBLE_DEVICES}"

python -m vllm.entrypoints.openai.api_server \
  --model "$MODEL" \
  --port "$PORT" \
  --dtype float16 \
  --tensor-parallel-size "$TENSOR_PARALLEL" \
  --gpu-memory-utilization "$GPU_MEMORY_UTIL" \
  --max-model-len 4096 \
  --trust-remote-code \
  --disable-log-requests
