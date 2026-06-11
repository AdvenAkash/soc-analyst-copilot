import { COLOR, TYPE, SPACE, RADIUS } from "../../constants/tokens.js";
import Badge from "../ui/Badge.jsx";
import Timeline from "../ui/Timeline.jsx";
import SectionLabel from "../ui/SectionLabel.jsx";

/** @param {{ incident: any }} props */
export default function IncidentDetail({ incident }) {
  if (!incident) {
    return (
      <div
        style={{
          background: COLOR.canvas,
          borderRadius: RADIUS.lg,
          padding: SPACE.xxl,
          border: `1px solid ${COLOR.hairline}`,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          minHeight: 400,
          gap: SPACE.md,
        }}
      >
        <div style={{ fontSize: 40, opacity: 0.2 }}>⚡</div>
        <p style={{ ...TYPE.scale.body, color: COLOR.inkMuted48, margin: 0, textAlign: "center" }}>
          Select an incident to view the full investigation report.
        </p>
      </div>
    );
  }

  return (
    <div
      style={{
        background: COLOR.canvas,
        borderRadius: RADIUS.lg,
        padding: `${SPACE.xl}px`,
        border: `1px solid ${COLOR.hairline}`,
        overflowY: "auto",
        maxHeight: "80vh",
      }}
    >
      {/* Header */}
      <div style={{ display: "flex", alignItems: "flex-start", gap: SPACE.md, marginBottom: SPACE.lg }}>
        <div style={{ flex: 1 }}>
          <div style={{ display: "flex", alignItems: "center", gap: SPACE.sm, marginBottom: SPACE.xs }}>
            <span style={{ ...TYPE.scale.finePrint, color: COLOR.inkMuted48, fontFamily: `"SF Mono", monospace` }}>
              {incident.id}
            </span>
            <Badge variant={incident.sev}>{incident.sev}</Badge>
            <Badge variant="LOW" style={{ color: COLOR.inkMuted48, background: COLOR.canvasParchment }}>
              {incident.confidence} confidence
            </Badge>
          </div>
          <h2 style={{ ...TYPE.scale.displayMd, color: COLOR.ink, margin: 0 }}>{incident.title}</h2>
          <p style={{ ...TYPE.scale.body, color: COLOR.inkMuted48, margin: `${SPACE.sm}px 0 0` }}>
            {incident.summary}
          </p>
        </div>
      </div>

      {/* Kill chain stage */}
      {incident.kill_chain_stage && (
        <InfoRow label="Kill Chain Stage" value={incident.kill_chain_stage} />
      )}
      {incident.threat_actor && (
        <InfoRow label="Threat Actor" value={incident.threat_actor} />
      )}

      {/* Affected assets */}
      {incident.affected_assets?.length > 0 && (
        <Section label="Affected Assets">
          <div style={{ display: "flex", flexWrap: "wrap", gap: SPACE.xs }}>
            {incident.affected_assets.map((a, i) => (
              <span
                key={i}
                style={{
                  ...TYPE.scale.finePrint,
                  color: COLOR.ink,
                  background: COLOR.canvasParchment,
                  border: `1px solid ${COLOR.hairline}`,
                  borderRadius: RADIUS.xs,
                  padding: `${SPACE.xxs}px ${SPACE.xs}px`,
                  fontFamily: `"SF Mono", monospace`,
                }}
              >
                {a}
              </span>
            ))}
          </div>
        </Section>
      )}

      {/* IOCs */}
      {incident.iocs?.length > 0 && (
        <Section label="Indicators of Compromise">
          <div style={{ display: "flex", flexDirection: "column", gap: SPACE.xxs }}>
            {incident.iocs.map((ioc, i) => (
              <span
                key={i}
                style={{
                  ...TYPE.scale.finePrint,
                  color: COLOR.criticalColor,
                  fontFamily: `"SF Mono", monospace`,
                }}
              >
                {ioc}
              </span>
            ))}
          </div>
        </Section>
      )}

      {/* MITRE ATT&CK */}
      {incident.mitre_techniques?.length > 0 && (
        <Section label="MITRE ATT&CK Techniques">
          <div style={{ display: "flex", flexWrap: "wrap", gap: SPACE.xs }}>
            {incident.mitre_techniques.map((t, i) => (
              <div
                key={i}
                style={{
                  background: COLOR.canvasParchment,
                  borderRadius: RADIUS.xs,
                  padding: `${SPACE.xxs}px ${SPACE.xs}px`,
                  border: `1px solid ${COLOR.hairline}`,
                }}
              >
                <span style={{ ...TYPE.scale.finePrint, color: COLOR.primaryFocus, fontFamily: `"SF Mono", monospace`, fontWeight: 600 }}>
                  {t.id}
                </span>
                <span style={{ ...TYPE.scale.finePrint, color: COLOR.ink, marginLeft: SPACE.xxs }}>
                  {t.name}
                </span>
              </div>
            ))}
          </div>
        </Section>
      )}

      {/* Attack Timeline */}
      {incident.timeline?.length > 0 && (
        <Section label="Attack Timeline">
          <Timeline events={incident.timeline} />
        </Section>
      )}

      {/* Impact */}
      {incident.impact && (
        <Section label="Business Impact">
          <p style={{ ...TYPE.scale.body, color: COLOR.criticalColor, margin: 0 }}>{incident.impact}</p>
        </Section>
      )}

      {/* Immediate Actions */}
      {incident.immediate_actions?.length > 0 && (
        <Section label="Immediate Actions">
          <div style={{ display: "flex", flexDirection: "column", gap: SPACE.sm }}>
            {incident.immediate_actions.map((action, i) => (
              <div
                key={i}
                style={{
                  display: "flex",
                  gap: SPACE.md,
                  padding: `${SPACE.sm}px`,
                  background: action.priority === 1 ? "rgba(255,59,48,0.04)" : COLOR.canvasParchment,
                  borderRadius: RADIUS.sm,
                  border: `1px solid ${action.priority === 1 ? "rgba(255,59,48,0.15)" : COLOR.hairline}`,
                }}
              >
                <span
                  style={{
                    ...TYPE.scale.captionStrong,
                    color: COLOR.onDark,
                    background: action.priority <= 2 ? COLOR.criticalColor : COLOR.inkMuted48,
                    width: 24,
                    height: 24,
                    borderRadius: "50%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                  }}
                >
                  {action.priority}
                </span>
                <div style={{ flex: 1 }}>
                  <p style={{ ...TYPE.scale.captionStrong, color: COLOR.ink, margin: 0 }}>{action.action}</p>
                  <p style={{ ...TYPE.scale.finePrint, color: COLOR.inkMuted48, margin: `${SPACE.xxs}px 0 0` }}>
                    {action.owner} · {action.eta}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </Section>
      )}

      {/* Investigation Steps */}
      {incident.investigation_steps?.length > 0 && (
        <Section label="Investigation Steps">
          <ol style={{ margin: 0, paddingLeft: SPACE.lg }}>
            {incident.investigation_steps.map((step, i) => (
              <li key={i} style={{ ...TYPE.scale.caption, color: COLOR.ink, marginBottom: SPACE.xs }}>
                {step}
              </li>
            ))}
          </ol>
        </Section>
      )}

      {/* Long-term Fix */}
      {incident.long_term_fix && (
        <Section label="Long-Term Remediation">
          <p style={{ ...TYPE.scale.body, color: COLOR.ink, margin: 0 }}>{incident.long_term_fix}</p>
        </Section>
      )}
    </div>
  );
}

function Section({ label, children }) {
  return (
    <div style={{ marginBottom: SPACE.lg }}>
      <SectionLabel>{label}</SectionLabel>
      <div style={{ marginTop: SPACE.sm }}>{children}</div>
    </div>
  );
}

function InfoRow({ label, value }) {
  return (
    <div
      style={{
        display: "flex",
        gap: SPACE.lg,
        marginBottom: SPACE.sm,
        padding: `${SPACE.sm}px ${SPACE.md}px`,
        background: COLOR.canvasParchment,
        borderRadius: RADIUS.sm,
        border: `1px solid ${COLOR.hairline}`,
      }}
    >
      <span style={{ ...TYPE.scale.captionStrong, color: COLOR.inkMuted48, minWidth: 140 }}>{label}</span>
      <span style={{ ...TYPE.scale.caption, color: COLOR.ink }}>{value}</span>
    </div>
  );
}
