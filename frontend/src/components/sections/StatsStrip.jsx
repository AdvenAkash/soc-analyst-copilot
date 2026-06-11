import { COLOR, TYPE, SPACE, RADIUS } from "../../constants/tokens.js";

/** @param {{ alertCount: number, incidentCount: number, fpCount: number, agentsDone: number }} props */
export default function StatsStrip({ alertCount, incidentCount, fpCount, agentsDone }) {
  const stats = [
    { label: "SIEM Alerts",       value: alertCount.toLocaleString(), sub: "ingested" },
    { label: "Incidents",         value: incidentCount || "—",        sub: "detected" },
    { label: "False Positives",   value: fpCount || "—",              sub: "dismissed" },
    { label: "AI Agents",         value: `${agentsDone}/4`,           sub: "completed" },
  ];

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(4, 1fr)",
        gap: SPACE.sm,
        marginTop: SPACE.sm,
      }}
    >
      {stats.map((s) => (
        <div
          key={s.label}
          style={{
            background: COLOR.canvasParchment,
            borderRadius: RADIUS.md,
            padding: `${SPACE.md}px ${SPACE.lg}px`,
            border: `1px solid ${COLOR.hairline}`,
          }}
        >
          <div style={{ ...TYPE.scale.finePrint, color: COLOR.inkMuted48, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: SPACE.xs }}>
            {s.label}
          </div>
          <div style={{ ...TYPE.scale.displayMd, color: COLOR.ink, lineHeight: 1 }}>
            {s.value}
          </div>
          <div style={{ ...TYPE.scale.caption, color: COLOR.inkMuted48, marginTop: SPACE.xxs }}>
            {s.sub}
          </div>
        </div>
      ))}
    </div>
  );
}
