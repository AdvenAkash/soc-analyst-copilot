/**
 * SOC performance metrics — pure functions, safe to call at any time.
 */

/** Industry baselines (IBM Cost of a Data Breach Report 2024) */
export const INDUSTRY = {
  mttdDays:           197,
  mttrDays:           292,
  fpRatePercent:       80,
  analystMinPerAlert:  12,
};

/**
 * Calculate MTTD in human-readable form.
 * @param {string} firstAlertTime  "HH:MM:SS"
 * @param {string} lastAlertTime   "HH:MM:SS"
 * @returns {{ raw: number, display: string }}
 */
export function calcMTTD(firstAlertTime, lastAlertTime) {
  const toSeconds = (t) => {
    const [h, m, s] = t.split(":").map(Number);
    return h * 3600 + m * 60 + s;
  };
  const raw     = toSeconds(lastAlertTime) - toSeconds(firstAlertTime);
  const minutes = Math.floor(Math.abs(raw) / 60);
  const seconds = Math.abs(raw) % 60;
  return {
    raw,
    display: minutes > 0 ? `${minutes}m ${seconds}s` : `${seconds}s`,
  };
}

/**
 * Calculate false positive rate.
 * @param {number} fpCount
 * @param {number} totalAlerts
 * @returns {{ percent: number, display: string }}
 */
export function calcFPRate(fpCount, totalAlerts) {
  if (totalAlerts === 0) return { percent: 0, display: "0%" };
  const percent = Math.round((fpCount / totalAlerts) * 100);
  return { percent, display: `${percent}%` };
}

/**
 * Calculate analyst time saved vs manual triage.
 * @param {number} totalAlerts
 * @returns {{ minutes: number, display: string }}
 */
export function calcTimeSaved(totalAlerts) {
  const minutes = totalAlerts * INDUSTRY.analystMinPerAlert;
  const hours   = Math.floor(minutes / 60);
  const mins    = minutes % 60;
  return {
    minutes,
    display: hours > 0 ? `${hours}h ${mins}m` : `${mins}m`,
  };
}

/**
 * Count MITRE ATT&CK technique hits by tactic.
 * @param {Array<{mitre_techniques: Array<{tactic: string}>}>} incidents
 * @returns {Record<string, number>}
 */
export function countMitreTactics(incidents) {
  const counts = {};
  for (const inc of incidents) {
    for (const tech of (inc.mitre_techniques ?? [])) {
      counts[tech.tactic] = (counts[tech.tactic] ?? 0) + 1;
    }
  }
  return counts;
}

/** All 14 MITRE ATT&CK tactics in kill-chain order */
export const ALL_TACTICS = [
  "Reconnaissance",
  "Resource Development",
  "Initial Access",
  "Execution",
  "Persistence",
  "Privilege Escalation",
  "Defense Evasion",
  "Credential Access",
  "Discovery",
  "Lateral Movement",
  "Collection",
  "Command & Control",
  "Exfiltration",
  "Impact",
];
