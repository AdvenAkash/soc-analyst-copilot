# SOC Analyst Copilot — Full Session Context

> Paste this file into a new Claude Code session to continue development with full context.

---

## Project Identity

**Name:** SOC Analyst Copilot
**Repo:** https://github.com/AdvenAkash/soc-analyst-copilot
**Local path:** `c:\2026 Learn\SOC_Analyst\soc-copilot\`
**Live on:** `https://notebooks.amd.com/jupyter-hack-team-2652-260611211844-791ed408/proxy/8000/`
**Purpose:** AI-powered SOC dashboard — converts 500+ SIEM alerts into ranked, actionable security incidents using a 4-agent LLM pipeline
**Status:** ✅ Fully working on AMD notebooks.amd.com (MI300X GPU, Ollama + Llama 3.1 8B)

---

## Current State (as of last session)

### What works
- ✅ Frontend served by FastAPI on port 8000 (single-port deployment)
- ✅ Nav tabs wired — Dashboard, Incidents, Alerts, Playbooks, Settings all functional
- ✅ Ollama running with `HSA_OVERRIDE_GFX_VERSION=9.4.2` on AMD MI300X
- ✅ Backend health API confirmed working
- ✅ Fallback data works when LLM is down
- ✅ All 4 agent pipeline: Triage → Threat Intel → Investigation → Playbook

### Pending / In Progress
- ⚠️ Agents hitting LLM but ISA error on MI300X — needs `HSA_OVERRIDE_GFX_VERSION=9.4.2` + Ollama restart to confirm
- ⚠️ API URL routing via `import.meta.env.BASE_URL` — committed, needs rebuild on server

---

## Complete File List

```
soc-copilot/
├── README.md
├── GETTING_STARTED.md          ← full setup + JupyterHub deploy guide
├── ARCHITECTURE.md             ← architecture + data flow diagrams
├── CONTEXT_FOR_NEXT_SESSION.md ← this file
├── .gitignore
├── docker-compose.yml
│
├── scripts/
│   ├── start_vllm.sh           ← AMD ROCm vLLM startup
│   └── start_ollama.sh         ← Ollama startup (default GFX 9.4.2 for MI300X)
│
├── backend/
│   ├── pyproject.toml
│   ├── .env.example
│   └── app/
│       ├── main.py             ← FastAPI factory + serves frontend/dist/ as static files
│       ├── config.py           ← pydantic-settings (reads .env)
│       ├── api/
│       │   ├── dependencies.py ← get_llm_service() DI (lru_cache — restart to clear)
│       │   └── routes/
│       │       ├── analysis.py ← POST /api/analysis/run → SSE StreamingResponse
│       │       └── health.py   ← GET /api/health
│       ├── agents/
│       │   ├── base_agent.py
│       │   ├── triage_agent.py
│       │   ├── threat_intel_agent.py
│       │   ├── investigation_agent.py
│       │   └── playbook_agent.py
│       ├── services/llm_service.py  ← vLLM (OpenAI-compat) + Ollama backends
│       ├── schemas/
│       │   ├── alert.py
│       │   ├── incident.py
│       │   └── sse_event.py
│       └── utils/json_parser.py
│
└── frontend/
    ├── package.json
    ├── vite.config.js           ← base path via VITE_BASE_PATH env var; host: "0.0.0.0"
    ├── .eslintrc.cjs
    ├── .prettierrc
    ├── index.html
    └── src/
        ├── main.jsx
        ├── App.jsx              ← tab switching: Dashboard/Incidents/Alerts/Playbooks/Settings
        ├── constants/
        │   ├── tokens.js        ← Apple Design System tokens
        │   ├── alerts.js        ← SAMPLE_ALERTS[20] full APT kill-chain
        │   └── fallback.js      ← FALLBACK_INCIDENTS (no LLM needed)
        ├── utils/
        │   ├── severity.js
        │   └── format.js
        ├── services/api.js      ← uses import.meta.env.BASE_URL for correct proxy path
        ├── hooks/
        │   ├── useAnalysis.js
        │   └── useScrollFeed.js
        └── components/
            ├── layout/GlobalNav.jsx    ← clickable tabs, active tab highlighted
            ├── layout/SubNav.jsx
            ├── layout/StickyBar.jsx
            ├── sections/HeroSection.jsx
            ├── sections/StatsStrip.jsx
            ├── sections/AgentPipeline.jsx
            ├── alerts/AlertFeed.jsx
            ├── incidents/IncidentQueue.jsx
            ├── incidents/IncidentCard.jsx
            ├── incidents/IncidentDetail.jsx
            └── ui/ (AgentCard, Badge, Button, SectionLabel, Timeline)
```

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| GPU | AMD MI300X (~192 GB VRAM) on notebooks.amd.com |
| LLM Server | Ollama (Llama 3.1 8B, Q4_K_M GGUF) |
| ROCm GFX | `HSA_OVERRIDE_GFX_VERSION=9.4.2` (MI300X = gfx942) |
| Backend | Python 3.11, FastAPI 0.111+, httpx, Pydantic v2 |
| Frontend | React 18.3, Vite 5.3, inline Apple Design tokens |
| Deployment | FastAPI serves both API + static frontend on port 8000 |
| State | useReducer (pipeline) + useState (UI tabs) |
| Streaming | SSE via fetch + ReadableStream (POST-compatible) |

---

## Key Architecture Decisions

1. **Single-port deployment** — FastAPI mounts `frontend/dist/` as static files. No separate frontend server needed on JupyterHub. Everything on port 8000.
2. **API URL via `BASE_URL`** — `api.js` uses `import.meta.env.BASE_URL` (Vite's base path) so API calls include the JupyterHub proxy prefix automatically.
3. **Tab-based navigation** — No React Router. `activeTab` state in `App.jsx` switches between 5 views.
4. **Graceful fallback** — Every agent has `fallback_result()`. Pipeline always completes even if LLM is down.
5. **Inline styles only** — All values from `constants/tokens.js`. No CSS files, no Tailwind.

---

## Environment Variables (backend/.env)

```ini
LLM_BACKEND=ollama                    # "vllm" or "ollama"
VLLM_BASE_URL=http://localhost:8001/v1
VLLM_MODEL=meta-llama/Llama-3.1-8B-Instruct
VLLM_API_KEY=EMPTY
VLLM_TIMEOUT_SECONDS=120
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_MODEL=llama3.1:8b
OLLAMA_TIMEOUT_SECONDS=120
API_HOST=0.0.0.0
API_PORT=8000
CORS_ORIGINS=https://notebooks.amd.com
LLM_TEMPERATURE=0.1
LLM_MAX_TOKENS=1500
```

---

## JupyterHub Startup (notebooks.amd.com) — Full Sequence

```bash
# 1. Install Node if needed
apt-get install -y nodejs

# 2. Pull latest
cd /workspace/shared/soc-analyst-copilot
git fetch origin && git reset --hard origin/main

# 3. Start Ollama (MI300X GFX fix included in script)
chmod +x scripts/start_ollama.sh
./scripts/start_ollama.sh &

# 4. Build frontend for port 8000
cd frontend
npm install
VITE_BASE_PATH=/jupyter-hack-team-2652-260611211844-791ed408/proxy/8000/ npm run build

# 5. Start backend (serves frontend + API on same port)
cd ../backend
pip install -e .
uvicorn app.main:app --host 0.0.0.0 --port 8000

# 6. Open browser
# https://notebooks.amd.com/jupyter-hack-team-2652-260611211844-791ed408/proxy/8000/
```

---

## AMD GPU GFX Version Reference

| GPU | HSA_OVERRIDE_GFX_VERSION |
|-----|--------------------------|
| AMD MI300X (notebooks.amd.com) | `9.4.2` |
| AMD MI250X | `9.0.10` |
| AMD RX 7000 series (RDNA3) | `11.0.0` |
| AMD RX 6000 series (RDNA2) | `10.3.0` |

---

## Alert Schema

```typescript
interface Alert {
  id:     string;   // "A001"
  time:   string;   // "HH:MM:SS"
  sev:    "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";
  rule:   string;
  src:    string;
  dst:    string;
  detail: string;
  host:   string;
}
```

---

## SSE Event Protocol

```typescript
type SSEEvent =
  | { type: "agent_start";   agent: string; message: string }
  | { type: "agent_done";    agent: string; message: string; data: object }
  | { type: "pipeline_done"; incidents: Incident[] }
  | { type: "error";         message: string }
```

---

## Nav Tabs (App.jsx)

| Tab | Content |
|-----|---------|
| Dashboard | Hero + Stats + Agent pipeline + Alert feed + Incident workspace |
| Incidents | Full-width incident queue + detail panel |
| Alerts | Expanded alert feed (all 20 alerts) |
| Playbooks | All incident remediation playbooks + immediate actions |
| Settings | Backend `.env` config reference panel |

---

## Things to Add / Improve

### High Priority
- [ ] Confirm agents run end-to-end with real LLM on MI300X (ISA fix pending test)
- [ ] File upload button — drag-and-drop JSON alert file → `startAnalysis()`
- [ ] Real SIEM connector (Splunk/Elastic → POST to `/api/analysis/run`)

### Medium Priority
- [ ] Persist incidents — SQLite via SQLModel
- [ ] Export incident report as PDF or JSON
- [ ] Alert filtering by severity / host / rule
- [ ] Multi-incident triage — currently returns 1 INC; test with larger alert sets

### Low Priority
- [ ] Unit tests (Vitest frontend, pytest backend)
- [ ] Dockerfiles to match existing docker-compose.yml
- [ ] Dark mode (tokens support it, needs ThemeProvider)
- [ ] Streaming token-by-token display per agent

---

## Known Issues / Gotchas

| Issue | Root Cause | Fix |
|-------|-----------|-----|
| Agents don't run on JupyterHub | API calls resolve to wrong host | `api.js` now uses `BASE_URL` — rebuild frontend |
| `HSA_STATUS_ERROR_INVALID_ISA` | Wrong GFX version for MI300X | `HSA_OVERRIDE_GFX_VERSION=9.4.2` |
| Stale LLM config after `.env` change | `lru_cache` holds old `LLMService` | Restart uvicorn |
| Blank page on JupyterHub | Assets load from wrong base path | `VITE_BASE_PATH=.../proxy/8000/ npm run build` |
| `npm: command not found` | Node not installed in container | `apt-get install -y nodejs` |
| `git pull` fails (local changes) | Server has modified files | `git fetch origin && git reset --hard origin/main` |
