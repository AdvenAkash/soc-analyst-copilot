import { COLOR, TYPE, SPACE, RADIUS } from "../../constants/tokens.js";
import Badge from "../ui/Badge.jsx";

/** @param {{ incident: any, selected: boolean, onSelect: (i:any) => void }} props */
export default function IncidentCard({ incident, selected, onSelect }) {
  return (
    <div
      onClick={() => onSelect(incident)}
      style={{
        background: selected ? COLOR.primaryFocus : COLOR.canvas,
        borderRadius: RADIUS.md,
        padding: `${SPACE.sm}px ${SPACE.md}px`,
        cursor: "pointer",
        border: `1px solid ${selected ? COLOR.primaryFocus : COLOR.hairline}`,
        transition: "all 0.15s",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: SPACE.xs }}>
        <span
          style={{
            ...TYPE.scale.finePrint,
            color: selected ? "rgba(255,255,255,0.70)" : COLOR.inkMuted48,
            fontFamily: `"SF Mono", monospace`,
          }}
        >
          {incident.id}
        </span>
        <Badge variant={incident.sev}>{incident.sev}</Badge>
      </div>
      <p
        style={{
          ...TYPE.scale.captionStrong,
          color: selected ? COLOR.onDark : COLOR.ink,
          margin: `${SPACE.xxs}px 0`,
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
        }}
      >
        {incident.title}
      </p>
      <p
        style={{
          ...TYPE.scale.finePrint,
          color: selected ? "rgba(255,255,255,0.60)" : COLOR.inkMuted48,
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
