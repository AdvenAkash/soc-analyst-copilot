import { COLOR, TYPE, RADIUS, SPACE } from "../../constants/tokens.js";

/**
 * @param {{
 *   variant?: "primary"|"ghost"|"ghost-dark",
 *   size?: "default"|"large",
 *   onClick?: () => void,
 *   disabled?: boolean,
 *   children: React.ReactNode,
 *   style?: object
 * }} props
 */
export default function Button({ variant = "primary", size = "default", onClick, disabled, children, style }) {
  const isLarge = size === "large";

  const base = {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: SPACE.xs,
    padding: isLarge ? "14px 28px" : "11px 22px",
    borderRadius: RADIUS.pill,
    cursor: disabled ? "not-allowed" : "pointer",
    opacity: disabled ? 0.5 : 1,
    transition: "transform 0.1s ease, opacity 0.15s ease",
    userSelect: "none",
    outline: "none",
    ...(isLarge ? TYPE.scale.buttonLarge : TYPE.scale.body),
    ...style,
  };

  const press = (e) => { if (!disabled) e.currentTarget.style.transform = "scale(0.96)"; };
  const lift  = (e) => { e.currentTarget.style.transform = "scale(1)"; };

  if (variant === "primary") {
    return (
      <button
        onClick={onClick}
        disabled={disabled}
        onMouseDown={press}
        onMouseUp={lift}
        onMouseLeave={lift}
        style={{ ...base, background: COLOR.primary, color: COLOR.onDark, border: "none" }}
      >
        {children}
      </button>
    );
  }

  if (variant === "ghost-dark") {
    return (
      <button
        onClick={onClick}
        disabled={disabled}
        onMouseDown={press}
        onMouseUp={lift}
        onMouseLeave={lift}
        style={{
          ...base,
          background: "transparent",
          color: COLOR.primaryOnDark,
          border: `1px solid rgba(255,255,255,0.22)`,
        }}
      >
        {children}
      </button>
    );
  }

  // ghost (light bg)
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      onMouseDown={press}
      onMouseUp={lift}
      onMouseLeave={lift}
      style={{
        ...base,
        background: "transparent",
        color: COLOR.primary,
        border: `1px solid ${COLOR.primary}`,
      }}
    >
      {children}
    </button>
  );
}
