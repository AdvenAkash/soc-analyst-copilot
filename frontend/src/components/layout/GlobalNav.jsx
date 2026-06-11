import { COLOR, TYPE, SPACE } from "../../constants/tokens.js";

export default function GlobalNav() {
  return (
    <nav
      style={{
        position: "sticky",
        top: 0,
        zIndex: 100,
        background: "rgba(0,0,0,0.85)",
        backdropFilter: "blur(20px) saturate(180%)",
        WebkitBackdropFilter: "blur(20px) saturate(180%)",
        borderBottom: `1px solid rgba(255,255,255,0.08)`,
        height: 44,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: `0 ${SPACE.lg}px`,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: SPACE.xl }}>
        <span
          style={{
            ...TYPE.scale.captionStrong,
            color: COLOR.onDark,
            letterSpacing: "0.04em",
            textTransform: "uppercase",
          }}
        >
          SOC Copilot
        </span>
        {["Dashboard", "Incidents", "Alerts", "Playbooks", "Settings"].map((item) => (
          <span
            key={item}
            style={{ ...TYPE.scale.navLink, color: "rgba(255,255,255,0.72)", cursor: "pointer" }}
          >
            {item}
          </span>
        ))}
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: SPACE.md }}>
        <span style={{ ...TYPE.scale.navLink, color: "rgba(255,255,255,0.50)" }}>
          AMD ROCm · vLLM
        </span>
        <div
          style={{
            width: 28,
            height: 28,
            borderRadius: "50%",
            background: "linear-gradient(135deg, #0066cc, #32d74b)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            ...TYPE.scale.finePrint,
            color: COLOR.onDark,
            fontWeight: 600,
          }}
        >
          SC
        </div>
      </div>
    </nav>
  );
}
