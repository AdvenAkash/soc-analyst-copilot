import { useState } from "react";
import GlobalNav from "./components/layout/GlobalNav.jsx";
import SubNav from "./components/layout/SubNav.jsx";
import HeroSection from "./components/sections/HeroSection.jsx";
import StatsStrip from "./components/sections/StatsStrip.jsx";
import AgentPipeline from "./components/sections/AgentPipeline.jsx";
import MetricsDashboard from "./components/sections/MetricsDashboard.jsx";
import AlertFeed from "./components/alerts/AlertFeed.jsx";
import IncidentQueue from "./components/incidents/IncidentQueue.jsx";
import IncidentDetail from "./components/incidents/IncidentDetail.jsx";
import StickyBar from "./components/layout/StickyBar.jsx";
import Button from "./components/ui/Button.jsx";
import Badge from "./components/ui/Badge.jsx";
import { useAnalysis } from "./hooks/useAnalysis.js";
import { useLiveAlerts } from "./hooks/useLiveAlerts.js";
import { SAMPLE_ALERTS } from "./constants/alerts.js";
import { COLOR, SPACE, TYPE, RADIUS } from "./constants/tokens.js";

export default function App() {
  const { state, startAnalysis, reset } = useAnalysis();
  const [selectedIncident, setSelectedIncident] = useState(null);
  const [activeTab, setActiveTab] = useState("dashboard");

  const fpIds    = state.incidents.flatMap((i) => i.fp_ids || []);
  const phase    = state.status === "done" ? "complete" : state.status;

  const {
    visibleAlerts,
    isLive,
    newestAlertId,
    criticalSeen,
    startLive,
    stopLive,
  } = useLiveAlerts({
    onCriticalDetected: (alerts) => {
      setSelectedIncident(null);
      startAnalysis(alerts);
      setActiveTab("dashboard");
    },
  });

  const feedAlerts = isLive || visibleAlerts.length > 0
    ? visibleAlerts
    : SAMPLE_ALERTS;

  const handleRun = () => {
    setSelectedIncident(null);
    startAnalysis(SAMPLE_ALERTS);
    setActiveTab("dashboard");
  };

  const handleReset = () => {
    stopLive();
    reset();
    setSelectedIncident(null);
  };

  return (
    <div style={{ background: COLOR.canvasParchment, minHeight: "100vh" }}>
      <GlobalNav activeTab={activeTab} onNav={setActiveTab} />
      <SubNav
        status={state.status}
        alertCount={SAMPLE_ALERTS.length}
        incidentCount={state.incidents.length}
        isLive={isLive}
        onRun={handleRun}
        onLive={startLive}
        onReset={handleReset}
      />

      <main style={{ maxWidth: 1440, margin: "0 auto", padding: `0 ${SPACE.lg}px` }}>

        {/* ── DASHBOARD ─────────────────────────────────────────── */}
        {activeTab === "dashboard" && (
          <>
            <HeroSection status={state.status} onRun={handleRun} />
            <StatsStrip
              alertCount={SAMPLE_ALERTS.length}
              incidentCount={state.incidents.length}
              fpCount={fpIds.length}
              agentsDone={state.agentResults.filter((a) => a.status === "done").length}
            />
            <AgentPipeline agents={state.agentResults} />
            <div
              style={{
                display: "grid",
                gridTemplateColumns: selectedIncident ? "1fr 1.6fr" : "1fr 2fr",
                gap: SPACE.lg,
                marginTop: SPACE.lg,
                marginBottom: 120,
                alignItems: "start",
              }}
            >
              <div style={{ display: "flex", flexDirection: "column", gap: SPACE.sm }}>
                <AlertFeed
                  alerts={feedAlerts}
                  activeIds={state.activeAlertIds}
                  fpIds={fpIds}
                  newestAlertId={newestAlertId}
                  isLive={isLive}
                  criticalSeen={criticalSeen}
                />
                <IncidentQueue
                  incidents={state.incidents}
                  selected={selectedIncident}
                  onSelect={setSelectedIncident}
                />
              </div>
              <IncidentDetail incident={selectedIncident} />
            </div>
          </>
        )}

        {/* ── INCIDENTS ─────────────────────────────────────────── */}
        {activeTab === "incidents" && (
          <div style={{ marginTop: SPACE.lg, marginBottom: 120 }}>
            <PageHeader
              title="Incident Queue"
              sub={`${state.incidents.length} incident${state.incidents.length !== 1 ? "s" : ""} detected`}
              onRun={handleRun}
              status={state.status}
            />
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "380px 1fr",
                gap: SPACE.lg,
                marginTop: SPACE.lg,
                alignItems: "start",
              }}
            >
              <IncidentQueue
                incidents={state.incidents}
                selected={selectedIncident}
                onSelect={setSelectedIncident}
              />
              <IncidentDetail incident={selectedIncident} />
            </div>
          </div>
        )}

        {/* ── ALERTS ────────────────────────────────────────────── */}
        {activeTab === "alerts" && (
          <div style={{ marginTop: SPACE.lg, marginBottom: 120 }}>
            <PageHeader
              title="Alert Feed"
              sub={`${SAMPLE_ALERTS.length} alerts ingested · ${state.activeAlertIds.length} linked to incidents`}
              onRun={handleRun}
              status={state.status}
            />
            <div style={{ marginTop: SPACE.lg }}>
              <AlertFeed
                alerts={feedAlerts}
                activeIds={state.activeAlertIds}
                fpIds={fpIds}
                newestAlertId={newestAlertId}
                isLive={isLive}
                criticalSeen={criticalSeen}
                expanded
              />
            </div>
          </div>
        )}

        {/* ── PLAYBOOKS ─────────────────────────────────────────── */}
        {activeTab === "playbooks" && (
          <div style={{ marginTop: SPACE.lg, marginBottom: 120 }}>
            <PageHeader
              title="Playbooks"
              sub="AI-generated remediation playbooks for all active incidents"
              onRun={handleRun}
              status={state.status}
            />
            {state.incidents.length === 0 ? (
              <EmptyState
                message="No playbooks yet. Run the AI pipeline to generate incident playbooks."
                onRun={handleRun}
              />
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: SPACE.lg, marginTop: SPACE.lg }}>
                {state.incidents.map((inc) => (
                  <PlaybookCard key={inc.id} incident={inc} />
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── METRICS ───────────────────────────────────────────── */}
        {activeTab === "metrics" && (
          <div style={{ marginTop: SPACE.lg, marginBottom: 120 }}>
            <PageHeader
              title="SOC Metrics"
              sub="Performance analytics and MITRE ATT&CK coverage"
              onRun={handleRun}
              status={state.status}
            />
            <MetricsDashboard
              incidents={state.incidents}
              fpIds={fpIds}
              totalAlerts={SAMPLE_ALERTS.length}
              phase={phase}
            />
          </div>
        )}

        {/* ── SETTINGS ──────────────────────────────────────────── */}
        {activeTab === "settings" && (
          <div style={{ marginTop: SPACE.lg, marginBottom: 120, maxWidth: 680 }}>
            <PageHeader title="Settings" sub="LLM backend and pipeline configuration" />
            <SettingsPanel />
          </div>
        )}

      </main>
      <StickyBar incidents={state.incidents} status={state.status} />
    </div>
  );
}

// ── Shared sub-components ──────────────────────────────────────────────────

function PageHeader({ title, sub, onRun, status }) {
  return (
    <div
      style={{
        background: COLOR.canvas,
        borderRadius: RADIUS.lg,
        padding: `${SPACE.xl}px ${SPACE.xl}px`,
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        border: `1px solid ${COLOR.hairline}`,
      }}
    >
      <div>
        <h1 style={{ ...TYPE.scale.displayMd, color: COLOR.ink, margin: 0 }}>{title}</h1>
        <p style={{ ...TYPE.scale.body, color: COLOR.inkMuted48, margin: `${SPACE.xxs}px 0 0` }}>{sub}</p>
      </div>
      {onRun && (
        <Button variant="primary" onClick={onRun} disabled={status === "running"}>
          {status === "running" ? "Analyzing…" : "Run Analysis"}
        </Button>
      )}
    </div>
  );
}

function EmptyState({ message, onRun }) {
  return (
    <div
      style={{
        background: COLOR.canvas,
        borderRadius: RADIUS.lg,
        border: `1px solid ${COLOR.hairline}`,
        padding: `${SPACE.xxl}px`,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: SPACE.lg,
        marginTop: SPACE.lg,
        textAlign: "center",
      }}
    >
      <svg width="48" height="48" viewBox="0 0 48 48" fill="none" opacity="0.18">
        <path d="M24 4L4 12V24C4 35 12.5 44.5 24 47.5C35.5 44.5 44 35 44 24V12L24 4Z" fill={COLOR.primary}/>
        <path d="M16 24L21 29L32 18" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
      <p style={{ ...TYPE.scale.body, color: COLOR.inkMuted48, margin: 0, maxWidth: 360 }}>
        {message}
      </p>
      {onRun && (
        <Button variant="primary" onClick={onRun}>
          Run AI Pipeline
        </Button>
      )}
    </div>
  );
}

function PlaybookCard({ incident }) {
  const sevColor = incident.sev === "CRITICAL" ? COLOR.criticalColor
    : incident.sev === "HIGH" ? COLOR.highColor
    : COLOR.primary;

  return (
    <div
      style={{
        background: COLOR.canvas,
        borderRadius: RADIUS.lg,
        border: `1px solid ${COLOR.hairline}`,
        overflow: "hidden",
      }}
    >
      {/* Card header */}
      <div
        style={{
          padding: `${SPACE.lg}px ${SPACE.xl}px`,
          borderBottom: `1px solid ${COLOR.hairline}`,
          display: "flex",
          alignItems: "center",
          gap: SPACE.sm,
        }}
      >
        <Badge variant={incident.sev}>{incident.sev}</Badge>
        <span style={{ ...TYPE.scale.bodyStrong, color: COLOR.ink, flex: 1 }}>{incident.title}</span>
        <span
          style={{
            ...TYPE.scale.finePrint,
            color: COLOR.inkMuted48,
            fontFamily: `"SF Mono", "JetBrains Mono", monospace`,
          }}
        >
          {incident.id}
        </span>
      </div>

      {/* Card body */}
      <div style={{ padding: `${SPACE.lg}px ${SPACE.xl}px` }}>
        {incident.immediate_actions?.length > 0 && (
          <>
            <p
              style={{
                ...TYPE.scale.navLink,
                color: COLOR.inkMuted48,
                textTransform: "uppercase",
                letterSpacing: "0.09em",
                fontWeight: 600,
                margin: `0 0 ${SPACE.sm}px`,
              }}
            >
              Immediate Actions
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: SPACE.xs }}>
              {incident.immediate_actions.map((a) => (
                <div
                  key={a.priority}
                  style={{
                    display: "flex",
                    gap: SPACE.sm,
                    alignItems: "flex-start",
                    padding: `${SPACE.xs}px ${SPACE.sm}px`,
                    background: a.priority <= 2 ? "rgba(255,59,48,0.03)" : COLOR.canvasParchment,
                    borderRadius: RADIUS.sm,
                    border: `1px solid ${a.priority <= 2 ? "rgba(255,59,48,0.12)" : COLOR.hairline}`,
                  }}
                >
                  <span
                    style={{
                      ...TYPE.scale.finePrint,
                      fontWeight: 700,
                      color: a.priority <= 2 ? COLOR.criticalColor : COLOR.inkMuted48,
                      minWidth: 18,
                    }}
                  >
                    {a.priority}.
                  </span>
                  <div style={{ flex: 1 }}>
                    <span style={{ ...TYPE.scale.caption, color: COLOR.ink }}>{a.action}</span>
                    <span style={{ ...TYPE.scale.finePrint, color: COLOR.inkMuted48, marginLeft: SPACE.xs }}>
                      — {a.owner} · {a.eta}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {incident.long_term_fix && (
          <div
            style={{
              marginTop: SPACE.md,
              padding: `${SPACE.sm}px ${SPACE.md}px`,
              background: COLOR.canvasParchment,
              borderRadius: RADIUS.sm,
              border: `1px solid ${COLOR.hairline}`,
            }}
          >
            <p
              style={{
                ...TYPE.scale.navLink,
                color: COLOR.inkMuted48,
                textTransform: "uppercase",
                letterSpacing: "0.09em",
                fontWeight: 600,
                margin: `0 0 ${SPACE.xxs}px`,
              }}
            >
              Long-Term Fix
            </p>
            <p style={{ ...TYPE.scale.caption, color: COLOR.ink, margin: 0 }}>{incident.long_term_fix}</p>
          </div>
        )}
      </div>
    </div>
  );
}

function SettingsPanel() {
  const fields = [
    { label: "LLM Backend",   value: "ollama",                              hint: "vllm | ollama",                         group: "Backend" },
    { label: "Ollama URL",    value: "http://localhost:11434",               hint: "Default Ollama port",                   group: "Backend" },
    { label: "vLLM URL",      value: "http://localhost:8001/v1",             hint: "OpenAI-compatible endpoint",            group: "Backend" },
    { label: "Model",         value: "llama3.1:8b",                         hint: "Any HuggingFace / Ollama model ID",     group: "Model" },
    { label: "Temperature",   value: "0.1",                                 hint: "0.0 – 1.0 (lower = deterministic)",    group: "Model" },
    { label: "Max Tokens",    value: "1500",                                hint: "Per agent response",                    group: "Model" },
    { label: "CORS Origins",  value: "https://notebooks.amd.com",           hint: "Frontend origin(s), comma-separated",  group: "Deployment" },
    { label: "API Port",      value: "8000",                                hint: "FastAPI server port",                   group: "Deployment" },
  ];

  const groups = [...new Set(fields.map((f) => f.group))];

  return (
    <div style={{ marginTop: SPACE.lg, display: "flex", flexDirection: "column", gap: SPACE.lg }}>
      {/* Info banner */}
      <div
        style={{
          background: "rgba(0,102,204,0.05)",
          border: `1px solid rgba(0,102,204,0.15)`,
          borderRadius: RADIUS.md,
          padding: `${SPACE.md}px`,
          display: "flex",
          gap: SPACE.sm,
          alignItems: "flex-start",
        }}
      >
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style={{ flexShrink: 0, marginTop: 1 }}>
          <circle cx="8" cy="8" r="7" stroke={COLOR.primary} strokeWidth="1.5"/>
          <path d="M8 7v5M8 5v1" stroke={COLOR.primary} strokeWidth="1.5" strokeLinecap="round"/>
        </svg>
        <p style={{ ...TYPE.scale.caption, color: COLOR.inkMuted48, margin: 0 }}>
          Edit these values in{" "}
          <code
            style={{
              fontFamily: `"SF Mono", "JetBrains Mono", monospace`,
              background: COLOR.canvasParchment,
              border: `1px solid ${COLOR.hairline}`,
              padding: "1px 5px",
              borderRadius: RADIUS.xs,
              color: COLOR.primaryFocus,
            }}
          >
            backend/.env
          </code>{" "}
          and restart uvicorn to apply.
        </p>
      </div>

      {groups.map((group) => (
        <div
          key={group}
          style={{
            background: COLOR.canvas,
            borderRadius: RADIUS.lg,
            border: `1px solid ${COLOR.hairline}`,
            overflow: "hidden",
          }}
        >
          {/* Group header */}
          <div
            style={{
              padding: `${SPACE.sm}px ${SPACE.lg}px`,
              background: COLOR.canvasParchment,
              borderBottom: `1px solid ${COLOR.hairline}`,
            }}
          >
            <span
              style={{
                ...TYPE.scale.navLink,
                color: COLOR.inkMuted48,
                textTransform: "uppercase",
                letterSpacing: "0.09em",
                fontWeight: 600,
              }}
            >
              {group}
            </span>
          </div>

          {/* Rows */}
          {fields
            .filter((f) => f.group === group)
            .map((f, i, arr) => (
              <div
                key={f.label}
                style={{
                  display: "flex",
                  gap: SPACE.lg,
                  padding: `${SPACE.sm}px ${SPACE.lg}px`,
                  borderBottom: i < arr.length - 1 ? `1px solid ${COLOR.dividerSoft}` : "none",
                  alignItems: "center",
                }}
              >
                <span style={{ ...TYPE.scale.captionStrong, color: COLOR.ink, minWidth: 140 }}>
                  {f.label}
                </span>
                <code
                  style={{
                    ...TYPE.scale.caption,
                    fontFamily: `"SF Mono", "JetBrains Mono", monospace`,
                    color: COLOR.primaryFocus,
                    flex: 1,
                  }}
                >
                  {f.value}
                </code>
                <span style={{ ...TYPE.scale.finePrint, color: COLOR.inkMuted48 }}>{f.hint}</span>
              </div>
            ))}
        </div>
      ))}
    </div>
  );
}
