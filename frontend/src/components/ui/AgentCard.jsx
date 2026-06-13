import { COLOR, TYPE, SPACE, RADIUS } from "../../constants/tokens.js";

const STATUS_COLOR = {
  waiting: COLOR.statusWaiting,
  running: COLOR.statusRunning,
  done:    COLOR.statusDone,
  error:   COLOR.statusError,
};

const STATUS_LABEL = {
  waiting: "Waiting",
  running: "Running",
  done:    "Done",
  error:   "Error",
};

/** @param {{ title: string, desc: string, status: string, message: string, step: number }} props */
export default function AgentCard({ title, desc, status, message, step }) {
  const dotColor  = STATUS_COLOR[status]  || STATUS_COLOR.waiting;
  const isRunning = status === "running";
  const isDone    = status === "done";
  const isError   = status === "error";

  return (
    <div
      style={{
        background: isDone ? "rgba(50,215,75,0.04)" : isError ? "rgba(255,59,48,0.04)" : COLOR.surfaceTile2,
        borderRadius: RADIUS.md,
        padding: `${SPACE.md}px`,
        display: "flex",
        flexDirection: "column",
        gap: SPACE.xs,
        border: `1px solid ${
          isDone  ? "rgba(50,215,75,0.18)"
          : isError ? "rgba(255,59,48,0.18)"
          : isRunning ? `rgba(0,102,204,0.28)`
          : "rgba(255,255,255,0.06)"
        }`,
        transition: "border-color 0.25s, background 0.25s",
      }}
    >
      {/* Header row */}
      <div style={{ display: "flex", alignItems: "center", gap: SPACE.sm }}>
        {/* Step number */}
        <div
          style={{
            width: 22,
            height: 22,
            borderRadius: "50%",
            background: isDone
              ? COLOR.statusDone
              : isRunning
              ? COLOR.primary
              : isError
              ? COLOR.statusError
              : "rgba(255,255,255,0.10)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
            animation: isRunning ? "pulseRing 1.8s infinite" : "none",
          }}
        >
          {isDone ? (
            <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
              <path d="M1 4L3.5 6.5L9 1" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          ) : (
            <span style={{ ...TYPE.scale.finePrint, color: "rgba(255,255,255,0.75)", fontWeight: 700 }}>
              {step}
            </span>
          )}
        </div>

        {/* Title + status label */}
        <div style={{ flex: 1 }}>
          <span style={{ ...TYPE.scale.captionStrong, color: COLOR.onDark }}>{title}</span>
        </div>

        {/* Status badge */}
        <span
          style={{
            ...TYPE.scale.finePrint,
            fontWeight: 600,
            color: dotColor,
            letterSpacing: "0.06em",
            textTransform: "uppercase",
          }}
        >
          {STATUS_LABEL[status] || "—"}
        </span>
      </div>

      {/* Description */}
      <span
        style={{
          ...TYPE.scale.caption,
          color: "rgba(255,255,255,0.42)",
          paddingLeft: 22 + SPACE.sm,
        }}
      >
        {desc}
      </span>

      {/* Status message */}
      {message && (
        <div
          style={{
            ...TYPE.scale.finePrint,
            color: isDone
              ? COLOR.statusDone
              : isError
              ? COLOR.statusError
              : "rgba(255,255,255,0.55)",
            marginTop: SPACE.xxs,
            paddingLeft: 22 + SPACE.sm,
            fontStyle: "italic",
          }}
        >
          {message}
        </div>
      )}
    </div>
  );
}
