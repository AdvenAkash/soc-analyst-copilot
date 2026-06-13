import { COLOR, TYPE, SPACE, RADIUS } from "../../constants/tokens.js";
import Button from "../ui/Button.jsx";

/** @param {{ status: string, onRun: () => void }} props */
export default function HeroSection({ status, onRun }) {
  const isRunning = status === "running";
  const isDone    = status === "done";

  return (
    <section
      style={{
        background: COLOR.surfaceTile1,
        borderRadius: RADIUS.lg,
        padding: `${SPACE.section}px ${SPACE.xxl}px`,
        marginTop: SPACE.sm,
        display: "flex",
        flexDirection: "column",
        gap: SPACE.md,
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Background radial glows — purely decorative */}
      <div
        style={{
          position: "absolute",
          top: -80,
          right: -80,
          width: 380,
          height: 380,
          borderRadius: "50%",
          background: "radial-gradient(circle, rgba(0,102,204,0.14) 0%, transparent 65%)",
          pointerEvents: "none",
        }}
      />
      <div
        style={{
          position: "absolute",
          bottom: -50,
          left: -50,
          width: 260,
          height: 260,
          borderRadius: "50%",
          background: "radial-gradient(circle, rgba(50,215,75,0.07) 0%, transparent 65%)",
          pointerEvents: "none",
        }}
      />

      {/* Status pill */}
      <div
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 6,
          padding: `4px 12px`,
          borderRadius: RADIUS.pill,
          background: "rgba(255,255,255,0.06)",
          border: "1px solid rgba(255,255,255,0.10)",
          width: "fit-content",
        }}
      >
        <span
          style={{
            width: 6,
            height: 6,
            borderRadius: "50%",
            background: isDone
              ? COLOR.statusDone
              : isRunning
              ? COLOR.primaryOnDark
              : "rgba(255,255,255,0.32)",
            animation: isRunning ? "pulse 1.2s infinite" : "none",
            flexShrink: 0,
          }}
        />
        <span
          style={{
            ...TYPE.scale.navLink,
            color: isDone
              ? COLOR.statusDone
              : isRunning
              ? COLOR.primaryOnDark
              : "rgba(255,255,255,0.48)",
          }}
        >
          {isDone
            ? "Analysis Complete"
            : isRunning
            ? "Pipeline Running"
            : "AI-Powered SOC Operations"}
        </span>
      </div>

      {/* Hero headline */}
      <h1
        style={{
          ...TYPE.scale.heroDisplay,
          color: COLOR.onDark,
          margin: 0,
          maxWidth: 720,
          animation: "fadeInUp 0.35s ease",
        }}
      >
        {isDone
          ? "Threats Identified."
          : isRunning
          ? "Analyzing Threats."
          : "SOC Analyst Copilot."}
      </h1>

      {/* Lead copy */}
      <p
        style={{
          ...TYPE.scale.lead,
          color: COLOR.bodyMuted,
          margin: 0,
          maxWidth: 580,
        }}
      >
        A 4-agent AI pipeline processes SIEM alerts through triage, threat
        intelligence, investigation, and playbook generation — powered by
        local AMD ROCm inference on MI300X.
      </p>

      {/* CTA row */}
      <div style={{ display: "flex", alignItems: "center", gap: SPACE.sm, marginTop: SPACE.xs }}>
        <Button variant="primary" onClick={onRun} disabled={isRunning}>
          {isRunning ? "Pipeline Running…" : isDone ? "Re-run Analysis" : "Run AI Pipeline"}
        </Button>
        {!isRunning && (
          <Button variant="ghost-dark">
            View Architecture
          </Button>
        )}
      </div>
    </section>
  );
}
