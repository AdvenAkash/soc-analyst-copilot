#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────
#  SOC Analyst Copilot — one-command startup
#  Usage:
#    ./start.sh                    # auto-detects session ID
#    ./start.sh <YOUR-SESSION-ID>  # pass it manually
# ─────────────────────────────────────────────────────────────

set -euo pipefail

REPO="/workspace/shared/soc-analyst-copilot"

# ── Colours ──────────────────────────────────────────────────
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
CYAN='\033[0;36m'
NC='\033[0m'

log()  { echo -e "${BLUE}[•]${NC} $*"; }
ok()   { echo -e "${GREEN}[✓]${NC} $*"; }
warn() { echo -e "${YELLOW}[!]${NC} $*"; }
die()  { echo -e "${RED}[✗]${NC} $*"; exit 1; }

# ── Session ID ───────────────────────────────────────────────
# JupyterHub sets JUPYTERHUB_SERVICE_PREFIX = "/jupyter-hack-.../",
# so we strip the slashes to get the bare session ID.
SESSION_ID="${1:-}"

if [[ -z "$SESSION_ID" && -n "${JUPYTERHUB_SERVICE_PREFIX:-}" ]]; then
  SESSION_ID=$(echo "$JUPYTERHUB_SERVICE_PREFIX" | tr -d '/')
fi

if [[ -z "$SESSION_ID" ]]; then
  die "Could not detect session ID.\nRun: ./start.sh jupyter-hack-team-XXXX-XXXX"
fi

FRONTEND_URL="https://notebooks.amd.com/${SESSION_ID}/proxy/5173/"
BACKEND_URL="https://notebooks.amd.com/${SESSION_ID}/proxy/8000"

echo ""
echo -e "${CYAN}  SOC Analyst Copilot — Starting up${NC}"
echo -e "${CYAN}  Session: ${SESSION_ID}${NC}"
echo ""

# ── Track PIDs for clean shutdown ────────────────────────────
PIDS=()
cleanup() {
  echo ""
  warn "Shutting down all services…"
  for pid in "${PIDS[@]:-}"; do
    kill "$pid" 2>/dev/null || true
  done
  ok "Done."
}
trap cleanup EXIT INT TERM

# ─────────────────────────────────────────────────────────────
# STEP 1 — Pull latest code
# ─────────────────────────────────────────────────────────────
log "Pulling latest code from GitHub…"
cd "$REPO"
git fetch origin
git reset --hard origin/main
ok "Code up to date."

# ─────────────────────────────────────────────────────────────
# STEP 2 — System dependencies
# ─────────────────────────────────────────────────────────────
log "Checking system dependencies…"

if ! command -v zstd &>/dev/null || ! command -v node &>/dev/null; then
  log "Updating apt package index…"
  apt-get update -qq
fi

if ! command -v zstd &>/dev/null; then
  log "Installing zstd…"
  apt-get install -y zstd -qq
fi

if ! command -v node &>/dev/null; then
  log "Installing Node.js 20 via NodeSource…"
  apt-get install -y curl -qq
  curl -fsSL https://deb.nodesource.com/setup_20.x | bash - >/dev/null 2>&1
  apt-get install -y nodejs -qq
fi

ok "node $(node --version)  |  npm $(npm --version)  |  zstd $(zstd --version | head -1)"

# ─────────────────────────────────────────────────────────────
# STEP 3 — Ollama
# ─────────────────────────────────────────────────────────────
log "Checking Ollama…"

if curl -sf http://localhost:11434 &>/dev/null; then
  ok "Ollama already running."
else
  log "Starting Ollama (this may take a few minutes on first run)…"
  chmod +x "$REPO/scripts/start_ollama.sh"
  # Run in background; redirect noisy output to a log file
  "$REPO/scripts/start_ollama.sh" > /tmp/ollama.log 2>&1 &
  PIDS+=($!)

  echo -n "  Waiting for Ollama"
  for i in $(seq 1 60); do
    if curl -sf http://localhost:11434 &>/dev/null; then
      echo ""
      break
    fi
    echo -n "."
    sleep 3
  done

  curl -sf http://localhost:11434 &>/dev/null || die "Ollama did not start. Check /tmp/ollama.log"
  ok "Ollama is up."
fi

# ─────────────────────────────────────────────────────────────
# STEP 4 — Backend
# ─────────────────────────────────────────────────────────────
log "Configuring backend…"

cat > "$REPO/backend/.env" << 'EOF'
LLM_BACKEND=ollama
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_MODEL=llama3.1:8b
OLLAMA_TIMEOUT_SECONDS=120
VLLM_BASE_URL=http://localhost:8001/v1
VLLM_MODEL=meta-llama/Llama-3.1-8B-Instruct
VLLM_API_KEY=EMPTY
VLLM_TIMEOUT_SECONDS=120
API_HOST=0.0.0.0
API_PORT=8000
CORS_ORIGINS=https://notebooks.amd.com
LLM_TEMPERATURE=0.1
LLM_MAX_TOKENS=1500
EOF

log "Installing backend Python packages…"
cd "$REPO/backend"
pip install -e . -q

log "Starting FastAPI backend on port 8000…"
uvicorn app.main:app --host 0.0.0.0 --port 8000 > /tmp/backend.log 2>&1 &
PIDS+=($!)

echo -n "  Waiting for backend"
for i in $(seq 1 20); do
  if curl -sf http://localhost:8000/api/health &>/dev/null; then
    echo ""
    break
  fi
  echo -n "."
  sleep 2
done

curl -sf http://localhost:8000/api/health &>/dev/null || die "Backend did not start. Check /tmp/backend.log"
ok "Backend is up — $(curl -s http://localhost:8000/api/health)"

# ─────────────────────────────────────────────────────────────
# STEP 5 — Frontend build
# ─────────────────────────────────────────────────────────────
log "Building frontend (session ID: ${SESSION_ID})…"
cd "$REPO/frontend"
npm install --silent

VITE_BASE_PATH="/${SESSION_ID}/proxy/5173/" \
VITE_API_BASE_URL="${BACKEND_URL}" \
npm run build

ok "Frontend built."

# ─────────────────────────────────────────────────────────────
# STEP 6 — Serve frontend
# ─────────────────────────────────────────────────────────────
log "Starting frontend server on port 5173…"
cd "$REPO/frontend/dist"

echo ""
echo -e "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo -e "${GREEN}  ✅  All services running!${NC}"
echo -e "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo -e "  ${CYAN}Open in browser:${NC}"
echo -e "  ${FRONTEND_URL}"
echo ""
echo -e "  ${CYAN}API health:${NC}"
echo -e "  ${BACKEND_URL}/api/health"
echo ""
echo -e "  ${CYAN}Logs:${NC}"
echo -e "  Ollama  → /tmp/ollama.log"
echo -e "  Backend → /tmp/backend.log"
echo ""
echo -e "  Press ${YELLOW}Ctrl+C${NC} to stop everything."
echo -e "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

python3 -m http.server 5173 --bind 0.0.0.0
