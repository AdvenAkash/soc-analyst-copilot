import { useRef, useEffect } from "react";
import { COLOR, TYPE, SPACE, RADIUS } from "../../constants/tokens.js";
import Badge from "../ui/Badge.jsx";
import SectionLabel from "../ui/SectionLabel.jsx";

const SEV_BORDER = {
  CRITICAL: COLOR.criticalColor,
  HIGH:     COLOR.highColor,
  MEDIUM:   COLOR.mediumColor,
  LOW:      COLOR.lowColor,
};

/** @param {{ alerts: any[], activeIds: string[], expanded?: boolean }} props */
export default function AlertFeed({ alerts, activeIds, expanded }) {
  const endRef = useRef(null);

  useEffect(() => {
    if (activeIds.length) endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [activeIds.length]);

  return (
    <div
      style={{
        background: COLOR.canvas,
        borderRadius: RADIUS.lg,
        padding: `${SPACE.lg}px`,
        border: `1px solid ${COLOR.hairline}`,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: SPACE.sm }}>
        <SectionLabel>Alert Feed</SectionLabel>
        <span style={{ ...TYPE.scale.finePrint, color: COLOR.inkMuted48, fontWeight: 600 }}>
          {alerts.length} alerts · {activeIds.length} linked
        </span>
      </div>

      <div
        style={{
          maxHeight: expanded ? "none" : 340,
          overflowY: expanded ? "visible" : "auto",
          display: "flex",
          flexDirection: "column",
          gap: 2,
        }}
      >
        {alerts.map((alert) => {
          const isActive   = activeIds.includes(alert.id);
          const borderColor = SEV_BORDER[alert.sev] || COLOR.inkMuted48;

          return (
            <div
              key={alert.id}
              style={{
                display: "grid",
                gridTemplateColumns: "60px auto 1fr auto",
                alignItems: "center",
                gap: SPACE.sm,
                padding: `6px ${SPACE.sm}px`,
                borderRadius: RADIUS.xs,
                background: isActive ? "rgba(0,102,204,0.05)" : "transparent",
                borderLeft: `2px solid ${isActive ? COLOR.primary : borderColor}`,
                opacity: isActive ? 1 : 0.72,
                transition: "background 0.2s, opacity 0.2s",
              }}
            >
              {/* Time */}
              <span
                style={{
                  ...TYPE.scale.finePrint,
                  color: COLOR.inkMuted48,
                  fontFamily: `"SF Mono", "JetBrains Mono", monospace`,
                  letterSpacing: "0.02em",
                }}
              >
                {alert.time}
              </span>

              {/* Severity badge */}
              <Badge variant={alert.sev}>{alert.sev}</Badge>

              {/* Rule + host */}
              <div style={{ minWidth: 0 }}>
                <div
                  style={{
                    ...TYPE.scale.captionStrong,
                    color: COLOR.ink,
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {alert.rule}
                </div>
                <div
                  style={{
                    ...TYPE.scale.finePrint,
                    color: COLOR.inkMuted48,
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                    fontFamily: `"SF Mono", "JetBrains Mono", monospace`,
                  }}
                >
                  {alert.src} → {alert.dst}
                </div>
              </div>

              {/* Alert ID */}
              <span
                style={{
                  ...TYPE.scale.finePrint,
                  color: isActive ? COLOR.primary : COLOR.inkMuted48,
                  fontFamily: `"SF Mono", "JetBrains Mono", monospace`,
                  fontWeight: isActive ? 600 : 400,
                }}
              >
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
