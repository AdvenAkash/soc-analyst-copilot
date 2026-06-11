import { useRef, useEffect } from "react";
import { COLOR, TYPE, SPACE, RADIUS } from "../../constants/tokens.js";
import Badge from "../ui/Badge.jsx";
import SectionLabel from "../ui/SectionLabel.jsx";

/** @param {{ alerts: any[], activeIds: string[] }} props */
export default function AlertFeed({ alerts, activeIds }) {
  const endRef = useRef(null);

  useEffect(() => {
    if (activeIds.length) endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [activeIds.length]);

  return (
    <div
      style={{
        background: COLOR.canvas,
        borderRadius: RADIUS.lg,
        padding: SPACE.lg,
        border: `1px solid ${COLOR.hairline}`,
      }}
    >
      <SectionLabel>Alert Feed · {alerts.length} alerts</SectionLabel>
      <div
        style={{
          marginTop: SPACE.sm,
          maxHeight: 340,
          overflowY: "auto",
          display: "flex",
          flexDirection: "column",
          gap: 1,
        }}
      >
        {alerts.map((alert) => {
          const isActive = activeIds.includes(alert.id);
          return (
            <div
              key={alert.id}
              style={{
                display: "flex",
                alignItems: "flex-start",
                gap: SPACE.sm,
                padding: `${SPACE.xs}px`,
                borderRadius: RADIUS.xs,
                background: isActive ? "rgba(0,102,204,0.05)" : "transparent",
                borderLeft: isActive ? `2px solid ${COLOR.primaryFocus}` : "2px solid transparent",
                transition: "background 0.2s",
              }}
            >
              <span style={{ ...TYPE.scale.finePrint, color: COLOR.inkMuted48, fontFamily: `"SF Mono", monospace`, minWidth: 60 }}>
                {alert.time}
              </span>
              <Badge variant={alert.sev}>{alert.sev}</Badge>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ ...TYPE.scale.captionStrong, color: COLOR.ink, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {alert.rule}
                </div>
                <div style={{ ...TYPE.scale.finePrint, color: COLOR.inkMuted48, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {alert.src} → {alert.dst} · {alert.host}
                </div>
              </div>
              <span style={{ ...TYPE.scale.finePrint, color: COLOR.inkMuted48, fontFamily: `"SF Mono", monospace` }}>
                {alert.id}
              </span>
            </div>
          );
        })}
        <div ref={endRef} />
      </div>
    </div>
  );
}
