import { COLOR, TYPE, SPACE, RADIUS } from "../../constants/tokens.js";

const NAV_ITEMS = [
  { key: "dashboard", label: "Dashboard" },
  { key: "incidents", label: "Incidents" },
  { key: "alerts",    label: "Alerts" },
  { key: "playbooks", label: "Playbooks" },
  { key: "settings",  label: "Settings" },
];

/** @param {{ activeTab: string, onNav: (tab: string) => void }} props */
export default function GlobalNav({ activeTab, onNav }) {
  return (
    <nav
      style={{
        position: "sticky",
        top: 0,
        zIndex: 100,
        background: "rgba(0,0,0,0.85)",
        backdropFilter: "blur(20px) saturate(180%)",
        WebkitBackdropFilter: "blur(20px) saturate(180%)",
        borderBottom: "1px solid rgba(255,255,255,0.08)",
        height: 44,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: `0 ${SPACE.lg}px`,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: SPACE.xl }}>
        <span
          onClick={() => onNav("dashboard")}
          style={{
            ...TYPE.scale.captionStrong,
            color: COLOR.onDark,
            letterSpacing: "0.04em",
            textTransform: "uppercase",
            cursor: "pointer",
          }}
        >
          SOC Copilot
        </span>

        {NAV_ITEMS.map((item) => {
          const isActive = activeTab === item.key;
          return (
            <span
              key={item.key}
              onClick={() => onNav(item.key)}
              style={{
                ...TYPE.scale.navLink,
                color: isActive ? COLOR.onDark : "rgba(255,255,255,0.60)",
                cursor: "pointer",
                padding: `${SPACE.xxs}px ${SPACE.xs}px`,
                borderRadius: RADIUS.xs,
                background: isActive ? "rgba(255,255,255,0.12)" : "transparent",
                transition: "all 0.15s",
                userSelect: "none",
              }}
            >
              {item.label}
            </span>
          );
        })}
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: SPACE.md }}>
        <span style={{ ...TYPE.scale.navLink, color: "rgba(255,255,255,0.40)" }}>
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
            cursor: "pointer",
          }}
        >
          SC
        </div>
      </div>
    </nav>
  );
}
