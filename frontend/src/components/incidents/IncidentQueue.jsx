import { COLOR, TYPE, SPACE, RADIUS } from "../../constants/tokens.js";
import IncidentCard from "./IncidentCard.jsx";
import SectionLabel from "../ui/SectionLabel.jsx";

/** @param {{ incidents: any[], selected: any, onSelect: (i:any) => void }} props */
export default function IncidentQueue({ incidents, selected, onSelect }) {
  return (
    <div
      style={{
        background: COLOR.canvas,
        borderRadius: RADIUS.lg,
        padding: SPACE.lg,
        border: `1px solid ${COLOR.hairline}`,
      }}
    >
      <SectionLabel>
        Incident Queue · {incidents.length} incident{incidents.length !== 1 ? "s" : ""}
      </SectionLabel>
      <div
        style={{
          marginTop: SPACE.sm,
          display: "flex",
          flexDirection: "column",
          gap: SPACE.xs,
          maxHeight: 400,
          overflowY: "auto",
        }}
      >
        {incidents.length === 0 && (
          <p style={{ ...TYPE.scale.caption, color: COLOR.inkMuted48, margin: 0 }}>
            Run the pipeline to generate incidents.
          </p>
        )}
        {incidents.map((inc) => (
          <IncidentCard
            key={inc.id}
            incident={inc}
            selected={selected?.id === inc.id}
            onSelect={onSelect}
          />
        ))}
      </div>
    </div>
  );
}
