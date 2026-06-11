import { COLOR, TYPE, SPACE, RADIUS } from "../../constants/tokens.js";
import AgentCard from "../ui/AgentCard.jsx";
import SectionLabel from "../ui/SectionLabel.jsx";

const AGENT_META = {
  triage:       { title: "Triage Agent",        desc: "Groups correlated alerts, dismisses false positives" },
  threat_intel: { title: "Threat Intel Agent",  desc: "Maps MITRE ATT&CK techniques, enriches IOCs" },
  investigation:{ title: "Investigation Agent", desc: "Reconstructs kill-chain timeline" },
  playbook:     { title: "Playbook Agent",      desc: "Generates prioritized remediation steps" },
};

/** @param {{ agents: Array<{key:string,status:string,message:string}> }} props */
export default function AgentPipeline({ agents }) {
  return (
    <section
      style={{
        background: COLOR.surfaceTile1,
        borderRadius: RADIUS.lg,
        padding: `${SPACE.xl}px`,
        marginTop: SPACE.sm,
      }}
    >
      <SectionLabel dark>AI Pipeline · 4 Agents</SectionLabel>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(2, 1fr)",
          gap: SPACE.sm,
          marginTop: SPACE.md,
        }}
      >
        {agents.map((agent) => {
          const meta = AGENT_META[agent.key] || { title: agent.key, desc: "" };
          return (
            <AgentCard
              key={agent.key}
              title={meta.title}
              desc={meta.desc}
              status={agent.status}
              message={agent.message}
            />
          );
        })}
      </div>
    </section>
  );
}
