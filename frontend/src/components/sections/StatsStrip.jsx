import { COLOR, TYPE, SPACE, RADIUS } from "../../constants/tokens.js";

/** @param {{ alertCount: number, incidentCount: number, fpCount: number, agentsDone: number }} props */
export default function StatsStrip({ alertCount, incidentCount, fpCount, agentsDone }) {
  const allDone = agentsDone === 5;

  const stats = [
    {
      label: "SIEM Alerts",
      value: alertCount.toLocaleString(),
      sub: "ingested",
      valueColor: COLOR.ink,
      bg: COLOR.canvas,
    },
    {
      label: "Incidents",
      value: incidentCount > 0 ? incidentCount : "—",
      sub: incidentCount > 0 ? `critical threat${incidentCount !== 1 ? "s" : ""}` : "none detected",
      valueColor: incidentCount > 0 ? COLOR.criticalColor : COLOR.inkMuted48,
      bg: incidentCount > 0 ? "rgba(255,59,48,0.04)" : COLOR.canvas,
    },
    {
      label: "False Positives",
      value: fpCount > 0 ? fpCount : "—",
      sub: fpCount > 0 ? "dismissed" : "none found",
      valueColor: fpCount > 0 ? COLOR.fpColor : COLOR.inkMuted48,
      bg: COLOR.canvas,
    },
    {
      label: "AI Agents",
      value: `${agentsDone}/5`,
      sub: allDone ? "pipeline complete" : agentsDone > 0 ? "running…" : "ready",
      valueColor: allDone ? COLOR.statusDone : agentsDone > 0 ? COLOR.primary : COLOR.inkMuted48,
      bg: allDone ? "rgba(50,215,75,0.04)" : COLOR.canvas,
    },
  ];

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(4, 1fr)",
        gap: SPACE.xs,
        marginTop: SPACE.xs,
      }}
    >
      {stats.map((s) => (
        <div
          key={s.label}
          style={{
            background: s.bg,
            borderRadius: RADIUS.lg,
            padding: `${SPACE.lg}px ${SPACE.lg}px`,
            border: `1px solid ${COLOR.hairline}`,
            display: "flex",
            flexDirection: "column",
            gap: SPACE.xxs,
          }}
        >
          <div
            style={{
              ...TYPE.scale.navLink,
              color: COLOR.inkMuted48,
              textTransform: "uppercase",
              letterSpacing: "0.09em",
              fontWeight: 600,
            }}
          >
            {s.label}
          </div>
          <div
            style={{
              ...TYPE.scale.displayMd,
              color: s.valueColor,
              lineHeight: 1,
              marginTop: SPACE.xxs,
            }}
          >
            {s.value}
          </div>
          <div
            style={{
              ...TYPE.scale.caption,
              color: COLOR.inkMuted48,
              marginTop: SPACE.xxs,
            }}
          >
            {s.sub}
          </div>
        </div>
      ))}
    </div>
  );
}
