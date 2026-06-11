import { COLOR } from "../constants/tokens.js";

/** @param {string} sev */
export function getSeverityStyle(sev) {
  switch (sev?.toUpperCase()) {
    case "CRITICAL": return { color: COLOR.criticalColor, background: COLOR.criticalBg };
    case "HIGH":     return { color: COLOR.highColor,     background: COLOR.highBg };
    case "MEDIUM":   return { color: COLOR.mediumColor,   background: COLOR.mediumBg };
    case "LOW":      return { color: COLOR.lowColor,      background: COLOR.lowBg };
    default:         return { color: COLOR.fpColor,       background: COLOR.fpBg };
  }
}
