# SOC Analyst Copilot — Architecture

## Overview

```
Browser (React 18)
    │
    │  POST /api/analysis/run  [JSON: Alert[]]
    │  ◄── SSE stream  [data: {type, agent, message, data}]
    │
FastAPI Backend (Python 3.11)
    │
    ├── Agent 1: Triage        → groups alerts, dismisses FPs
    ├── Agent 2: Threat Intel  → MITRE ATT&CK + IOC enrichment
    ├── Agent 3: Investigation → kill-chain timeline reconstruction
    └── Agent 4: Playbook      → prioritized remediation steps
                │
                │  POST /v1/chat/completions
                │
vLLM Server (OpenAI-compatible, port 8001)
    └── Llama 3.1 8B on AMD ROCm GPU
```

---

## Data Flow — End to End

```
1. User clicks "Run Analysis"
        │
        ▼
2. Frontend: startAnalysis(SAMPLE_ALERTS)
   └── createAnalysisStream(alerts) → fetch POST /api/analysis/run

3. Backend receives list[Alert], creates SSE generator _run_pipeline()

4. AGENT 1 — TriageAgent.run(alerts)
   ├── builds prompt: "here are N alerts, group into incidents..."
   ├── calls LLMService.complete(system, user)
   │   └── POST vLLM /v1/chat/completions
   ├── extract_json(response_text)
   └── yields SSE: {type:"agent_done", agent:"triage", data:{incidents:[...]}}

5. AGENT 2 — ThreatIntelAgent.run(incidents, alerts)
   ├── builds prompt: "enrich with MITRE ATT&CK..."
   ├── calls LLMService → vLLM
   └── yields SSE: {type:"agent_done", agent:"threat_intel", data:{enriched:[...]}}

6. AGENT 3 — InvestigationAgent.run(incidents, alerts)
   ├── builds prompt: "reconstruct timeline..."
   └── yields SSE: {type:"agent_done", agent:"investigation", data:{investigations:[...]}}

7. AGENT 4 — PlaybookAgent.run(incidents, investigations)
   ├── builds prompt: "generate remediation playbook..."
   └── yields SSE: {type:"agent_done", agent:"playbook", data:{playbooks:[...]}}

8. _merge_results() → joins all 4 outputs by incident ID

9. yields SSE: {type:"pipeline_done", incidents:[...full enriched incidents...]}

10. Frontend useAnalysis hook dispatches PIPELINE_DONE → state.incidents
    └── React re-renders IncidentQueue + IncidentDetail
```

---

## Backend File Map

```
backend/app/
├── main.py                    FastAPI app factory, CORS, router registration
├── config.py                  pydantic-settings: reads .env, exposes Settings singleton
│
├── api/
│   ├── dependencies.py        FastAPI DI: get_llm_service() (cached singleton)
│   └── routes/
│       ├── analysis.py        POST /api/analysis/run → StreamingResponse (SSE)
│       └── health.py          GET  /api/health → {status, llm_backend, model}
│
├── agents/
│   ├── base_agent.py          Abstract: SYSTEM_PROMPT, build_user_message(), fallback_result(), run()
│   ├── triage_agent.py        Correlates alerts → incidents, identifies false positives
│   ├── threat_intel_agent.py  Maps MITRE ATT&CK techniques, identifies threat actor + IOCs
│   ├── investigation_agent.py Builds chronological kill-chain timeline
│   └── playbook_agent.py      Generates prioritized immediate actions + long-term fixes
│
├── services/
│   └── llm_service.py         Abstracts vLLM (OpenAI-compat) and Ollama HTTP APIs
│
├── schemas/
│   ├── alert.py               Alert, AlertSeverity (Pydantic v2)
│   ├── incident.py            Incident, MitreTechnique, TimelineEvent, ImmediateAction
│   └── sse_event.py           SSEEvent, SSEEventType
│
└── utils/
    └── json_parser.py         extract_json(): strips markdown fences, finds outermost {}
```

---

## Frontend File Map

```
frontend/src/
├── main.jsx                   React 18 createRoot entry point
├── App.jsx                    Root layout: nav + 2-column workspace + state wiring
│
├── constants/
│   ├── tokens.js              Apple Design System: COLOR, TYPE, RADIUS, SPACE
│   ├── alerts.js              SAMPLE_ALERTS[20]: realistic APT kill-chain scenario
│   └── fallback.js            FALLBACK_INCIDENTS: full demo data, no LLM required
│
├── utils/
│   ├── severity.js            getSeverityStyle(sev) → {color, background}
│   └── format.js              formatTime(), formatBytes()
│
├── services/
│   └── api.js                 createAnalysisStream(alerts): fetch POST + ReadableStream SSE
│
├── hooks/
│   ├── useAnalysis.js         useReducer: pipeline state + SSE event dispatch
│   └── useScrollFeed.js       Auto-scroll ref hook
│
└── components/
    ├── layout/
    │   ├── GlobalNav.jsx       44px sticky black nav
    │   ├── SubNav.jsx          52px frosted sub-nav + Run button
    │   └── StickyBar.jsx       Fixed bottom results bar (shown after pipeline completes)
    │
    ├── sections/
    │   ├── HeroSection.jsx     Hero tile — title changes based on pipeline status
    │   ├── StatsStrip.jsx      4-stat grid: alerts / incidents / FPs / agents done
    │   └── AgentPipeline.jsx   Dark tile with 2×2 agent status grid
    │
    ├── alerts/
    │   └── AlertFeed.jsx       Auto-scrolling alert list, highlights active alerts
    │
    ├── incidents/
    │   ├── IncidentQueue.jsx   Scrollable list of IncidentCards
    │   ├── IncidentCard.jsx    Single selectable card (title, sev badge, summary)
    │   └── IncidentDetail.jsx  Full editorial panel: IOCs, MITRE, timeline, actions
    │
    └── ui/
        ├── AgentCard.jsx       Status card with animated dot (waiting/running/done/error)
        ├── Badge.jsx           Severity / status pill
        ├── Button.jsx          primary (blue) / ghost variants
        ├── SectionLabel.jsx    Small-caps section header
        └── Timeline.jsx        Vertical attack timeline with kill-chain colour coding
```

---

## Key Design Decisions

### 1. SSE over WebSockets
The pipeline is one-directional: server → client. SSE is simpler (plain HTTP, no upgrade), works through proxies, and auto-reconnects. The native `fetch` + `ReadableStream` approach (instead of `EventSource`) allows POST bodies.

### 2. Graceful Fallback in Every Agent
Every agent overrides `fallback_result()`. If the LLM is unreachable, the pipeline completes with realistic hardcoded data. This means the UI is always demonstrable.

### 3. `useReducer` Not `useState` for Pipeline State
Pipeline state has multiple interdependent fields (status, agentResults, incidents, activeAlertIds). `useReducer` keeps transitions explicit and testable.

### 4. Inline Style Objects Over CSS
All styling uses inline style objects importing from `constants/tokens.js`. No CSS files, no Tailwind classes, no CSS-in-JS runtime. This keeps the bundle minimal and makes design tokens explicit.

### 5. vLLM as Primary, Ollama as Fallback
vLLM's OpenAI-compatible endpoint runs on AMD ROCm with much higher throughput. Ollama is provided as an easy fallback for machines without ROCm. The `LLM_BACKEND` env var switches between them with no code change.

---

## Pydantic Data Models

### Alert (input)
```python
class Alert(BaseModel):
    id: str           # "A001"
    time: str         # "09:47:23"
    sev: AlertSeverity  # CRITICAL | HIGH | MEDIUM | LOW
    rule: str         # "SSH Brute Force"
    src: str          # "185.220.101.45"
    dst: str          # "10.0.1.15"
    detail: str       # free-text description
    host: str         # "LINUX-WEB-01"
```

### Incident (output — merged from all 4 agents)
```python
class Incident(BaseModel):
    # From Triage Agent
    id: str
    title: str
    sev: str
    alert_ids: list[str]       # alerts that belong to this incident
    fp_ids: list[str]          # alerts dismissed as false positives
    summary: str

    # From Threat Intel Agent
    mitre_tactics: list[str]
    mitre_techniques: list[MitreTechnique]
    threat_actor: str
    confidence: ConfidenceLevel
    iocs: list[str]

    # From Investigation Agent
    kill_chain_stage: str
    timeline: list[TimelineEvent]
    affected_assets: list[str]
    impact: str

    # From Playbook Agent
    immediate_actions: list[ImmediateAction]
    investigation_steps: list[str]
    long_term_fix: str
```

---

## SSE Event Protocol

All events are `data: <JSON>\n\n` lines.

| Event Type | When | Key Fields |
|-----------|------|-----------|
| `agent_start` | Agent begins processing | `agent`, `message` |
| `agent_done` | Agent finished successfully | `agent`, `message`, `data` |
| `pipeline_done` | All 4 agents complete | `incidents: Incident[]` |
| `error` | Any agent throws | `message` |

---

## LLM Prompt Strategy

Each agent uses a two-part prompt:

**System prompt** — defines the analyst persona and hard output constraint:
> "You are a senior SOC Triage Analyst... Return ONLY valid JSON — no markdown fences, no explanation."

**User message** — contains the actual data + exact JSON schema to fill:
```
Analyze these 20 alerts. Return ONLY this JSON:
{
  "incidents": [{"id": ..., "title": ..., ...}]
}

ALERTS:
[...json...]
```

The `json_parser.py` utility handles LLMs that disobey the "no fences" instruction by:
1. Stripping ` ```json ` fences
2. Finding the outermost `{...}` block with regex

---

## Extending the Pipeline

### Add a 5th Agent

1. Create `backend/app/agents/my_agent.py` extending `BaseAgent`
2. Import and call it in `backend/app/api/routes/analysis.py` after Agent 4
3. Add its output fields to the merge step in `_merge_results()`
4. Add a card for it in `frontend/src/constants/` agent metadata
5. Add a display section in `frontend/src/components/incidents/IncidentDetail.jsx`

### Change the Model Per Agent

In each agent, override the LLM call with a different model:
```python
# Use a larger model only for the most critical agent
async def run(self, **kwargs) -> dict:
    # temporarily override model
    self._llm._cfg.vllm_model = "meta-llama/Llama-3.1-70B-Instruct"
    return await super().run(**kwargs)
```

Or add a `model` field to `Settings` per agent.

### Add a Database Layer

To persist incidents across sessions, add:
```bash
pip install sqlmodel  # SQLModel = SQLAlchemy + Pydantic
```
Create `backend/app/db/` with a `models.py` and connect via FastAPI lifespan.
