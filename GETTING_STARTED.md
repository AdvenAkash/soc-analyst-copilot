# SOC Analyst Copilot — Getting Started Guide

## What This Is

An AI-powered Security Operations Center (SOC) dashboard that processes 500+ SIEM alerts through a 4-agent AI pipeline running locally on your machine. No cloud API keys required — it runs entirely on your hardware via AMD ROCm + vLLM or Ollama.

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

## Step 1 — Clone / Open the Project

The project lives at:
```
c:\2026 Learn\SOC_Analyst\soc-copilot\
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

## Step 2 — Start the LLM Server

### Option A: vLLM on AMD ROCm (Recommended)

```bash
# From project root
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

**First run** downloads the model (~16 GB). Subsequent starts are fast.

### Option B: Ollama (No ROCm Required)

```bash
chmod +x scripts/start_ollama.sh
./scripts/start_ollama.sh
```

Then change the backend config:
```bash
# backend/.env
LLM_BACKEND=ollama
OLLAMA_MODEL=llama3.1:8b
```

---

## Step 3 — Configure the Backend

```bash
cd backend
cp .env.example .env
```

Open `.env` and verify these settings:
```ini
LLM_BACKEND=vllm                                    # or "ollama"
VLLM_BASE_URL=http://localhost:8001/v1
VLLM_MODEL=meta-llama/Llama-3.1-8B-Instruct
CORS_ORIGINS=http://localhost:5173
```

---

## Step 4 — Install and Run the Backend

```bash
# Still inside backend/
pip install -e .

# Start the FastAPI server
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

You should see:
```
INFO:     Application startup complete.
INFO:     Uvicorn running on http://0.0.0.0:8000
```

**Verify it works:**
```bash
curl http://localhost:8000/api/health
# → {"status":"ok","llm_backend":"vllm","model":"meta-llama/..."}
```

---

## Step 5 — Install and Run the Frontend

Open a new terminal:
```bash
cd frontend
npm install
npm run dev
```

Visit **http://localhost:5173**

---

## Step 6 — Run Your First Analysis

1. Open **http://localhost:5173**
2. Click **"Run AI Pipeline"** in the hero section or the top nav button
3. Watch the 4 agents process in real time:
   - **Triage Agent** — groups 20 sample alerts into incidents, dismisses false positives
   - **Threat Intel Agent** — maps MITRE ATT&CK techniques, identifies IOCs
   - **Investigation Agent** — reconstructs the attack kill-chain timeline
   - **Playbook Agent** — generates prioritized remediation steps
4. Click any incident card to view the full investigation report

> **No LLM?** The demo still works. All 4 agents have hardcoded fallback results that activate automatically if the LLM server is unavailable.

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

Add this to `App.jsx` next to the Run button to allow uploading exported SIEM alerts:

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

// In JSX:
<input type="file" accept=".json" onChange={handleFileUpload} />
```

### Method 3 — POST directly to the API

```bash
curl -X POST http://localhost:8000/api/analysis/run \
  -H "Content-Type: application/json" \
  -d @your-alerts.json
```

Where `your-alerts.json` is an array of alert objects matching the schema above.

### Method 4 — Connect a Real SIEM

**Splunk (Python example):**
```python
import requests, json

# Pull from Splunk
splunk_results = requests.get(
    "https://your-splunk:8089/services/search/jobs/export",
    params={"search": "search index=main sourcetype=syslog | head 500"},
    auth=("admin", "password"),
    verify=False
).json()

# Map to Alert schema
alerts = [
    {
        "id": f"A{i:03d}",
        "time": r["_time"][-8:],   # HH:MM:SS
        "sev": r.get("severity", "MEDIUM").upper(),
        "rule": r.get("source", "Unknown Rule"),
        "src":  r.get("src_ip", "unknown"),
        "dst":  r.get("dest_ip", "unknown"),
        "detail": r.get("message", ""),
        "host": r.get("host", "unknown"),
    }
    for i, r in enumerate(splunk_results, 1)
]

# Send to pipeline
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
import requests, json

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
uvicorn app.main:app --reload --port 8000    # start with hot-reload
python -c "from app.config import settings; print(settings)"  # verify config

# Frontend
npm run dev        # start dev server
npm run build      # production build
npm run lint       # ESLint check
npm run format     # Prettier format

# Check API docs (auto-generated by FastAPI)
open http://localhost:8000/docs
```

---

## Troubleshooting

| Problem | Fix |
|---------|-----|
| `vLLM not found` | Install ROCm-compatible wheel: `pip install vllm --extra-index-url https://download.pytorch.org/whl/rocm6.0` |
| `CORS error` in browser | Check `CORS_ORIGINS=http://localhost:5173` in `backend/.env` |
| Agents return fallback data | LLM server not running or unreachable — check `http://localhost:8001/v1/models` |
| `ModuleNotFoundError: app` | Run uvicorn from inside the `backend/` directory |
| Frontend shows blank page | Run `npm install` first, then `npm run dev` |
| `HSA_OVERRIDE_GFX_VERSION` error | Set `HSA_OVERRIDE_GFX_VERSION=11.0.0` for AMD RDNA3 cards |
