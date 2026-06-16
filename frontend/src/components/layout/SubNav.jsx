import { useRef } from "react";
import { COLOR, TYPE, SPACE, RADIUS } from "../../constants/tokens.js";
import Button from "../ui/Button.jsx";

/**
 * @param {{
 *   status: string,
 *   alertCount: number,
 *   incidentCount: number,
 *   isLive: boolean,
 *   onRun: () => void,
 *   onLive: () => void,
 *   onReset: () => void,
 *   onUpload: (alerts: any[]) => void,
 * }} props
 */
export default function SubNav({ status, alertCount, incidentCount, isLive, onRun, onLive, onReset, onUpload }) {
  const fileRef = useRef(null);

  function handleFileChange(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const parsed = JSON.parse(ev.target.result);
        if (Array.isArray(parsed) && parsed.length > 0) onUpload(parsed);
      } catch {
        alert("Invalid JSON file — expected an array of alert objects.");
      }
    };
    reader.readAsText(file);
    e.target.value = "";
  }
  const phase     = status === "done" ? "complete" : status;
  const isRunning = phase === "running";
  const isDone    = phase === "complete";

  return (
    <div
      style={{
        position: "sticky",
        top: 44,
        zIndex: 99,
        background: "rgba(245,245,247,0.92)",
        backdropFilter: "saturate(180%) blur(20px)",
        WebkitBackdropFilter: "saturate(180%) blur(20px)",
        borderBottom: `1px solid ${COLOR.hairline}`,
        height: 52,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: `0 ${SPACE.xl}px`,
      }}
    >
      {/* Left: brand name + status chips */}
      <div style={{ display: "flex", alignItems: "center", gap: SPACE.lg }}>
        <span style={{ ...TYPE.scale.tagline, color: COLOR.ink }}>
          Security Operations Center
        </span>

        <div style={{ display: "flex", alignItems: "center", gap: SPACE.xs }}>
          <Chip>{alertCount} alerts</Chip>
          {incidentCount > 0 && (
            <Chip accent>{incidentCount} incident{incidentCount !== 1 ? "s" : ""}</Chip>
          )}
          {isDone && <Chip success>Pipeline complete</Chip>}
          {isRunning && <Chip running>Analyzing…</Chip>}
        </div>
      </div>

      {/* Right: button group */}
      <div style={{ display: "flex", gap: SPACE.xs, alignItems: "center" }}>
        {phase === "idle" && !isLive && (
          <>
            <input
              ref={fileRef}
              type="file"
              accept=".json"
              style={{ display: "none" }}
              onChange={handleFileChange}
            />
            <button
              onClick={() => fileRef.current?.click()}
              style={{
                ...TYPE.scale.caption,
                color: COLOR.inkMuted48,
                background: "none",
                border: `1px solid ${COLOR.hairline}`,
                borderRadius: RADIUS.pill,
                padding: "8px 14px",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: SPACE.xxs,
              }}
            >
              <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
                <path d="M6.5 1v7M4 4.5l2.5-3.5 2.5 3.5" stroke={COLOR.inkMuted48} strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M1.5 9.5v1A1.5 1.5 0 003 12h7a1.5 1.5 0 001.5-1.5v-1" stroke={COLOR.inkMuted48} strokeWidth="1.3" strokeLinecap="round"/>
              </svg>
              Upload JSON
            </button>
            <button
              onClick={onLive}
              style={{
                ...TYPE.scale.caption,
                color: COLOR.inkMuted80,
                background: COLOR.canvasParchment,
                border: `1px solid ${COLOR.hairline}`,
                borderRadius: RADIUS.pill,
                padding: "8px 16px",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: SPACE.xxs,
              }}
            >
              <span style={{ fontSize: 10, color: "#ff3b30" }}>●</span>
              Live Mode
            </button>
            <Button variant="primary" onClick={onRun}>
              Run AI Analysis
            </Button>
          </>
        )}

        {isLive && (
          <div style={{ display: "flex", alignItems: "center", gap: SPACE.sm }}>
            <span style={{
              display: "inline-block",
              width: 8, height: 8,
              borderRadius: "50%",
              background: "#ff3b30",
              animation: "pulse 1s ease-in-out infinite",
            }} />
            <span style={{ ...TYPE.scale.caption, color: COLOR.inkMuted80 }}>
              Live feed — waiting for critical alert…
            </span>
            <button
              onClick={onReset}
              style={{
                ...TYPE.scale.caption,
                color: COLOR.inkMuted48,
                background: "none",
                border: `1px solid ${COLOR.hairline}`,
                borderRadius: RADIUS.pill,
                padding: "6px 12px",
                cursor: "pointer",
              }}
            >
              Stop
            </button>
          </div>
        )}

        {isRunning && (
          <Button variant="primary" disabled>Agents running…</Button>
        )}

        {isDone && (
          <Button variant="ghost" onClick={onReset}>Re-Analyse</Button>
        )}
      </div>
    </div>
  );
}

function Chip({ children, accent, success, running }) {
  const bg = running  ? `rgba(0,102,204,0.08)`
           : success  ? `rgba(50,215,75,0.10)`
           : accent   ? COLOR.criticalBg
           : COLOR.canvasParchment;
  const color = running  ? COLOR.primary
              : success  ? COLOR.statusDone
              : accent   ? COLOR.criticalColor
              : COLOR.inkMuted48;
  return (
    <span
      style={{
        ...TYPE.scale.finePrint,
        fontWeight: 600,
        color,
        background: bg,
        border: `1px solid ${running ? "rgba(0,102,204,0.18)" : success ? "rgba(50,215,75,0.20)" : accent ? "rgba(255,59,48,0.18)" : COLOR.hairline}`,
        borderRadius: RADIUS.pill,
        padding: `3px 8px`,
        display: "inline-flex",
        alignItems: "center",
        gap: 4,
        whiteSpace: "nowrap",
      }}
    >
      {running && (
        <span
          style={{
            width: 5, height: 5,
            borderRadius: "50%",
            background: COLOR.primary,
            display: "inline-block",
            animation: "pulse 1.2s infinite",
          }}
        />
      )}
      {children}
    </span>
  );
}
