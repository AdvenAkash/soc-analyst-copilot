import { useState } from "react";
import GlobalNav from "./components/layout/GlobalNav.jsx";
import SubNav from "./components/layout/SubNav.jsx";
import HeroSection from "./components/sections/HeroSection.jsx";
import StatsStrip from "./components/sections/StatsStrip.jsx";
import AgentPipeline from "./components/sections/AgentPipeline.jsx";
import AlertFeed from "./components/alerts/AlertFeed.jsx";
import IncidentQueue from "./components/incidents/IncidentQueue.jsx";
import IncidentDetail from "./components/incidents/IncidentDetail.jsx";
import StickyBar from "./components/layout/StickyBar.jsx";
import { useAnalysis } from "./hooks/useAnalysis.js";
import { SAMPLE_ALERTS } from "./constants/alerts.js";
import { COLOR, SPACE, TYPE, RADIUS } from "./constants/tokens.js";

export default function App() {
  const { state, startAnalysis } = useAnalysis();
  const [selectedIncident, setSelectedIncident] = useState(null);
  const [activeTab, setActiveTab] = useState("dashboard");

  const handleRun = () => {
    setSelectedIncident(null);
    startAnalysis(SAMPLE_ALERTS);
    setActiveTab("dashboard");
  };

  return (
    <div style={{ background: COLOR.canvasParchment, minHeight: "100vh" }}>
      <GlobalNav activeTab={activeTab} onNav={setActiveTab} />
      <SubNav
        status={state.status}
        alertCount={SAMPLE_ALERTS.length}
        incidentCount={state.incidents.length}
        onRun={handleRun}
        activeTab={activeTab}
      />

      <main style={{ maxWidth: 1440, margin: "0 auto", padding: `0 ${SPACE.lg}px` }}>

        {/* ── DASHBOARD ─────────────────────────────────────────── */}
        {activeTab === "dashboard" && (
          <>
            <HeroSection status={state.status} onRun={handleRun} />
            <StatsStrip
              alertCount={SAMPLE_ALERTS.length}
              incidentCount={state.incidents.length}
              fpCount={state.incidents.reduce((n, i) => n + (i.fp_ids?.length || 0), 0)}
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
              <div style={{ display: "flex", flexDirection: "column", gap: SPACE.md }}>
                <AlertFeed alerts={SAMPLE_ALERTS} activeIds={state.activeAlertIds} />
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
                gridTemplateColumns: selectedIncident ? "380px 1fr" : "380px 1fr",
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
                alerts={SAMPLE_ALERTS}
                activeIds={state.activeAlertIds}
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
                icon="📋"
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

        {/* ── SETTINGS ──────────────────────────────────────────── */}
        {activeTab === "settings" && (
          <div style={{ marginTop: SPACE.lg, marginBottom: 120, maxWidth: 640 }}>
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
        padding: `${SPACE.xl}px`,
        marginTop: SPACE.lg,
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
        <button
          onClick={onRun}
          disabled={status === "running"}
          style={{
            ...TYPE.scale.captionStrong,
            background: COLOR.primaryFocus,
            color: COLOR.onDark,
            border: "none",
            borderRadius: RADIUS.sm,
            padding: `${SPACE.xs}px ${SPACE.md}px`,
            cursor: status === "running" ? "not-allowed" : "pointer",
            opacity: status === "running" ? 0.5 : 1,
          }}
        >
          {status === "running" ? "Analyzing…" : "Run Analysis"}
        </button>
      )}
    </div>
  );
}

function EmptyState({ icon, message, onRun }) {
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
        gap: SPACE.md,
        marginTop: SPACE.lg,
      }}
    >
      <div style={{ fontSize: 40, opacity: 0.25 }}>{icon}</div>
      <p style={{ ...TYPE.scale.body, color: COLOR.inkMuted48, margin: 0, textAlign: "center" }}>
        {message}
      </p>
      {onRun && (
        <button
          onClick={onRun}
          style={{
            ...TYPE.scale.captionStrong,
            background: COLOR.primaryFocus,
            color: COLOR.onDark,
            border: "none",
            borderRadius: RADIUS.sm,
            padding: `${SPACE.xs}px ${SPACE.md}px`,
            cursor: "pointer",
          }}
        >
          Run AI Pipeline
        </button>
      )}
    </div>
  );
}

function PlaybookCard({ incident }) {
  return (
    <div
      style={{
        background: COLOR.canvas,
        borderRadius: RADIUS.lg,
        border: `1px solid ${COLOR.hairline}`,
        padding: `${SPACE.xl}px`,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: SPACE.sm, marginBottom: SPACE.md }}>
        <span
          style={{
            ...TYPE.scale.finePrint,
            color: COLOR.onDark,
            background: incident.sev === "CRITICAL" ? COLOR.criticalColor
              : incident.sev === "HIGH" ? COLOR.highColor : COLOR.primaryFocus,
            borderRadius: RADIUS.xs,
            padding: `2px ${SPACE.xs}px`,
            fontWeight: 600,
          }}
        >
          {incident.sev}
        </span>
        <span style={{ ...TYPE.scale.bodyStrong, color: COLOR.ink }}>{incident.title}</span>
        <span style={{ ...TYPE.scale.caption, color: COLOR.inkMuted48, marginLeft: "auto" }}>{incident.id}</span>
      </div>

      {incident.immediate_actions?.length > 0 && (
        <>
          <p style={{ ...TYPE.scale.captionStrong, color: COLOR.inkMuted48, textTransform: "uppercase", letterSpacing: "0.08em", margin: `0 0 ${SPACE.sm}px` }}>
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
                  background: COLOR.canvasParchment,
                  borderRadius: RADIUS.xs,
                  border: `1px solid ${COLOR.hairline}`,
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
                  <span style={{ ...TYPE.scale.finePrint, color: COLOR.inkMuted48, marginLeft: SPACE.sm }}>
                    — {a.owner} · {a.eta}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {incident.long_term_fix && (
        <div style={{ marginTop: SPACE.md, padding: `${SPACE.sm}px`, background: COLOR.canvasParchment, borderRadius: RADIUS.sm, border: `1px solid ${COLOR.hairline}` }}>
          <p style={{ ...TYPE.scale.captionStrong, color: COLOR.inkMuted48, margin: `0 0 ${SPACE.xxs}px`, textTransform: "uppercase", letterSpacing: "0.08em" }}>Long-Term Fix</p>
          <p style={{ ...TYPE.scale.caption, color: COLOR.ink, margin: 0 }}>{incident.long_term_fix}</p>
        </div>
      )}
    </div>
  );
}

function SettingsPanel() {
  const fields = [
    { label: "LLM Backend", value: "vllm", hint: "vllm | ollama" },
    { label: "vLLM Base URL", value: "http://localhost:8001/v1", hint: "OpenAI-compatible endpoint" },
    { label: "Model", value: "meta-llama/Llama-3.1-8B-Instruct", hint: "Any HuggingFace model ID" },
    { label: "Temperature", value: "0.1", hint: "0.0 – 1.0 (lower = more deterministic)" },
    { label: "Max Tokens", value: "1500", hint: "Per agent response" },
    { label: "CORS Origins", value: "http://localhost:5173", hint: "Frontend origin(s), comma-separated" },
  ];

  return (
    <div
      style={{
        background: COLOR.canvas,
        borderRadius: RADIUS.lg,
        border: `1px solid ${COLOR.hairline}`,
        padding: `${SPACE.xl}px`,
        marginTop: SPACE.lg,
        display: "flex",
        flexDirection: "column",
        gap: SPACE.sm,
      }}
    >
      <p style={{ ...TYPE.scale.caption, color: COLOR.inkMuted48, margin: `0 0 ${SPACE.sm}px` }}>
        Edit these values in <code style={{ fontFamily: `"SF Mono", monospace`, background: COLOR.canvasParchment, padding: "1px 4px", borderRadius: 4 }}>backend/.env</code> and restart the backend server.
      </p>
      {fields.map((f) => (
        <div
          key={f.label}
          style={{
            display: "flex",
            gap: SPACE.lg,
            padding: `${SPACE.sm}px ${SPACE.md}px`,
            background: COLOR.canvasParchment,
            borderRadius: RADIUS.sm,
            border: `1px solid ${COLOR.hairline}`,
            alignItems: "center",
          }}
        >
          <span style={{ ...TYPE.scale.captionStrong, color: COLOR.ink, minWidth: 160 }}>{f.label}</span>
          <code style={{ ...TYPE.scale.caption, fontFamily: `"SF Mono", monospace`, color: COLOR.primaryFocus, flex: 1 }}>{f.value}</code>
          <span style={{ ...TYPE.scale.finePrint, color: COLOR.inkMuted48 }}>{f.hint}</span>
        </div>
      ))}
    </div>
  );
}
