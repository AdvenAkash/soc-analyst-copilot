# SOC Analyst Copilot — Full Session Context

> Paste this file into a new Claude Code session to continue development with full context.

---

## Project Identity

**Name:** SOC Analyst Copilot
**Repo:** https://github.com/AdvenAkash/soc-analyst-copilot
**Local path:** `c:\2026 Learn\SOC_Analyst\soc-copilot\`
**Live on:** `https://notebooks.amd.com/<YOUR-SESSION-ID>/proxy/5173/`
**Purpose:** AI-powered SOC dashboard — converts 500+ SIEM alerts into ranked, actionable security incidents using a 4-agent LLM pipeline
**Status:** ✅ Fully working on AMD notebooks.amd.com (MI300X GPU, Ollama + Llama 3.1 8B)

---

## Current State (as of 2026-06-14)

### What works
- ✅ 4-agent pipeline confirmed running end-to-end with real LLM on MI300X
- ✅ Ollama running with `HSA_OVERRIDE_GFX_VERSION=9.4.2` — ISA error resolved
- ✅ Frontend served on port 5173 via `python3 -m http.server` (separate from backend)
- ✅ Backend FastAPI on port 8000, health endpoint confirmed: `{"status":"ok","llm_backend":"ollama","model":"llama3.1:8b"}`
- ✅ API URL routing fixed — `api.js` uses `VITE_API_BASE_URL` env var for correct JupyterHub proxy path
- ✅ Production-grade Apple Design System UI overhaul complete
- ✅ `start.sh` one-command startup — auto-detects session ID, starts all 3 services
- ✅ Nav tabs — Dashboard, Incidents, Alerts, Playbooks, Settings all functional
- ✅ Fallback data works when LLM is down

### Pending / In Progress
- [ ] File upload button — drag-and-drop JSON alert file → `startAnalysis()`
- [ ] Real SIEM connector (Splunk/Elastic → POST to `/api/analysis/run`)
- [ ] Persist incidents — SQLite via SQLModel
- [ ] Export incident report as PDF or JSON
- [ ] Alert filtering by severity / host / rule

---

## Deployment Architecture (Current)

**Two-port setup on JupyterHub:**

| Service | Port | How |
|---------|------|-----|
| Backend (FastAPI) | 8000 | `uvicorn app.main:app --host 0.0.0.0 --port 8000` |
| Frontend (React) | 5173 | `cd frontend/dist && python3 -m http.server 5173 --bind 0.0.0.0` |
| LLM (Ollama) | 11434 | `./scripts/start_ollama.sh` |

**Accessing via JupyterHub proxy:**
- Frontend: `https://notebooks.amd.com/<SESSION-ID>/proxy/5173/`
- Backend API: `https://notebooks.amd.com/<SESSION-ID>/proxy/8000/api/health`

**One-command startup (recommended):**
```bash
cd /workspace/shared/soc-analyst-copilot
git fetch origin && git reset --hard origin/main
chmod +x start.sh
./start.sh
# Session ID auto-detected from JUPYTERHUB_SERVICE_PREFIX
# Or pass it manually: ./start.sh jupyter-hack-team-XXXX
```

**Frontend rebuild required on every new session** (session ID changes each restart):
```bash
cd /workspace/shared/soc-analyst-copilot/frontend
VITE_BASE_PATH=/<SESSION-ID>/proxy/5173/ \
VITE_API_BASE_URL=https://notebooks.amd.com/<SESSION-ID>/proxy/8000 \
npm run build
```

---

## Complete File List

```
soc-copilot/
├── README.md
├── GETTING_STARTED.md          ← original setup guide
├── ARCHITECTURE.md             ← architecture + data flow diagrams
├── AMD_NOTEBOOK_SETUP.md       ← AMD JupyterHub deployment guide (preferred)
├── CONTEXT_FOR_NEXT_SESSION.md ← this file
├── start.sh                    ← one-command startup (auto-detects session ID)
├── .gitignore
├── docker-compose.yml
│
├── scripts/
│   ├── start_vllm.sh           ← AMD ROCm vLLM startup
│   └── start_ollama.sh         ← Ollama startup (sets GFX 9.4.2, pulls model)
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
    ├── vite.config.js           ← base path via VITE_BASE_PATH env var
    ├── .eslintrc.cjs
    ├── .prettierrc
    ├── index.html               ← global CSS: keyframes, scrollbar, font smoothing
    └── src/
        ├── main.jsx
        ├── App.jsx              ← tab switching; PageHeader, PlaybookCard, SettingsPanel
        ├── constants/
        │   ├── tokens.js        ← full Apple Design System tokens (colors, type, spacing)
        │   ├── alerts.js        ← SAMPLE_ALERTS[20] full APT kill-chain
        │   └── fallback.js      ← FALLBACK_INCIDENTS (no LLM needed)
        ├── utils/
        │   ├── severity.js
        │   └── format.js
        ├── services/api.js      ← VITE_API_BASE_URL || BASE_URL for proxy path
        ├── hooks/
        │   ├── useAnalysis.js
        │   └── useScrollFeed.js
        └── components/
            ├── layout/GlobalNav.jsx    ← true black bg, shield icon, Sky Blue active underline
            ├── layout/SubNav.jsx       ← tagline typography, live status chips, pill CTA
            ├── layout/StickyBar.jsx    ← green checkmark, severity breakdown, scroll hint
            ├── sections/HeroSection.jsx  ← dark tile, 56px headline, two pill CTAs
            ├── sections/StatsStrip.jsx   ← color-coded metrics
            ├── sections/AgentPipeline.jsx ← horizontal 4-card layout, → connectors, progress bar
            ├── alerts/AlertFeed.jsx      ← severity-colored left borders on all rows
            ├── incidents/IncidentQueue.jsx
            ├── incidents/IncidentCard.jsx  ← left-border selection (not full-blue bg)
            ├── incidents/IncidentDetail.jsx ← severity header band, IOC pills, MITRE chips
            └── ui/
                ├── AgentCard.jsx   ← numbered step circles, checkmark when done, pulseRing
                ├── Badge.jsx       ← pill shape (RADIUS.pill)
                ├── Button.jsx      ← true Apple pill (11px 22px, 17px body type), ghost-dark variant
                ├── SectionLabel.jsx
                └── Timeline.jsx
```

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| GPU | AMD MI300X (~192 GB VRAM) on notebooks.amd.com |
| LLM Server | Ollama (Llama 3.1 8B) |
| ROCm GFX | `HSA_OVERRIDE_GFX_VERSION=9.4.2` (MI300X = gfx942) |
| Backend | Python 3.11, FastAPI 0.111+, httpx, Pydantic v2 |
| Frontend | React 18.3, Vite 5.3, inline Apple Design tokens |
| Deployment | Frontend: port 5173 · Backend: port 8000 · Ollama: 11434 |
| State | useReducer (pipeline) + useState (UI tabs) |
| Streaming | SSE via fetch + ReadableStream (POST-compatible) |

---

## Key Architecture Decisions

1. **Two-port deployment** — Frontend on 5173 (`python3 -m http.server`), Backend on 8000 (uvicorn). Both accessible via JupyterHub `/proxy/<port>/`.
2. **API URL via env vars** — `api.js` reads `VITE_API_BASE_URL` (set at build time) so API calls hit the correct backend proxy URL regardless of port.
3. **Tab-based navigation** — No React Router. `activeTab` state in `App.jsx` switches between 5 views.
4. **Graceful fallback** — Every agent has `fallback_result()`. Pipeline always completes even if LLM is down.
5. **Inline styles only** — All values from `constants/tokens.js`. No CSS files, no Tailwind.
6. **One-command startup** — `start.sh` auto-detects session ID from `JUPYTERHUB_SERVICE_PREFIX`, installs missing deps, health-checks each service before starting the next.

---

## Environment Variables (backend/.env)

```ini
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
- [ ] File upload — drag-and-drop JSON alert file → `startAnalysis()`
- [ ] Real SIEM connector (Splunk/Elastic → POST to `/api/analysis/run`)

### Medium Priority
- [ ] Persist incidents — SQLite via SQLModel
- [ ] Export incident report as PDF or JSON
- [ ] Alert filtering by severity / host / rule
- [ ] Multi-incident triage — currently returns 1 INC; test with larger alert sets

### Low Priority
- [ ] Unit tests (Vitest frontend, pytest backend)
- [ ] Docker Compose (works on plain VM/server, blocked on JupyterHub)
- [ ] Dark mode (tokens support it, needs ThemeProvider)
- [ ] Streaming token-by-token display per agent

---

## Known Issues / Gotchas

| Issue | Root Cause | Fix |
|-------|-----------|-----|
| Blank page in browser | Wrong session ID in build | Rebuild with correct `VITE_BASE_PATH` |
| Run Analysis does nothing | `VITE_API_BASE_URL` not set at build | Rebuild with both env vars |
| `HSA_STATUS_ERROR_INVALID_ISA` | Wrong GFX version for MI300X | `start_ollama.sh` sets `9.4.2` automatically |
| Stale LLM config after `.env` change | `lru_cache` holds old `LLMService` | Restart uvicorn |
| `E: Unable to locate package nodejs` | Default apt repo has no Node | `start.sh` uses NodeSource install automatically |
| `git pull` fails (local changes) | Server has modified files | `git fetch origin && git reset --hard origin/main` |
| `git reset` fails / permission error | Stale lock file | `rm -f .git/index.lock` then retry |
