import { COLOR, TYPE, SPACE, RADIUS } from "../../constants/tokens.js";
import Badge from "../ui/Badge.jsx";

/** @param {{ incident: any, selected: boolean, onSelect: (i:any) => void }} props */
export default function IncidentCard({ incident, selected, onSelect }) {
  return (
    <div
      onClick={() => onSelect(incident)}
      style={{
        background: selected ? "rgba(0,102,204,0.05)" : COLOR.canvas,
        borderRadius: RADIUS.md,
        padding: `${SPACE.sm}px ${SPACE.md}px`,
        cursor: "pointer",
        border: `1px solid ${selected ? "rgba(0,102,204,0.22)" : COLOR.hairline}`,
        borderLeft: `3px solid ${selected ? COLOR.primary : "transparent"}`,
        transition: "all 0.15s ease",
      }}
    >
      {/* ID row */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: SPACE.xs,
          marginBottom: SPACE.xxs,
        }}
      >
        <span
          style={{
            ...TYPE.scale.finePrint,
            color: selected ? COLOR.primary : COLOR.inkMuted48,
            fontFamily: `"SF Mono", "JetBrains Mono", monospace`,
            fontWeight: selected ? 600 : 400,
          }}
        >
          {incident.id}
        </span>
        <Badge variant={incident.sev}>{incident.sev}</Badge>
      </div>

      {/* Title */}
      <p
        style={{
          ...TYPE.scale.captionStrong,
          color: COLOR.ink,
          margin: `0 0 ${SPACE.xxs}px`,
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
        }}
      >
        {incident.title}
      </p>

      {/* Summary */}
      <p
        style={{
          ...TYPE.scale.finePrint,
          color: COLOR.inkMuted48,
          margin: 0,
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
        }}
      >
        {incident.summary}
      </p>
    </div>
  );
}
