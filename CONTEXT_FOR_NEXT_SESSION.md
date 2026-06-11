# SOC Analyst Copilot — Full Session Context

> Paste this file into a new Claude Code session to continue development with full context.

---

## Project Identity

**Name:** SOC Analyst Copilot  
**Path:** `c:\2026 Learn\SOC_Analyst\soc-copilot\`  
**Purpose:** AI-powered SOC dashboard — converts 500+ SIEM alerts into ranked, actionable security incidents using a 4-agent LLM pipeline  
**Status:** Fully scaffolded, all 60 files written, ready to install and run

---

## What Was Built (Complete File List)

```
soc-copilot/
├── README.md
├── GETTING_STARTED.md          ← full setup guide (written this session)
├── ARCHITECTURE.md             ← full architecture + data flow (written this session)
├── CONTEXT_FOR_NEXT_SESSION.md ← this file
├── .gitignore
├── docker-compose.yml
│
├── scripts/
│   ├── start_vllm.sh           ← AMD ROCm vLLM startup
│   └── start_ollama.sh         ← Ollama fallback startup
│
├── backend/
│   ├── pyproject.toml          ← pip dependencies (fastapi, uvicorn, httpx, pydantic v2)
│   ├── .env.example
│   └── app/
│       ├── main.py             ← FastAPI factory, CORS, router registration
│       ├── config.py           ← pydantic-settings Settings (reads .env)
│       ├── api/
│       │   ├── dependencies.py ← get_llm_service() DI (lru_cache singleton)
│       │   └── routes/
│       │       ├── analysis.py ← POST /api/analysis/run → SSE StreamingResponse
│       │       └── health.py   ← GET /api/health
│       ├── agents/
│       │   ├── base_agent.py          ← abstract: run(), build_user_message(), fallback_result()
│       │   ├── triage_agent.py        ← groups alerts into incidents, dismisses FPs
│       │   ├── threat_intel_agent.py  ← MITRE ATT&CK + IOC enrichment
│       │   ├── investigation_agent.py ← kill-chain timeline reconstruction
│       │   └── playbook_agent.py      ← prioritized remediation playbook
│       ├── services/
│       │   └── llm_service.py  ← abstracts vLLM (OpenAI-compat) + Ollama backends
│       ├── schemas/
│       │   ├── alert.py        ← Alert, AlertSeverity Pydantic models
│       │   ├── incident.py     ← Incident, MitreTechnique, TimelineEvent, ImmediateAction
│       │   └── sse_event.py    ← SSEEvent, SSEEventType
│       └── utils/
│           └── json_parser.py  ← strips markdown fences, extracts JSON from LLM output
│
└── frontend/
    ├── package.json            ← react 18, vite 5, eslint, prettier, vitest
    ├── vite.config.js          ← port 5173, /api proxy → localhost:8000
    ├── .eslintrc.cjs
    ├── .prettierrc
    ├── index.html
    ├── .env.example
    └── src/
        ├── main.jsx            ← createRoot entry
        ├── App.jsx             ← root: GlobalNav + SubNav + 2-col layout + StickyBar
        ├── constants/
        │   ├── tokens.js       ← Apple Design System: COLOR, TYPE, RADIUS, SPACE
        │   ├── alerts.js       ← SAMPLE_ALERTS[20] — full APT kill-chain scenario
        │   └── fallback.js     ← FALLBACK_INCIDENTS — demo works without LLM
        ├── utils/
        │   ├── severity.js     ← getSeverityStyle(sev) → {color, background}
        │   └── format.js       ← formatTime(), formatBytes()
        ├── services/
        │   └── api.js          ← createAnalysisStream(alerts) — fetch POST + ReadableStream
        ├── hooks/
        │   ├── useAnalysis.js  ← useReducer pipeline state + SSE integration
        │   └── useScrollFeed.js← auto-scroll ref hook
        └── components/
            ├── layout/
            │   ├── GlobalNav.jsx    ← 44px sticky black nav
            │   ├── SubNav.jsx       ← 52px frosted sub-nav + Run button
            │   └── StickyBar.jsx    ← fixed bottom bar (shown on pipeline_done)
            ├── sections/
            │   ├── HeroSection.jsx  ← hero tile, title changes on status
            │   ├── StatsStrip.jsx   ← 4-stat grid
            │   └── AgentPipeline.jsx← dark tile 2×2 agent grid
            ├── alerts/
            │   └── AlertFeed.jsx    ← scrolling alert list, highlights active alerts
            ├── incidents/
            │   ├── IncidentQueue.jsx← list of IncidentCards
            │   ├── IncidentCard.jsx ← selectable card
            │   └── IncidentDetail.jsx← full investigation panel (IOCs, MITRE, timeline, actions)
            └── ui/
                ├── AgentCard.jsx    ← animated status dot card
                ├── Badge.jsx        ← severity/status pill
                ├── Button.jsx       ← primary (blue) + ghost variants
                ├── SectionLabel.jsx ← small-caps header
                └── Timeline.jsx     ← vertical kill-chain timeline
```

---

## Tech Stack (Exact Versions)

| Layer | Technology |
|-------|-----------|
| LLM Server | vLLM ≥ 0.5.0 on AMD ROCm ≥ 6.0 (or Ollama fallback) |
| Default Model | `meta-llama/Llama-3.1-8B-Instruct` |
| Backend Language | Python 3.11+ |
| Backend Framework | FastAPI 0.111+ |
| HTTP Client | httpx 0.27+ (async) |
| Validation | Pydantic v2 |
| Config | pydantic-settings + python-dotenv |
| Streaming | Server-Sent Events via FastAPI StreamingResponse |
| Frontend | React 18.3, Vite 5.3 |
| Styling | Inline style objects + Apple Design System tokens |
| State | useReducer (pipeline) + useState (UI) |
| SSE Client | Native fetch + ReadableStream (not EventSource — allows POST) |
| Bundler | Vite 5 |

---

## Key Conventions (Do Not Change Without Reason)

1. **Inline styles only** — no CSS files, no Tailwind. All values from `tokens.js`
2. **Never inline hex values** in components — always `COLOR.xxx` from tokens
3. **Every agent has a `fallback_result()`** — pipeline must complete even without LLM
4. **JSON only from LLM** — prompts end with "Return ONLY valid JSON — no markdown fences"
5. **`json_parser.extract_json()`** — always used after LLM response; never `json.loads()` directly
6. **`useReducer`** for pipeline state — not multiple `useState` calls
7. **No CSS-in-JS libraries** — just style objects

---

## Environment Variables (backend/.env)

```ini
LLM_BACKEND=vllm                                  # "vllm" or "ollama"
VLLM_BASE_URL=http://localhost:8001/v1
VLLM_MODEL=meta-llama/Llama-3.1-8B-Instruct
VLLM_API_KEY=EMPTY
VLLM_TIMEOUT_SECONDS=120
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_MODEL=llama3.1:8b
OLLAMA_TIMEOUT_SECONDS=120
API_HOST=0.0.0.0
API_PORT=8000
CORS_ORIGINS=http://localhost:5173
LLM_TEMPERATURE=0.1
LLM_MAX_TOKENS=1500
```

---

## Alert Schema (the input contract)

```typescript
interface Alert {
  id:     string;   // "A001" — unique
  time:   string;   // "HH:MM:SS"
  sev:    "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";
  rule:   string;   // SIEM rule name
  src:    string;   // source IP or hostname
  dst:    string;   // destination IP, hostname, or CIDR
  detail: string;   // free-text description
  host:   string;   // sensor/host that generated the alert
}
```

---

## SSE Event Protocol

```typescript
// Stream of these events from POST /api/analysis/run:
type SSEEvent =
  | { type: "agent_start";   agent: string;  message: string }
  | { type: "agent_done";    agent: string;  message: string; data: object }
  | { type: "pipeline_done"; incidents: Incident[] }
  | { type: "error";         message: string }
```

---

## How to Start the App (Quick Reference)

```bash
# Terminal 1 — LLM server
./scripts/start_vllm.sh

# Terminal 2 — Backend
cd backend && pip install -e . && uvicorn app.main:app --port 8000 --reload

# Terminal 3 — Frontend
cd frontend && npm install && npm run dev

# Browser → http://localhost:5173
```

---

## Things to Add / Improve (Suggested Next Steps)

### High Priority
- [ ] **File upload button** in the UI — drag-and-drop JSON alert file → `startAnalysis()`
- [ ] **Real SIEM connector** — Python script to pull from Splunk/Elastic and POST to `/api/analysis/run`
- [ ] **`npm install`** and test the frontend actually renders (hasn't been run yet)
- [ ] **`pip install -e .`** and test the backend starts without import errors

### Medium Priority
- [ ] **Persist incidents** — SQLite/PostgreSQL via SQLModel to save analysis history
- [ ] **Authentication** — JWT or API key for the backend routes
- [ ] **Multi-incident support** — currently triage may return 1 incident; UI should handle 5–10
- [ ] **Export** — download incident report as PDF or JSON
- [ ] **CSV import** — parse Splunk/Elastic CSV exports in the browser
- [ ] **Alert filtering** — filter feed by severity, host, or rule

### Low Priority
- [ ] **Unit tests** — Vitest for frontend, pytest for backend agents
- [ ] **Docker** — the `docker-compose.yml` exists but no `Dockerfile`s yet
- [ ] **Dark mode** — design tokens support it; needs a ThemeProvider
- [ ] **Streaming token-by-token** — show LLM output as it generates instead of waiting per agent

---

## Known Limitations

1. **`json_parser.py` regex**: The `\{[\s\S]*\}` pattern is greedy — works for single-object responses but may fail on streamed partial JSON. Currently all agents use `stream: false`.
2. **Alert limit**: The sample has 20 alerts. The LLM context window is set to 4096 tokens. For 500+ real alerts, implement chunking in `triage_agent.py`.
3. **No authentication**: The `/api/analysis/run` endpoint is open. For production, add API key middleware.
4. **Single-incident UI assumption**: `IncidentDetail` renders one incident at a time. If triage returns 5 incidents, you click between them — but the MITRE/timeline display assumes one selected at a time.

---

## Conversation Summary

This project was built in one session by:
1. Receiving a 50,000-character build prompt (truncated at `alerts.js` A014 entry)
2. Reconstructing the missing parts (A014–A020 alerts, fallback incidents, all component specs)
3. Launching a 26-agent parallel workflow that created all 60 files in ~5 minutes
4. Verifying file creation and escape character correctness

The user then asked:
- How to provide more data for analysis → answered with 4 methods (edit alerts.js, file upload, direct POST, SIEM connector examples)
- For this documentation set (GETTING_STARTED.md, ARCHITECTURE.md, CONTEXT_FOR_NEXT_SESSION.md)

---

## For the Next Session

Start by running the app to verify it works:

```bash
cd frontend && npm install && npm run dev
```

If there are React errors, the most likely issues are:
1. Missing `vite.config.js` — file exists, check if content is correct
2. Template literal escaping in JSX — any `\`` that should be a backtick
3. Missing import in a component

Then tackle whichever item from the "Things to Add" list above is most useful.
