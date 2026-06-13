# AMD Notebook Setup Guide

> Step-by-step deployment on **notebooks.amd.com** (MI300X GPU).  
> You need **3 separate terminals** — one for each service.

---

## Before You Start

1. Open **https://notebooks.amd.com** and start your instance.
2. Note your **session ID** from the URL — it looks like:  
   `jupyter-hack-team-2652-260613175451-954badf8`  
   You will substitute it wherever you see `<YOUR-SESSION-ID>` below.
3. Open 3 terminals in JupyterLab (**File → New → Terminal**).

---

## Terminal 1 — Ollama (LLM)

Run this terminal first. Ollama must be running before the backend starts.

```bash
# Install zstd (required by Ollama installer)
apt-get install -y zstd

# Pull and start Ollama with MI300X GFX fix + download llama3.1:8b
cd /workspace/shared/soc-analyst-copilot
chmod +x scripts/start_ollama.sh
./scripts/start_ollama.sh
```

**What it does:** installs Ollama, sets `HSA_OVERRIDE_GFX_VERSION=9.4.2` for MI300X, pulls `llama3.1:8b`, and starts the server on `http://localhost:11434`.

Wait until you see:
```
✓ Ollama running at http://localhost:11434
✓ Model: llama3.1:8b
```

---

## Terminal 2 — Backend (FastAPI)

```bash
# Pull latest code
cd /workspace/shared/soc-analyst-copilot
git fetch origin && git reset --hard origin/main

# Write the .env config
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

# Install backend dependencies
cd backend
pip install -e .

# Start the API server
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

Verify it's working:
```bash
curl -s http://localhost:8000/api/health
# Expected: {"status":"ok","llm_backend":"ollama","model":"llama3.1:8b"}
```

---

## Terminal 3 — Frontend (React)

```bash
# Install Node.js (apt repo doesn't have it — use NodeSource)
apt-get install -y curl
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt-get install -y nodejs

# Pull latest code (if not done already)
cd /workspace/shared/soc-analyst-copilot
git fetch origin && git reset --hard origin/main

# Build the frontend
# ⚠️  Replace <YOUR-SESSION-ID> with your actual JupyterHub session ID
cd frontend
npm install
VITE_BASE_PATH=/<YOUR-SESSION-ID>/proxy/5173/ \
VITE_API_BASE_URL=https://notebooks.amd.com/<YOUR-SESSION-ID>/proxy/8000 \
npm run build

# Serve the built files on port 5173
cd dist
python3 -m http.server 5173 --bind 0.0.0.0
```

**Example** with a real session ID:
```bash
VITE_BASE_PATH=/jupyter-hack-team-2652-260613175451-954badf8/proxy/5173/ \
VITE_API_BASE_URL=https://notebooks.amd.com/jupyter-hack-team-2652-260613175451-954badf8/proxy/8000 \
npm run build
```

---

## Open the App

Once all 3 terminals are running, open:

```
https://notebooks.amd.com/<YOUR-SESSION-ID>/proxy/5173/
```

Example:
```
https://notebooks.amd.com/jupyter-hack-team-2652-260613175451-954badf8/proxy/5173/
```

Click **Run Analysis** — you should see the 4 agent cards animate as the pipeline runs.

---

## Every New Session

The JupyterHub session ID **changes every time** you restart your instance. You must rebuild the frontend with the new ID:

```bash
# In Terminal 3
cd /workspace/shared/soc-analyst-copilot/frontend

VITE_BASE_PATH=/<NEW-SESSION-ID>/proxy/5173/ \
VITE_API_BASE_URL=https://notebooks.amd.com/<NEW-SESSION-ID>/proxy/8000 \
npm run build

cd dist
python3 -m http.server 5173 --bind 0.0.0.0
```

Node.js persists in the container so you do **not** need to reinstall it each time.

---

## Troubleshooting

| Problem | Cause | Fix |
|---------|-------|-----|
| `E: Unable to locate package nodejs` | Default apt repo has no Node | Use NodeSource install above |
| Blank page in browser | Wrong session ID in build | Rebuild with correct `VITE_BASE_PATH` |
| Run Analysis does nothing | Old `dist/` or wrong API URL | Rebuild with correct `VITE_API_BASE_URL` |
| `HSA_STATUS_ERROR_INVALID_ISA` | Wrong GFX version | `start_ollama.sh` sets `9.4.2` automatically |
| `git reset` fails / permission error | Stale lock file | `rm -f .git/index.lock` then retry |
| Stale LLM config | `lru_cache` holds old service | Restart uvicorn (Ctrl+C then re-run) |
| `git pull` error: local changes | Server has modified files | `git fetch origin && git reset --hard origin/main` |

---

## AMD GPU GFX Version Reference

| GPU | `HSA_OVERRIDE_GFX_VERSION` |
|-----|---------------------------|
| AMD MI300X (notebooks.amd.com) | `9.4.2` |
| AMD MI250X | `9.0.10` |
| AMD RX 7000 series (RDNA3) | `11.0.0` |
| AMD RX 6000 series (RDNA2) | `10.3.0` |
