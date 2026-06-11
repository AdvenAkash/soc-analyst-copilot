# SOC Analyst Copilot

AI-powered Security Operations Center dashboard running a 4-agent pipeline through a local vLLM server (AMD ROCm) to convert 500+ SIEM alerts into ranked, actionable security incidents.

## Architecture

```
SIEM Alerts (500+)
       │
       ▼
┌──────────────────────────────────────────────┐
│           FastAPI Backend (Python 3.11)       │
│                                              │
│  Agent 1: Triage      → Groups + dismisses   │
│  Agent 2: Threat Intel → MITRE ATT&CK + IOCs │
│  Agent 3: Investigation → Kill-chain timeline│
│  Agent 4: Playbook    → Remediation steps    │
│                                              │
│  LLM: vLLM (AMD ROCm)  /  Ollama (fallback) │
└──────────────────────────────────────────────┘
       │ SSE stream
       ▼
┌──────────────────────────────────────────────┐
│        React 18 Frontend (Vite 5)            │
│  Apple Design System · Inline styles         │
└──────────────────────────────────────────────┘
```

## Quick Start

### 1. Start the LLM Server (AMD ROCm)

```bash
# Option A — vLLM (recommended)
chmod +x scripts/start_vllm.sh
./scripts/start_vllm.sh

# Option B — Ollama
chmod +x scripts/start_ollama.sh
./scripts/start_ollama.sh
```

### 2. Start the Backend

```bash
cd backend
cp .env.example .env
pip install -e .
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

### 3. Start the Frontend

```bash
cd frontend
npm install
npm run dev
```

Visit **http://localhost:5173**

## Environment Variables

See `backend/.env.example` and `frontend/.env.example`.

## Tech Stack

| Layer | Technology |
|-------|------------|
| LLM Server | vLLM ≥ 0.5.0 + AMD ROCm ≥ 6.0 |
| Backend | FastAPI + Pydantic v2 + httpx |
| Frontend | React 18 + Vite 5 |
| Styling | Apple Design System (inline tokens) |
| Streaming | Server-Sent Events (SSE) |

## Model

Default: `meta-llama/Llama-3.1-8B-Instruct`  
Override: set `VLLM_MODEL` in `backend/.env`
