import { COLOR, TYPE, SPACE, RADIUS } from "../../constants/tokens.js";
import Button from "../ui/Button.jsx";

/** @param {{ status: string, alertCount: number, incidentCount: number, onRun: () => void }} props */
export default function SubNav({ status, alertCount, incidentCount, onRun }) {
  const isRunning = status === "running";
  const isDone    = status === "done";

  return (
    <div
      style={{
        position: "sticky",
        top: 44,
        zIndex: 99,
        background: "rgba(245,245,247,0.92)",
        backdropFilter: "saturate(180%) blur(20px)",
        WebkitBackdropFilter: "saturate(180%) blur(20px)",
        borderBottom: `1px solid ${COLOR.hairline}`,
        height: 52,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: `0 ${SPACE.xl}px`,
      }}
    >
      {/* Left: brand name + live status chips */}
      <div style={{ display: "flex", alignItems: "center", gap: SPACE.lg }}>
        <span style={{ ...TYPE.scale.tagline, color: COLOR.ink }}>
          Security Operations Center
        </span>

        <div style={{ display: "flex", alignItems: "center", gap: SPACE.xs }}>
          <Chip>{alertCount} alerts</Chip>
          {incidentCount > 0 && (
            <Chip accent>{incidentCount} incident{incidentCount !== 1 ? "s" : ""}</Chip>
          )}
          {isDone && <Chip success>Pipeline complete</Chip>}
          {isRunning && <Chip running>Analyzing…</Chip>}
        </div>
      </div>

      {/* Right: Run Analysis CTA */}
      <Button variant="primary" size="default" onClick={onRun} disabled={isRunning}>
        {isRunning ? "Analyzing…" : isDone ? "Re-run Analysis" : "Run Analysis"}
      </Button>
    </div>
  );
}

function Chip({ children, accent, success, running }) {
  const bg = running  ? `rgba(0,102,204,0.08)`
           : success  ? `rgba(50,215,75,0.10)`
           : accent   ? COLOR.criticalBg
           : COLOR.canvasParchment;
  const color = running  ? COLOR.primary
              : success  ? COLOR.statusDone
              : accent   ? COLOR.criticalColor
              : COLOR.inkMuted48;
  return (
    <span
      style={{
        ...TYPE.scale.finePrint,
        fontWeight: 600,
        color,
        background: bg,
        border: `1px solid ${running ? "rgba(0,102,204,0.18)" : success ? "rgba(50,215,75,0.20)" : accent ? "rgba(255,59,48,0.18)" : COLOR.hairline}`,
        borderRadius: RADIUS.pill,
        padding: `3px 8px`,
        display: "inline-flex",
        alignItems: "center",
        gap: 4,
        whiteSpace: "nowrap",
      }}
    >
      {running && (
        <span
          style={{
            width: 5,
            height: 5,
            borderRadius: "50%",
            background: COLOR.primary,
            display: "inline-block",
            animation: "pulse 1.2s infinite",
          }}
        />
      )}
      {children}
    </span>
  );
}
