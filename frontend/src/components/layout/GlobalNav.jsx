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
        background: COLOR.surfaceBlack,
        borderBottom: "1px solid rgba(255,255,255,0.06)",
        height: 44,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: `0 ${SPACE.xl}px`,
      }}
    >
      {/* Left: brand + nav */}
      <div style={{ display: "flex", alignItems: "center", gap: SPACE.xl }}>
        {/* Brand */}
        <div
          onClick={() => onNav("dashboard")}
          style={{ display: "flex", alignItems: "center", gap: 6, cursor: "pointer" }}
        >
          <svg width="15" height="15" viewBox="0 0 16 16" fill="none">
            <path
              d="M8 1.5L2.5 3.75V8C2.5 11.25 4.9 14.1 8 15C11.1 14.1 13.5 11.25 13.5 8V3.75L8 1.5Z"
              fill={COLOR.primaryOnDark}
            />
          </svg>
          <span
            style={{
              ...TYPE.scale.captionStrong,
              color: COLOR.onDark,
              letterSpacing: "0.06em",
              textTransform: "uppercase",
            }}
          >
            SOC Copilot
          </span>
        </div>

        {/* Separator */}
        <div style={{ width: 1, height: 14, background: "rgba(255,255,255,0.14)" }} />

        {/* Nav items */}
        {NAV_ITEMS.map((item) => {
          const isActive = activeTab === item.key;
          return (
            <span
              key={item.key}
              onClick={() => onNav(item.key)}
              style={{
                ...TYPE.scale.navLink,
                color: isActive ? COLOR.onDark : "rgba(255,255,255,0.52)",
                cursor: "pointer",
                userSelect: "none",
                position: "relative",
                paddingBottom: 2,
                transition: "color 0.15s",
              }}
            >
              {item.label}
              {isActive && (
                <span
                  style={{
                    position: "absolute",
                    bottom: -14,
                    left: 0,
                    right: 0,
                    height: 2,
                    background: COLOR.primaryOnDark,
                    borderRadius: RADIUS.pill,
                  }}
                />
              )}
            </span>
          );
        })}
      </div>

      {/* Right: GPU status + avatar */}
      <div style={{ display: "flex", alignItems: "center", gap: SPACE.sm }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 5,
            padding: `3px 9px`,
            borderRadius: RADIUS.pill,
            border: "1px solid rgba(255,255,255,0.10)",
          }}
        >
          <div
            style={{
              width: 5,
              height: 5,
              borderRadius: "50%",
              background: COLOR.statusDone,
            }}
          />
          <span style={{ ...TYPE.scale.navLink, color: "rgba(255,255,255,0.42)" }}>
            AMD MI300X
          </span>
        </div>

        <div
          style={{
            width: 26,
            height: 26,
            borderRadius: "50%",
            background: `linear-gradient(135deg, ${COLOR.primary} 0%, #32d74b 100%)`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            ...TYPE.scale.finePrint,
            color: COLOR.onDark,
            fontWeight: 700,
            cursor: "pointer",
            letterSpacing: "0.02em",
          }}
        >
          SC
        </div>
      </div>
    </nav>
  );
}
