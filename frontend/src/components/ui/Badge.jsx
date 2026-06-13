import { COLOR, TYPE, RADIUS, SPACE } from "../../constants/tokens.js";
import { getSeverityStyle } from "../../utils/severity.js";

/**
 * @param {{ variant?: string, children: React.ReactNode, style?: object }} props
 */
export default function Badge({ variant, children, style }) {
  const sevStyle = getSeverityStyle(variant);
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        padding: `3px 8px`,
        borderRadius: RADIUS.pill,
        ...TYPE.scale.finePrint,
        fontWeight: 700,
        letterSpacing: "0.07em",
        textTransform: "uppercase",
        whiteSpace: "nowrap",
        ...sevStyle,
        ...style,
      }}
    >
      {children}
    </span>
  );
}
