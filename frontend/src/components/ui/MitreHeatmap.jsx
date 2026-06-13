/**
 * MitreHeatmap — 14 MITRE ATT&CK tactics as colored cells.
 * Empty: white. 1 technique: light blue. 2+: Action Blue. Critical stages: red.
 */
import { COLOR, TYPE, RADIUS, SPACE } from "../../constants/tokens.js";
import { ALL_TACTICS } from "../../utils/metrics.js";

const CRITICAL_TACTICS = new Set([
  "Exfiltration", "Impact", "Command & Control",
]);

function cellColor(count, tactic) {
  if (count === 0) return COLOR.canvas;
  if (CRITICAL_TACTICS.has(tactic)) return "rgba(255,59,48,0.75)";
  if (count === 1) return "rgba(0,102,204,0.20)";
  if (count === 2) return "rgba(0,102,204,0.50)";
  return COLOR.primary;
}

function textColor(count, tactic) {
  if (count === 0) return COLOR.inkMuted48;
  if (CRITICAL_TACTICS.has(tactic) && count > 0) return "#ffffff";
  if (count >= 2) return "#ffffff";
  return COLOR.primary;
}

export default function MitreHeatmap({ tacticCounts }) {
  return (
    <div>
      {/* Legend */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: SPACE.md, marginBottom: SPACE.md, alignItems: "center" }}>
        {[
          { label: "Not detected",  bg: COLOR.canvas,          border: `1px solid ${COLOR.hairline}` },
          { label: "1 technique",   bg: "rgba(0,102,204,0.20)", border: "none" },
          { label: "2 techniques",  bg: "rgba(0,102,204,0.50)", border: "none" },
          { label: "3+ techniques", bg: COLOR.primary,          border: "none" },
          { label: "Critical stage",bg: "rgba(255,59,48,0.75)", border: "none" },
        ].map(({ label, bg, border }) => (
          <div key={label} style={{ display: "flex", alignItems: "center", gap: SPACE.xxs }}>
            <div style={{
              width: 14, height: 14,
              background: bg,
              border: border || "none",
              borderRadius: RADIUS.xs,
              flexShrink: 0,
            }} />
            <span style={{ ...TYPE.scale.finePrint, color: COLOR.inkMuted48 }}>{label}</span>
          </div>
        ))}
      </div>

      {/* Heatmap grid */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(7, 1fr)",
        gap: SPACE.xs,
      }}>
        {ALL_TACTICS.map(tactic => {
          const count = tacticCounts[tactic] ?? 0;
          return (
            <div
              key={tactic}
              title={`${tactic}: ${count} technique(s) detected`}
              style={{
                background: cellColor(count, tactic),
                border: count === 0 ? `1px solid ${COLOR.hairline}` : "none",
                borderRadius: RADIUS.sm,
                padding: `${SPACE.sm}px ${SPACE.xs}px`,
                textAlign: "center",
              }}
            >
              <p style={{
                ...TYPE.scale.finePrint,
                color: textColor(count, tactic),
                marginBottom: 2,
                fontWeight: count > 0 ? 600 : 400,
                margin: 0,
              }}>
                {tactic}
              </p>
              {count > 0 && (
                <p style={{
                  ...TYPE.scale.captionStrong,
                  color: textColor(count, tactic),
                  fontSize: 18,
                  margin: 0,
                  marginTop: 4,
                }}>
                  {count}
                </p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
