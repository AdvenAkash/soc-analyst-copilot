# SOC Analyst Copilot — Getting Started Guide

## What This Is

An AI-powered Security Operations Center (SOC) dashboard that processes 500+ SIEM alerts through a 4-agent AI pipeline running locally on your machine. No cloud API keys required — it runs entirely on your hardware via AMD ROCm + vLLM or Ollama.

---

## Environments

This project has been tested and confirmed working on:

| Environment | Status | Notes |
|-------------|--------|-------|
| **AMD notebooks.amd.com JupyterHub** | ✅ Working | Use JupyterHub deploy section below |
| Local Linux / WSL | ✅ Working | Standard steps |
| Local Windows | ✅ Working | Use PowerShell |
| Docker | ✅ Working | See docker-compose.yml |

---

## Prerequisites

### Hardware
- AMD GPU with ROCm ≥ 6.0 **OR** any machine for Ollama fallback
- Minimum 8 GB VRAM for Llama 3.1 8B (16 GB recommended)
- 16 GB system RAM

### Software
| Tool | Version | Install |
|------|---------|---------|
| Python | ≥ 3.11 | [python.org](https://python.org) |
| Node.js | ≥ 18 | [nodejs.org](https://nodejs.org) |
| ROCm | ≥ 6.0 | [AMD ROCm docs](https://rocm.docs.amd.com) |
| vLLM | ≥ 0.5.0 | `pip install vllm` (ROCm wheel) |
| Ollama | latest | [ollama.ai](https://ollama.ai) (alternative) |

---

## Step 1 — Clone the Project

```bash
git clone https://github.com/AdvenAkash/soc-analyst-copilot.git
cd soc-analyst-copilot
```

Project structure at a glance:
```
soc-copilot/
├── scripts/          ← LLM server startup scripts
├── backend/          ← FastAPI Python backend
│   ├── app/
│   │   ├── agents/   ← 4 AI pipeline agents
│   │   ├── api/      ← REST routes + SSE streaming
│   │   ├── schemas/  ← Pydantic data models
│   │   ├── services/ ← LLM abstraction layer
│   │   └── utils/    ← JSON parser helpers
│   └── pyproject.toml
└── frontend/         ← React 18 + Vite 5 dashboard
    └── src/
        ├── components/  ← UI components
        ├── constants/   ← Design tokens + sample data
        ├── hooks/       ← useAnalysis, useScrollFeed
        └── services/    ← SSE stream client
```

---

## Step 2 — Install Node.js (if not installed)

### On Ubuntu / Debian / JupyterHub containers:
```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt-get install -y nodejs

# Verify
node --version   # should print v20.x.x
npm --version    # should print 10.x.x
```

If `curl` is missing first:
```bash
apt-get update && apt-get install -y curl
```

### Via nvm (works without root):
```bash
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash
source ~/.bashrc
nvm install 20
nvm use 20
```

---

## Step 3 — Start the LLM Server

### Option A: vLLM on AMD ROCm (Recommended)

```bash
chmod +x scripts/start_vllm.sh
./scripts/start_vllm.sh
```

This starts an OpenAI-compatible server at `http://localhost:8001/v1`.

**Environment variables you can override:**
```bash
VLLM_MODEL=meta-llama/Llama-3.1-8B-Instruct   # any HuggingFace model
VLLM_PORT=8001
TENSOR_PARALLEL_SIZE=1                          # increase for multi-GPU
GPU_MEMORY_UTILIZATION=0.90
ROCR_VISIBLE_DEVICES=0                          # GPU index
```

> **First run** downloads the model (~16 GB). Subsequent starts are fast.

### Option B: Ollama (No ROCm Required)

```bash
chmod +x scripts/start_ollama.sh
./scripts/start_ollama.sh
```

Then set in `backend/.env`:
```ini
LLM_BACKEND=ollama
OLLAMA_MODEL=llama3.1:8b
```

### Option C: Skip LLM entirely (Demo Mode)

No LLM needed — all 4 agents have hardcoded fallback results that activate automatically. Just start the backend and frontend and click Run.

---

## Step 4 — Configure and Start the Backend

```bash
cd backend
cp .env.example .env
```

Open `.env` and verify:
```ini
LLM_BACKEND=vllm                                    # or "ollama"
VLLM_BASE_URL=http://localhost:8001/v1
VLLM_MODEL=meta-llama/Llama-3.1-8B-Instruct
CORS_ORIGINS=http://localhost:5173
```

Install and run:
```bash
pip install -e .
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

Verify:
```bash
curl http://localhost:8000/api/health
# → {"status":"ok","llm_backend":"vllm","model":"meta-llama/..."}
```

---

## Step 5 — Build and Run the Frontend

### Local development (standard)

```bash
cd frontend
npm install
npm run dev
```

Visit **http://localhost:5173**

---

## Step 5b — JupyterHub Deploy (AMD notebooks.amd.com)

This is the confirmed working method for `notebooks.amd.com`.

### 0. Pull latest code

```bash
cd /workspace/shared/soc-analyst-copilot
git fetch origin && git reset --hard origin/main
```

### 1. Install Node.js in the container

```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt-get install -y nodejs
```

### 2. Install dependencies

```bash
cd /workspace/shared/soc-analyst-copilot/frontend
npm install
```

### 3. Start Ollama (AMD MI300X — GFX fix required)

```bash
# The script sets HSA_OVERRIDE_GFX_VERSION=9.4.2 for MI300X automatically
chmod +x /workspace/shared/soc-analyst-copilot/scripts/start_ollama.sh
/workspace/shared/soc-analyst-copilot/scripts/start_ollama.sh &
```

> **Why 9.4.2?** AMD MI300X uses gfx942. Ollama's default ISA check fails unless you override.
> See GPU GFX version table in ARCHITECTURE.md.

Verify it works:
```bash
curl http://localhost:11434/api/chat -d '{"model":"llama3.1:8b","messages":[{"role":"user","content":"hi"}],"stream":false}'
# Should return a JSON response with "message.content"
```

### 4. Build with your JupyterHub base path — for port 8000 (single-port)

Replace `jupyter-<your-id>` with your actual container ID from the URL:

```bash
# Your container ID is in the URL:
# https://notebooks.amd.com/jupyter-<YOUR-ID>/lab/...

VITE_BASE_PATH=/jupyter-<YOUR-ID>/proxy/5173/ npm run build
```

**Example** (the ID used during development):
```bash
VITE_BASE_PATH=/jupyter-hack-team-2652-260611211844-791ed408/proxy/5173/ npm run build
```

### 5. Start the backend (serves frontend + API on same port)

```bash
cd /workspace/shared/soc-analyst-copilot/backend
cp .env.example .env
# Edit .env: set LLM_BACKEND=ollama and CORS_ORIGINS=https://notebooks.amd.com
pip install -e .
uvicorn app.main:app --host 0.0.0.0 --port 8000
```

FastAPI automatically serves the built frontend from `frontend/dist/` — no separate Python server needed.

### 6. Open in browser

```
https://notebooks.amd.com/jupyter-<YOUR-ID>/proxy/8000/
```

> **Trailing slash matters.** `...8000/` works, `...8000` may not.

> **Why port 8000 not 5173?** Backend and frontend now run on the same port. FastAPI serves the static files. This eliminates all cross-origin proxy issues.

### Finding your container ID

Look at your JupyterLab URL:
```
https://notebooks.amd.com/jupyter-hack-team-XXXX-XXXXXXXXXX-XXXXXXXX/lab/tree/...
                           ↑ everything between .com/ and /lab is your ID
```

### Backend CORS for JupyterHub

Update `backend/.env` to allow the JupyterHub origin:
```ini
CORS_ORIGINS=https://notebooks.amd.com
```

Then restart the backend.

---

## Step 6 — Run Your First Analysis

1. Open the dashboard URL
2. Click **"Run AI Pipeline"**
3. Watch 4 agents process in real time:
   - **Triage Agent** — groups alerts into incidents, dismisses false positives
   - **Threat Intel Agent** — maps MITRE ATT&CK techniques, identifies IOCs
   - **Investigation Agent** — reconstructs the attack kill-chain timeline
   - **Playbook Agent** — generates prioritized remediation steps
4. Click any incident card to view the full investigation report

---

## Providing Your Own Alert Data

### Method 1 — Edit the sample alerts file

Open `frontend/src/constants/alerts.js` and add to `SAMPLE_ALERTS`:

```js
{
  id:     "A021",
  time:   "10:15:44",
  sev:    "HIGH",          // CRITICAL | HIGH | MEDIUM | LOW
  rule:   "Ransomware IOC Detected",
  src:    "10.0.3.22",
  dst:    "10.0.1.0/24",
  detail: "Known ransomware hash matched on ENDPOINT-07",
  host:   "ENDPOINT-07"
}
```

### Method 2 — Upload a JSON file

Add this to `App.jsx` next to the Run button:

```jsx
const handleFileUpload = (e) => {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = (ev) => {
    const alerts = JSON.parse(ev.target.result);
    startAnalysis(alerts);
  };
  reader.readAsText(file);
};

<input type="file" accept=".json" onChange={handleFileUpload} />
```

### Method 3 — POST directly to the API

```bash
curl -X POST http://localhost:8000/api/analysis/run \
  -H "Content-Type: application/json" \
  -d @your-alerts.json
```

### Method 4 — Connect a Real SIEM

**Splunk:**
```python
import requests, json

splunk_results = requests.get(
    "https://your-splunk:8089/services/search/jobs/export",
    params={"search": "search index=main sourcetype=syslog | head 500"},
    auth=("admin", "password"), verify=False
).json()

alerts = [
    {
        "id": f"A{i:03d}",
        "time": r["_time"][-8:],
        "sev": r.get("severity", "MEDIUM").upper(),
        "rule": r.get("source", "Unknown Rule"),
        "src":  r.get("src_ip", "unknown"),
        "dst":  r.get("dest_ip", "unknown"),
        "detail": r.get("message", ""),
        "host": r.get("host", "unknown"),
    }
    for i, r in enumerate(splunk_results, 1)
]

stream = requests.post(
    "http://localhost:8000/api/analysis/run",
    json=alerts, stream=True
)
for line in stream.iter_lines():
    if line.startswith(b"data: "):
        print(json.loads(line[6:]))
```

**Elastic / OpenSearch:**
```python
from elasticsearch import Elasticsearch

es = Elasticsearch("https://your-elastic:9200")
hits = es.search(index="filebeat-*", body={
    "query": {"range": {"@timestamp": {"gte": "now-1h"}}},
    "size": 500
})["hits"]["hits"]

alerts = [
    {
        "id": f"A{i:03d}",
        "time": h["_source"]["@timestamp"][-9:-1],
        "sev":  h["_source"].get("event.severity", "MEDIUM"),
        "rule": h["_source"].get("rule.name", "Unknown"),
        "src":  h["_source"].get("source.ip", "unknown"),
        "dst":  h["_source"].get("destination.ip", "unknown"),
        "detail": h["_source"].get("message", ""),
        "host": h["_source"].get("host.name", "unknown"),
    }
    for i, h in enumerate(hits, 1)
]
```

---

## Changing the AI Model

Edit `backend/.env`:
```ini
VLLM_MODEL=mistralai/Mistral-7B-Instruct-v0.3    # faster, smaller
VLLM_MODEL=meta-llama/Llama-3.1-70B-Instruct      # more accurate, needs more VRAM
VLLM_MODEL=Qwen/Qwen2.5-14B-Instruct              # good multilingual
```

Restart `start_vllm.sh` after changing the model.

---

## Development Commands

```bash
# Backend
uvicorn app.main:app --reload --port 8000
python -c "from app.config import settings; print(settings)"  # verify config
curl http://localhost:8000/docs  # auto-generated API docs

# Frontend (local)
npm run dev        # dev server at localhost:5173
npm run build      # production build → dist/
npm run lint       # ESLint
npm run format     # Prettier

# Frontend (JupyterHub)
VITE_BASE_PATH=/jupyter-<id>/proxy/5173/ npm run build
cd dist && python3 -m http.server 5173 --bind 0.0.0.0
```

---

## Troubleshooting

| Problem | Fix |
|---------|-----|
| `npm: command not found` | `apt-get install -y nodejs` |
| Blank page on JupyterHub | Build with `VITE_BASE_PATH=/jupyter-<id>/proxy/8000/ npm run build` |
| 404 on JS/CSS assets | `VITE_BASE_PATH` not set — assets loading from wrong path |
| Agents not spinning (no LLM calls) | API URL wrong — rebuild frontend with correct `VITE_BASE_PATH` |
| `HSA_STATUS_ERROR_INVALID_ISA` | Wrong GFX version — use `HSA_OVERRIDE_GFX_VERSION=9.4.2` for MI300X |
| `zstd: command not found` during Ollama install | `apt-get install -y zstd` |
| Stale LLM config after editing `.env` | `lru_cache` holds old settings — restart uvicorn |
| `git pull` fails (local changes conflict) | `git fetch origin && git reset --hard origin/main` |
| `vLLM not found` | `pip install vllm --extra-index-url https://download.pytorch.org/whl/rocm6.0` |
| `CORS error` in browser | Set `CORS_ORIGINS=https://notebooks.amd.com` in `backend/.env` |
| `ModuleNotFoundError: app` | Run uvicorn from inside the `backend/` directory |
