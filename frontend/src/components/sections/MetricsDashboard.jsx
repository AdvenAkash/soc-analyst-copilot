/**
 * MetricsDashboard — SOC performance metrics tab.
 * Shows MTTD, FP rate, time saved, coverage, and MITRE ATT&CK heatmap.
 * All metrics derived from existing pipeline state — no new API calls.
 */
import { useMemo } from "react";
import { COLOR, TYPE, RADIUS, SPACE } from "../../constants/tokens.js";
import { SAMPLE_ALERTS } from "../../constants/alerts.js";
import SectionLabel from "../ui/SectionLabel.jsx";
import MitreHeatmap from "../ui/MitreHeatmap.jsx";
import {
  calcMTTD, calcFPRate, calcTimeSaved, countMitreTactics, INDUSTRY,
} from "../../utils/metrics.js";

function MetricCard({ label, value, subValue, vsIndustry, highlight }) {
  return (
    <div style={{
      background: COLOR.canvas,
      border: `1px solid ${COLOR.hairline}`,
      borderRadius: RADIUS.lg,
      padding: SPACE.lg,
      flex: "1 1 160px",
    }}>
      <SectionLabel>{label}</SectionLabel>

      <p style={{
        ...TYPE.scale.displayMd,
        color: highlight ? COLOR.primary : COLOR.ink,
        margin: `${SPACE.xs}px 0 ${SPACE.xxs}px`,
      }}>
        {value}
      </p>

      {subValue && (
        <p style={{ ...TYPE.scale.caption, color: COLOR.inkMuted48, margin: 0 }}>
          {subValue}
        </p>
      )}

      {vsIndustry && (
        <div style={{
          marginTop: SPACE.sm,
          paddingTop: SPACE.sm,
          borderTop: `1px solid ${COLOR.dividerSoft}`,
          display: "flex",
          alignItems: "center",
          gap: SPACE.xxs,
        }}>
          <span style={{
            ...TYPE.scale.caption,
            color: "#248a3d",
            background: "rgba(50,215,75,0.10)",
            borderRadius: RADIUS.pill,
            padding: "2px 8px",
          }}>
            ↓ vs industry
          </span>
          <span style={{ ...TYPE.scale.caption, color: COLOR.inkMuted48 }}>
            {vsIndustry}
          </span>
        </div>
      )}
    </div>
  );
}

export default function MetricsDashboard({ incidents, fpIds, totalAlerts, phase }) {
  const metrics = useMemo(() => {
    if (phase !== "complete" || incidents.length === 0) return null;

    const firstAlert = SAMPLE_ALERTS[0]?.time ?? "09:47:23";
    const lastIdx    = Math.min((incidents[0]?.alert_ids?.length ?? 1) - 1, SAMPLE_ALERTS.length - 1);
    const lastAlert  = SAMPLE_ALERTS[lastIdx]?.time ?? "10:02:51";

    return {
      mttd:          calcMTTD(firstAlert, lastAlert),
      fpRate:        calcFPRate(fpIds.length, totalAlerts),
      timeSaved:     calcTimeSaved(totalAlerts),
      coverage:      Math.round(
        (incidents.flatMap(i => i.alert_ids ?? []).length / totalAlerts) * 100
      ),
      tactics:       countMitreTactics(incidents),
      incidentCount: incidents.length,
    };
  }, [incidents, fpIds, totalAlerts, phase]);

  if (phase !== "complete") {
    return (
      <div style={{
        padding: `${SPACE.section}px ${SPACE.xxl}px`,
        textAlign: "center",
      }}>
        <p style={{ ...TYPE.scale.lead, color: COLOR.inkMuted48 }}>
          Run the AI pipeline to see metrics
        </p>
      </div>
    );
  }

  return (
    <div style={{ paddingTop: SPACE.lg }}>

      {/* Performance Metrics */}
      <h2 style={{ ...TYPE.scale.displayLg, color: COLOR.ink, marginBottom: SPACE.lg, marginTop: 0 }}>
        SOC Performance
      </h2>

      <div style={{ display: "flex", flexWrap: "wrap", gap: SPACE.md, marginBottom: SPACE.xl }}>
        <MetricCard
          label="Time to Detect (MTTD)"
          value={metrics.mttd.display}
          subValue="First alert → pipeline complete"
          vsIndustry={`Industry: ${INDUSTRY.mttdDays} days avg`}
          highlight
        />
        <MetricCard
          label="Alerts Processed"
          value={totalAlerts.toLocaleString()}
          subValue={`${metrics.incidentCount} real incident${metrics.incidentCount !== 1 ? "s" : ""} found`}
          vsIndustry="Manual review: impossible at scale"
        />
        <MetricCard
          label="False Positive Rate"
          value={metrics.fpRate.display}
          subValue={`${fpIds.length} alerts dismissed`}
          vsIndustry={`Industry: ${INDUSTRY.fpRatePercent}% avg`}
        />
        <MetricCard
          label="Analyst Time Saved"
          value={metrics.timeSaved.display}
          subValue={`${INDUSTRY.analystMinPerAlert} min/alert manually`}
          vsIndustry="Per analysis cycle"
          highlight
        />
        <MetricCard
          label="Alert Coverage"
          value={`${metrics.coverage}%`}
          subValue="Alerts correlated into incidents"
        />
        <MetricCard
          label="Incidents Confirmed"
          value={String(metrics.incidentCount)}
          subValue={incidents[0]?.sev ?? ""}
        />
      </div>

      {/* Industry Comparison Strip */}
      <div style={{
        background: COLOR.surfaceTile1,
        borderRadius: RADIUS.lg,
        padding: SPACE.lg,
        marginBottom: SPACE.xl,
      }}>
        <p style={{ ...TYPE.scale.tagline, color: COLOR.onDark, margin: `0 0 ${SPACE.md}px` }}>
          Your SOC vs Industry Average
        </p>
        <div style={{ display: "flex", gap: SPACE.xl, flexWrap: "wrap" }}>
          {[
            { metric: "MTTD",       you: metrics.mttd.display,       industry: `${INDUSTRY.mttdDays} days` },
            { metric: "FP Rate",    you: metrics.fpRate.display,      industry: `${INDUSTRY.fpRatePercent}%` },
            { metric: "Time Saved", you: metrics.timeSaved.display,   industry: "—" },
          ].map(({ metric, you, industry }) => (
            <div key={metric} style={{ flex: 1, minWidth: 120 }}>
              <p style={{ ...TYPE.scale.captionStrong, color: COLOR.bodyMuted, margin: `0 0 4px` }}>
                {metric}
              </p>
              <p style={{ ...TYPE.scale.displayMd, color: COLOR.primaryOnDark, margin: `0 0 2px` }}>
                {you}
              </p>
              <p style={{ ...TYPE.scale.caption, color: COLOR.bodyMuted, margin: 0 }}>
                vs {industry} industry avg
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* MITRE ATT&CK Heatmap */}
      <h2 style={{ ...TYPE.scale.displayLg, color: COLOR.ink, marginBottom: SPACE.xs, marginTop: 0 }}>
        MITRE ATT&CK Coverage
      </h2>
      <p style={{ ...TYPE.scale.body, color: COLOR.inkMuted48, margin: `0 0 ${SPACE.lg}px` }}>
        Tactics detected across all confirmed incidents
      </p>
      <MitreHeatmap tacticCounts={metrics.tactics} />
    </div>
  );
}
