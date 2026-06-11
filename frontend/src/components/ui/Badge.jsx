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
        padding: `${SPACE.xxs}px ${SPACE.xs}px`,
        borderRadius: RADIUS.xs,
        ...TYPE.scale.finePrint,
        fontWeight: 600,
        letterSpacing: "0.06em",
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
