import { COLOR, TYPE, SPACE, RADIUS } from "../../constants/tokens.js";
import Button from "../ui/Button.jsx";

/** @param {{ status: string, alertCount: number, incidentCount: number, onRun: () => void }} props */
export default function SubNav({ status, alertCount, incidentCount, onRun }) {
  const isRunning = status === "running";
  return (
    <div
      style={{
        position: "sticky",
        top: 44,
        zIndex: 99,
        background: "rgba(245,245,247,0.88)",
        backdropFilter: "blur(20px) saturate(180%)",
        WebkitBackdropFilter: "blur(20px) saturate(180%)",
        borderBottom: `1px solid ${COLOR.hairline}`,
        height: 52,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: `0 ${SPACE.lg}px`,
        maxWidth: "100%",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: SPACE.xl }}>
        <span style={{ ...TYPE.scale.captionStrong, color: COLOR.ink }}>
          Security Operations Center
        </span>
        <span style={{ ...TYPE.scale.caption, color: COLOR.inkMuted48 }}>
          {alertCount} alerts · {incidentCount} incidents
        </span>
      </div>
      <Button variant="primary" onClick={onRun} disabled={isRunning}>
        {isRunning ? "Analyzing…" : "Run Analysis"}
      </Button>
    </div>
  );
}
