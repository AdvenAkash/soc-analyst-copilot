import { COLOR, TYPE, SPACE } from "../../constants/tokens.js";

/** @param {{ dark?: boolean, children: React.ReactNode }} props */
export default function SectionLabel({ dark, children }) {
  return (
    <p
      style={{
        ...TYPE.scale.finePrint,
        color: dark ? "rgba(255,255,255,0.48)" : COLOR.inkMuted48,
        textTransform: "uppercase",
        letterSpacing: "0.1em",
        fontWeight: 600,
        margin: 0,
      }}
    >
      {children}
    </p>
  );
}
