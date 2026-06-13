import { COLOR, TYPE, SPACE, RADIUS } from "../../constants/tokens.js";
import AgentCard from "../ui/AgentCard.jsx";
import SectionLabel from "../ui/SectionLabel.jsx";

const AGENT_META = [
  { key: "triage",       step: 1, title: "Triage Agent",            desc: "Groups correlated alerts, dismisses false positives" },
  { key: "threat_intel", step: 2, title: "Threat Intel Agent",      desc: "Maps MITRE ATT&CK techniques, enriches IOCs" },
  { key: "investigation",step: 3, title: "Investigation Agent",     desc: "Reconstructs kill-chain timeline" },
  { key: "playbook",     step: 4, title: "Playbook Agent",          desc: "Generates prioritized remediation steps" },
  { key: "exec_summary", step: 5, title: "Executive Summary Agent", desc: "Writes a plain-English CISO briefing" },
];

const TOTAL = AGENT_META.length;

/** @param {{ agents: Array<{key:string,status:string,message:string}> }} props */
export default function AgentPipeline({ agents }) {
  const agentMap  = Object.fromEntries(agents.map((a) => [a.key, a]));
  const doneCount = agents.filter((a) => a.status === "done").length;

  return (
    <section
      style={{
        background: COLOR.surfaceTile1,
        borderRadius: RADIUS.lg,
        padding: `${SPACE.xl}px`,
        marginTop: SPACE.xs,
      }}
    >
      {/* Section header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: SPACE.md,
        }}
      >
        <SectionLabel dark>AI Pipeline</SectionLabel>
        <div style={{ display: "flex", alignItems: "center", gap: SPACE.xs }}>
          {/* Progress bar */}
          <div
            style={{
              width: 80,
              height: 3,
              background: "rgba(255,255,255,0.10)",
              borderRadius: RADIUS.pill,
              overflow: "hidden",
            }}
          >
            <div
              style={{
                width: `${(doneCount / TOTAL) * 100}%`,
                height: "100%",
                background: doneCount === TOTAL ? COLOR.statusDone : COLOR.primary,
                borderRadius: RADIUS.pill,
                transition: "width 0.4s ease",
              }}
            />
          </div>
          <span style={{ ...TYPE.scale.finePrint, color: "rgba(255,255,255,0.38)", minWidth: 28 }}>
            {doneCount}/{TOTAL}
          </span>
        </div>
      </div>

      {/* Pipeline: 5 cards in a flex-wrap row */}
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: SPACE.sm,
        }}
      >
        {AGENT_META.map((meta) => {
          const agentState = agentMap[meta.key] || { status: "waiting", message: "" };
          return (
            <div key={meta.key} style={{ flex: "1 1 180px", maxWidth: 220 }}>
              <AgentCard
                title={meta.title}
                desc={meta.desc}
                status={agentState.status}
                message={agentState.message}
                step={meta.step}
              />
            </div>
          );
        })}
      </div>
    </section>
  );
}
