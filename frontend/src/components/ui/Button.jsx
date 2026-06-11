import { COLOR, TYPE, RADIUS, SPACE } from "../../constants/tokens.js";

/**
 * @param {{ variant?: "primary"|"ghost", onClick?: () => void, disabled?: boolean, children: React.ReactNode, style?: object }} props
 */
export default function Button({ variant = "primary", onClick, disabled, children, style }) {
  const base = {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: SPACE.xs,
    padding: `${SPACE.xs}px ${SPACE.md}px`,
    borderRadius: RADIUS.sm,
    border: "none",
    cursor: disabled ? "not-allowed" : "pointer",
    opacity: disabled ? 0.5 : 1,
    transition: "opacity 0.15s",
    ...TYPE.scale.captionStrong,
    ...style,
  };

  if (variant === "primary") {
    return (
      <button
        onClick={onClick}
        disabled={disabled}
        style={{ ...base, background: COLOR.primaryFocus, color: COLOR.onDark }}
      >
        {children}
      </button>
    );
  }

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        ...base,
        background: "transparent",
        color: COLOR.primaryFocus,
        border: `1px solid ${COLOR.primaryFocus}`,
      }}
    >
      {children}
    </button>
  );
}
