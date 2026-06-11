import { COLOR, TYPE, SPACE, RADIUS } from "../../constants/tokens.js";
import Badge from "../ui/Badge.jsx";

/** @param {{ incidents: any[], status: string }} props */
export default function StickyBar({ incidents, status }) {
  if (!incidents.length && status !== "done") return null;
  const critical = incidents.filter((i) => i.sev === "CRITICAL").length;
  const high = incidents.filter((i) => i.sev === "HIGH").length;
  return (
    <div
      style={{
        position: "fixed",
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 200,
        background: "rgba(245,245,247,0.92)",
        backdropFilter: "blur(20px) saturate(180%)",
        WebkitBackdropFilter: "blur(20px) saturate(180%)",
        borderTop: `1px solid ${COLOR.hairline}`,
        height: 52,
        display: "flex",
        alignItems: "center",
        gap: SPACE.lg,
        padding: `0 ${SPACE.lg}px`,
      }}
    >
      <span style={{ ...TYPE.scale.captionStrong, color: COLOR.ink }}>
        Pipeline complete
      </span>
      <span style={{ ...TYPE.scale.caption, color: COLOR.inkMuted48 }}>
        {incidents.length} incident{incidents.length !== 1 ? "s" : ""} detected
      </span>
      {critical > 0 && <Badge variant="CRITICAL">{critical} Critical</Badge>}
      {high > 0 && <Badge variant="HIGH">{high} High</Badge>}
    </div>
  );
}
