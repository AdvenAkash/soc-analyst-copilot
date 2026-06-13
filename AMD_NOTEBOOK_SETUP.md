# AMD Notebook Setup Guide

> Deployment on **notebooks.amd.com** (MI300X GPU).

---

## Recommended: One-Command Startup

The `start.sh` script handles everything automatically — installs dependencies,
starts all 3 services in order, and auto-detects your session ID.

```bash
cd /workspace/shared/soc-analyst-copilot
git fetch origin && git reset --hard origin/main
chmod +x start.sh
./start.sh
```

That's it. When it's done you'll see:

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  ✅  All services running!
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  Open in browser:
  https://notebooks.amd.com/<SESSION-ID>/proxy/5173/

  API health:
  https://notebooks.amd.com/<SESSION-ID>/proxy/8000/api/health

  Press Ctrl+C to stop everything.
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

Press **Ctrl+C** to shut down all 3 services at once.

> **Session ID changes every restart.** `start.sh` reads it automatically from
> `JUPYTERHUB_SERVICE_PREFIX`. If auto-detect fails, pass it manually:
> ```bash
> ./start.sh jupyter-hack-team-2652-260613175451-954badf8
> ```

---

## What start.sh Does (in order)

| Step | Action |
|------|--------|
| 1 | `git fetch origin && git reset --hard origin/main` |
| 2 | Install `zstd` + Node.js 20 via NodeSource (skips if already installed) |
| 3 | Start Ollama in background, wait for `http://localhost:11434` to respond |
| 4 | Write `backend/.env`, `pip install -e .`, start uvicorn on `:8000` |
| 5 | Build frontend with correct `VITE_BASE_PATH` + `VITE_API_BASE_URL` |
| 6 | `cd dist && python3 -m http.server 5173` (foreground — keeps script alive) |

Logs: **Ollama** → `/tmp/ollama.log` · **Backend** → `/tmp/backend.log`

---

## Every New Session (frontend rebuild only)

If you only need to rebuild the frontend for a new session ID without
restarting everything:

```bash
cd /workspace/shared/soc-analyst-copilot/frontend

VITE_BASE_PATH=/<NEW-SESSION-ID>/proxy/5173/ \
VITE_API_BASE_URL=https://notebooks.amd.com/<NEW-SESSION-ID>/proxy/8000 \
npm run build

cd dist
python3 -m http.server 5173 --bind 0.0.0.0
```

Node.js persists in the container so you do **not** need to reinstall it.

---

## Manual Setup (Fallback — 3 Terminals)

Use this if `start.sh` fails for any reason.

### Terminal 1 — Ollama

```bash
apt-get update
apt-get install -y zstd
cd /workspace/shared/soc-analyst-copilot
chmod +x scripts/start_ollama.sh
./scripts/start_ollama.sh
```

Wait for:
```
✓ Ollama running at http://localhost:11434
✓ Model: llama3.1:8b
```

### Terminal 2 — Backend

```bash
cd /workspace/shared/soc-analyst-copilot
git fetch origin && git reset --hard origin/main

cat > backend/.env << 'EOF'
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

cd backend
pip install -e .
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

Verify:
```bash
curl -s http://localhost:8000/api/health
# {"status":"ok","llm_backend":"ollama","model":"llama3.1:8b"}
```

### Terminal 3 — Frontend

```bash
# Install Node.js if missing
apt-get install -y curl
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt-get install -y nodejs

cd /workspace/shared/soc-analyst-copilot/frontend
npm install

VITE_BASE_PATH=/<YOUR-SESSION-ID>/proxy/5173/ \
VITE_API_BASE_URL=https://notebooks.amd.com/<YOUR-SESSION-ID>/proxy/8000 \
npm run build

cd dist
python3 -m http.server 5173 --bind 0.0.0.0
```

Open: `https://notebooks.amd.com/<YOUR-SESSION-ID>/proxy/5173/`

---

## Troubleshooting

| Problem | Cause | Fix |
|---------|-------|-----|
| `E: Unable to locate package zstd` | Stale apt package index | `apt-get update` then retry — `start.sh` does this automatically |
| `E: Unable to locate package nodejs` | Default apt repo has no Node | `start.sh` uses NodeSource automatically |
| Blank page in browser | Wrong session ID in build | Rebuild with correct `VITE_BASE_PATH` |
| Run Analysis does nothing | Wrong `VITE_API_BASE_URL` at build | Rebuild with correct `VITE_API_BASE_URL` |
| `{"status":"ok"}` but agents fail | Ollama not running or wrong model | Check `/tmp/ollama.log`, restart Ollama |
| `HSA_STATUS_ERROR_INVALID_ISA` | Wrong GFX version | `start_ollama.sh` sets `9.4.2` automatically |
| Stale LLM config | `lru_cache` holds old service | Restart uvicorn (Ctrl+C then re-run) |
| `git pull` fails (local changes) | Server has modified files | `git fetch origin && git reset --hard origin/main` |
| `git reset` permission error | Stale lock file | `rm -f .git/index.lock` then retry |

---

## AMD GPU GFX Version Reference

| GPU | `HSA_OVERRIDE_GFX_VERSION` |
|-----|---------------------------|
| AMD MI300X (notebooks.amd.com) | `9.4.2` |
| AMD MI250X | `9.0.10` |
| AMD RX 7000 series (RDNA3) | `11.0.0` |
| AMD RX 6000 series (RDNA2) | `10.3.0` |
