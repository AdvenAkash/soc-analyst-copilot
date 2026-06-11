import { COLOR, TYPE, SPACE, RADIUS } from "../../constants/tokens.js";

const STATUS_DOT = {
  waiting: { background: COLOR.statusWaiting },
  running: { background: COLOR.statusRunning, animation: "pulse 1.2s infinite" },
  done:    { background: COLOR.statusDone },
  error:   { background: COLOR.statusError },
};

/** @param {{ title: string, desc: string, status: string, message: string }} props */
export default function AgentCard({ title, desc, status, message }) {
  return (
    <div
      style={{
        background: COLOR.surfaceTile2,
        borderRadius: RADIUS.md,
        padding: `${SPACE.md}px`,
        display: "flex",
        flexDirection: "column",
        gap: SPACE.xs,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: SPACE.xs }}>
        <span
          style={{
            width: 8,
            height: 8,
            borderRadius: "50%",
            flexShrink: 0,
            ...STATUS_DOT[status] || STATUS_DOT.waiting,
          }}
        />
        <span style={{ ...TYPE.scale.captionStrong, color: COLOR.onDark }}>{title}</span>
      </div>
      <span style={{ ...TYPE.scale.caption, color: "rgba(255,255,255,0.48)" }}>{desc}</span>
      {message && (
        <span
          style={{
            ...TYPE.scale.finePrint,
            color: status === "done" ? COLOR.statusDone : status === "error" ? COLOR.statusError : "rgba(255,255,255,0.60)",
            marginTop: SPACE.xxs,
          }}
        >
          {message}
        </span>
      )}
    </div>
  );
}
