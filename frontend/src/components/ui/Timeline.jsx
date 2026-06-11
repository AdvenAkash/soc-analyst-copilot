import { COLOR, TYPE, SPACE, RADIUS } from "../../constants/tokens.js";
import Badge from "./Badge.jsx";

const STAGE_COLORS = {
  "Reconnaissance":      COLOR.lowColor,
  "Initial Access":      COLOR.mediumColor,
  "Privilege Escalation":COLOR.highColor,
  "Persistence":         COLOR.highColor,
  "Lateral Movement":    COLOR.highColor,
  "Collection":          COLOR.criticalColor,
  "Exfiltration":        COLOR.criticalColor,
};

/** @param {{ events: Array<{time:string,event:string,stage:string,alert_id:string}> }} props */
export default function Timeline({ events }) {
  if (!events?.length) return null;
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
      {events.map((ev, i) => (
        <div key={i} style={{ display: "flex", gap: SPACE.md, position: "relative" }}>
          {/* Vertical line */}
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", width: 16, flexShrink: 0 }}>
            <div
              style={{
                width: 10,
                height: 10,
                borderRadius: "50%",
                background: STAGE_COLORS[ev.stage] || COLOR.inkMuted48,
                marginTop: SPACE.xs,
                flexShrink: 0,
              }}
            />
            {i < events.length - 1 && (
              <div style={{ width: 1, flex: 1, background: COLOR.hairline, minHeight: 16 }} />
            )}
          </div>
          <div style={{ paddingBottom: SPACE.md, flex: 1 }}>
            <div style={{ display: "flex", alignItems: "center", gap: SPACE.xs, flexWrap: "wrap" }}>
              <span style={{ ...TYPE.scale.finePrint, color: COLOR.inkMuted48, fontFamily: `"SF Mono", monospace` }}>
                {ev.time}
              </span>
              <span style={{ ...TYPE.scale.finePrint, color: COLOR.inkMuted48, background: COLOR.canvasParchment, padding: `1px ${SPACE.xxs}px`, borderRadius: RADIUS.xs }}>
                {ev.alert_id}
              </span>
            </div>
            <p style={{ ...TYPE.scale.caption, color: COLOR.ink, margin: `${SPACE.xxs}px 0 ${SPACE.xxs}px` }}>
              {ev.event}
            </p>
            <Badge variant={ev.stage === "Exfiltration" || ev.stage === "Collection" ? "CRITICAL" : ev.stage === "Reconnaissance" ? "LOW" : "HIGH"}>
              {ev.stage}
            </Badge>
          </div>
        </div>
      ))}
    </div>
  );
}
