import { COLOR, TYPE, SPACE, RADIUS } from "../../constants/tokens.js";
import Button from "../ui/Button.jsx";

/** @param {{ status: string, onRun: () => void }} props */
export default function HeroSection({ status, onRun }) {
  const isRunning = status === "running";
  const isDone = status === "done";

  return (
    <section
      style={{
        background: COLOR.canvas,
        borderRadius: RADIUS.lg,
        padding: `${SPACE.xxl}px ${SPACE.xxl}px`,
        marginTop: SPACE.lg,
        display: "flex",
        flexDirection: "column",
        gap: SPACE.md,
      }}
    >
      <p style={{ ...TYPE.scale.tagline, color: COLOR.primaryFocus, margin: 0 }}>
        AI-Powered SOC Operations
      </p>
      <h1 style={{ ...TYPE.scale.heroDisplay, color: COLOR.ink, margin: 0 }}>
        {isDone ? "Analysis Complete." : isRunning ? "Analyzing Threats." : "SOC Analyst Copilot."}
      </h1>
      <p style={{ ...TYPE.scale.lead, color: COLOR.inkMuted48, margin: 0, maxWidth: 640 }}>
        A 4-agent AI pipeline processes 500+ SIEM alerts through triage, threat intelligence,
        investigation, and playbook generation — powered by local AMD ROCm vLLM inference.
      </p>
      <div style={{ marginTop: SPACE.sm }}>
        <Button variant="primary" onClick={onRun} disabled={isRunning}>
          {isRunning ? "Pipeline Running…" : isDone ? "Re-run Analysis" : "Run AI Pipeline"}
        </Button>
      </div>
    </section>
  );
}
