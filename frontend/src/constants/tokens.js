/**
 * Apple Design System — design tokens
 * Never inline hex values in components — always import from here.
 */

export const COLOR = {
  primary:         "#0066cc",
  primaryFocus:    "#0071e3",
  primaryOnDark:   "#2997ff",

  ink:             "#1d1d1f",
  inkMuted80:      "#333333",
  inkMuted48:      "#7a7a7a",
  bodyMuted:       "#cccccc",
  onDark:          "#ffffff",

  canvas:          "#ffffff",
  canvasParchment: "#f5f5f7",
  surfacePearl:    "#fafafc",
  surfaceTile1:    "#272729",
  surfaceTile2:    "#2a2a2c",
  surfaceTile3:    "#252527",
  surfaceBlack:    "#000000",
  surfaceChipTranslucent: "rgba(210,210,215,0.64)",

  hairline:        "#e0e0e0",
  dividerSoft:     "#f0f0f0",

  criticalColor: "#ff3b30",  criticalBg: "rgba(255,59,48,0.10)",
  highColor:     "#ff9500",  highBg:     "rgba(255,149,0,0.10)",
  mediumColor:   "#b38600",  mediumBg:   "rgba(255,214,10,0.10)",
  lowColor:      "#248a3d",  lowBg:      "rgba(50,215,75,0.10)",
  fpColor:       "#8e8e93",  fpBg:       "rgba(142,142,147,0.10)",

  statusWaiting: "#8e8e93",
  statusRunning: "#0066cc",
  statusDone:    "#32d74b",
  statusError:   "#ff3b30",
};

export const TYPE = {
  display: `"SF Pro Display", system-ui, -apple-system, "Inter", sans-serif`,
  text:    `"SF Pro Text",    system-ui, -apple-system, "Inter", sans-serif`,
  mono:    `"SF Mono", "JetBrains Mono", "Fira Mono", monospace`,

  scale: {
    heroDisplay:   { fontFamily: `"SF Pro Display", system-ui, -apple-system, Inter, sans-serif`, fontSize: 56, fontWeight: 600, lineHeight: 1.07, letterSpacing: "-0.28px" },
    displayLg:     { fontFamily: `"SF Pro Display", system-ui, -apple-system, Inter, sans-serif`, fontSize: 40, fontWeight: 600, lineHeight: 1.10, letterSpacing: "0px" },
    displayMd:     { fontFamily: `"SF Pro Text",    system-ui, -apple-system, Inter, sans-serif`, fontSize: 34, fontWeight: 600, lineHeight: 1.47, letterSpacing: "-0.374px" },
    lead:          { fontFamily: `"SF Pro Display", system-ui, -apple-system, Inter, sans-serif`, fontSize: 28, fontWeight: 400, lineHeight: 1.14, letterSpacing: "0.196px" },
    leadAiry:      { fontFamily: `"SF Pro Text",    system-ui, -apple-system, Inter, sans-serif`, fontSize: 24, fontWeight: 300, lineHeight: 1.50, letterSpacing: "0px" },
    tagline:       { fontFamily: `"SF Pro Display", system-ui, -apple-system, Inter, sans-serif`, fontSize: 21, fontWeight: 600, lineHeight: 1.19, letterSpacing: "0.231px" },
    bodyStrong:    { fontFamily: `"SF Pro Text",    system-ui, -apple-system, Inter, sans-serif`, fontSize: 17, fontWeight: 600, lineHeight: 1.24, letterSpacing: "-0.374px" },
    body:          { fontFamily: `"SF Pro Text",    system-ui, -apple-system, Inter, sans-serif`, fontSize: 17, fontWeight: 400, lineHeight: 1.47, letterSpacing: "-0.374px" },
    buttonLarge:   { fontFamily: `"SF Pro Text",    system-ui, -apple-system, Inter, sans-serif`, fontSize: 18, fontWeight: 300, lineHeight: 1.0,  letterSpacing: "0px" },
    captionStrong: { fontFamily: `"SF Pro Text",    system-ui, -apple-system, Inter, sans-serif`, fontSize: 14, fontWeight: 600, lineHeight: 1.29, letterSpacing: "-0.224px" },
    caption:       { fontFamily: `"SF Pro Text",    system-ui, -apple-system, Inter, sans-serif`, fontSize: 14, fontWeight: 400, lineHeight: 1.43, letterSpacing: "-0.224px" },
    navLink:       { fontFamily: `"SF Pro Text",    system-ui, -apple-system, Inter, sans-serif`, fontSize: 12, fontWeight: 400, lineHeight: 1.0,  letterSpacing: "-0.12px" },
    finePrint:     { fontFamily: `"SF Pro Text",    system-ui, -apple-system, Inter, sans-serif`, fontSize: 12, fontWeight: 400, lineHeight: 1.0,  letterSpacing: "-0.12px" },
  },
};

export const RADIUS = {
  none: 0, xs: 5, sm: 8, md: 11, lg: 18, pill: 9999, full: 9999,
};

export const SPACE = {
  xxs: 4, xs: 8, sm: 12, md: 17, lg: 24, xl: 32, xxl: 48, section: 80,
};
