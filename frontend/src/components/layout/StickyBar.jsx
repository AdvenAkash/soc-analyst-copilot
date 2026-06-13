import { COLOR, TYPE, SPACE, RADIUS } from "../../constants/tokens.js";
import Badge from "../ui/Badge.jsx";

/** @param {{ incidents: any[], status: string }} props */
export default function StickyBar({ incidents, status }) {
  if (!incidents.length && status !== "done") return null;

  const critical = incidents.filter((i) => i.sev === "CRITICAL").length;
  const high     = incidents.filter((i) => i.sev === "HIGH").length;
  const medium   = incidents.filter((i) => i.sev === "MEDIUM").length;

  return (
    <div
      style={{
        position: "fixed",
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 200,
        background: "rgba(245,245,247,0.94)",
        backdropFilter: "saturate(180%) blur(20px)",
        WebkitBackdropFilter: "saturate(180%) blur(20px)",
        borderTop: `1px solid ${COLOR.hairline}`,
        height: 56,
        display: "flex",
        alignItems: "center",
        gap: SPACE.lg,
        padding: `0 ${SPACE.xl}px`,
      }}
    >
      {/* Done indicator */}
      <div style={{ display: "flex", alignItems: "center", gap: SPACE.xs }}>
        <div
          style={{
            width: 20,
            height: 20,
            borderRadius: "50%",
            background: COLOR.statusDone,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
        >
          <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
            <path d="M1 4L3.5 6.5L9 1" stroke="white" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
        <span style={{ ...TYPE.scale.captionStrong, color: COLOR.ink }}>
          Pipeline complete
        </span>
      </div>

      <div style={{ width: 1, height: 20, background: COLOR.hairline }} />

      {/* Incident count */}
      <span style={{ ...TYPE.scale.caption, color: COLOR.inkMuted48 }}>
        {incidents.length} incident{incidents.length !== 1 ? "s" : ""} detected
      </span>

      {/* Severity breakdown */}
      <div style={{ display: "flex", alignItems: "center", gap: SPACE.xs }}>
        {critical > 0 && <Badge variant="CRITICAL">{critical} Critical</Badge>}
        {high > 0     && <Badge variant="HIGH">{high} High</Badge>}
        {medium > 0   && <Badge variant="MEDIUM">{medium} Medium</Badge>}
      </div>

      {/* Spacer */}
      <div style={{ flex: 1 }} />

      {/* Scroll to top hint */}
      <span style={{ ...TYPE.scale.finePrint, color: COLOR.inkMuted48 }}>
        Scroll up to review incidents
      </span>
    </div>
  );
}
