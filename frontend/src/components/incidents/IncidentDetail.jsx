import { COLOR, TYPE, SPACE, RADIUS } from "../../constants/tokens.js";
import Badge from "../ui/Badge.jsx";
import Timeline from "../ui/Timeline.jsx";
import SectionLabel from "../ui/SectionLabel.jsx";

const SEV_ACCENT = {
  CRITICAL: { border: "rgba(255,59,48,0.20)",  bg: "rgba(255,59,48,0.04)"  },
  HIGH:     { border: "rgba(255,149,0,0.20)",  bg: "rgba(255,149,0,0.04)"  },
  MEDIUM:   { border: "rgba(179,134,0,0.20)",  bg: "rgba(255,214,10,0.04)" },
  LOW:      { border: "rgba(36,138,61,0.20)",  bg: "rgba(50,215,75,0.04)"  },
};

/** @param {{ incident: any }} props */
export default function IncidentDetail({ incident }) {
  if (!incident) {
    return (
      <div
        style={{
          background: COLOR.canvas,
          borderRadius: RADIUS.lg,
          border: `1px solid ${COLOR.hairline}`,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          minHeight: 400,
          gap: SPACE.md,
        }}
      >
        <svg width="40" height="40" viewBox="0 0 40 40" fill="none" opacity="0.18">
          <path d="M20 4L4 10V20C4 29 10.5 37.2 20 39.5C29.5 37.2 36 29 36 20V10L20 4Z"
                fill={COLOR.primary}/>
          <path d="M14 20L18 24L26 16" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
        <p style={{ ...TYPE.scale.body, color: COLOR.inkMuted48, margin: 0, textAlign: "center" }}>
          Select an incident to view the full investigation report.
        </p>
      </div>
    );
  }

  const accent = SEV_ACCENT[incident.sev] || SEV_ACCENT.LOW;

  return (
    <div
      style={{
        background: COLOR.canvas,
        borderRadius: RADIUS.lg,
        border: `1px solid ${COLOR.hairline}`,
        overflowY: "auto",
        maxHeight: "80vh",
        animation: "fadeInUp 0.25s ease",
      }}
    >
      {/* Severity header band */}
      <div
        style={{
          background: accent.bg,
          borderBottom: `1px solid ${accent.border}`,
          padding: `${SPACE.xl}px ${SPACE.xl}px ${SPACE.lg}px`,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: SPACE.sm, marginBottom: SPACE.sm }}>
          <span
            style={{
              ...TYPE.scale.finePrint,
              color: COLOR.inkMuted48,
              fontFamily: `"SF Mono", "JetBrains Mono", monospace`,
            }}
          >
            {incident.id}
          </span>
          <Badge variant={incident.sev}>{incident.sev}</Badge>
          <span
            style={{
              ...TYPE.scale.finePrint,
              fontWeight: 600,
              color: COLOR.inkMuted48,
              background: COLOR.canvasParchment,
              border: `1px solid ${COLOR.hairline}`,
              borderRadius: RADIUS.pill,
              padding: `3px 8px`,
              textTransform: "uppercase",
              letterSpacing: "0.06em",
            }}
          >
            {incident.confidence} confidence
          </span>
          {incident.kill_chain_stage && (
            <span
              style={{
                ...TYPE.scale.finePrint,
                fontWeight: 600,
                color: COLOR.highColor,
                background: COLOR.highBg,
                borderRadius: RADIUS.pill,
                padding: `3px 8px`,
                textTransform: "uppercase",
                letterSpacing: "0.06em",
              }}
            >
              {incident.kill_chain_stage}
            </span>
          )}
        </div>

        <h2 style={{ ...TYPE.scale.displayMd, color: COLOR.ink, margin: 0, marginBottom: SPACE.sm }}>
          {incident.title}
        </h2>
        <p style={{ ...TYPE.scale.body, color: COLOR.inkMuted48, margin: 0 }}>
          {incident.summary}
        </p>
      </div>

      {/* Body */}
      <div style={{ padding: `${SPACE.xl}px` }}>

        {/* Threat actor */}
        {incident.threat_actor && (
          <InfoRow label="Threat Actor" value={incident.threat_actor} mono />
        )}

        {/* Affected assets */}
        {incident.affected_assets?.length > 0 && (
          <Section label="Affected Assets">
            <div style={{ display: "flex", flexWrap: "wrap", gap: SPACE.xs }}>
              {incident.affected_assets.map((a, i) => (
                <span
                  key={i}
                  style={{
                    ...TYPE.scale.caption,
                    color: COLOR.ink,
                    background: COLOR.canvasParchment,
                    border: `1px solid ${COLOR.hairline}`,
                    borderRadius: RADIUS.sm,
                    padding: `4px ${SPACE.sm}px`,
                    fontFamily: `"SF Mono", "JetBrains Mono", monospace`,
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
                <div
                  key={i}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: SPACE.xs,
                    padding: `5px ${SPACE.sm}px`,
                    background: "rgba(255,59,48,0.03)",
                    border: `1px solid rgba(255,59,48,0.12)`,
                    borderRadius: RADIUS.sm,
                  }}
                >
                  <span
                    style={{
                      width: 6,
                      height: 6,
                      borderRadius: "50%",
                      background: COLOR.criticalColor,
                      flexShrink: 0,
                    }}
                  />
                  <span
                    style={{
                      ...TYPE.scale.caption,
                      color: COLOR.criticalColor,
                      fontFamily: `"SF Mono", "JetBrains Mono", monospace`,
                    }}
                  >
                    {ioc}
                  </span>
                </div>
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
                    borderRadius: RADIUS.sm,
                    padding: `6px ${SPACE.sm}px`,
                    border: `1px solid ${COLOR.hairline}`,
                    display: "flex",
                    alignItems: "center",
                    gap: SPACE.xs,
                  }}
                >
                  <span
                    style={{
                      ...TYPE.scale.finePrint,
                      color: COLOR.primaryFocus,
                      fontFamily: `"SF Mono", "JetBrains Mono", monospace`,
                      fontWeight: 700,
                      letterSpacing: "0.04em",
                    }}
                  >
                    {t.id}
                  </span>
                  <span style={{ ...TYPE.scale.finePrint, color: COLOR.ink }}>{t.name}</span>
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

        {/* Impact — colored banner */}
        {incident.impact && (
          <div
            style={{
              background: "rgba(255,59,48,0.04)",
              border: `1px solid rgba(255,59,48,0.16)`,
              borderRadius: RADIUS.md,
              padding: `${SPACE.md}px`,
              marginBottom: SPACE.lg,
            }}
          >
            <p
              style={{
                ...TYPE.scale.navLink,
                color: COLOR.criticalColor,
                textTransform: "uppercase",
                letterSpacing: "0.09em",
                fontWeight: 600,
                margin: `0 0 ${SPACE.xxs}px`,
              }}
            >
              Business Impact
            </p>
            <p style={{ ...TYPE.scale.body, color: COLOR.ink, margin: 0 }}>
              {incident.impact}
            </p>
          </div>
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
                    background: action.priority <= 2 ? "rgba(255,59,48,0.03)" : COLOR.canvasParchment,
                    borderRadius: RADIUS.sm,
                    border: `1px solid ${action.priority <= 2 ? "rgba(255,59,48,0.12)" : COLOR.hairline}`,
                  }}
                >
                  <div
                    style={{
                      width: 22,
                      height: 22,
                      borderRadius: "50%",
                      background: action.priority <= 2 ? COLOR.criticalColor : COLOR.inkMuted48,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                    }}
                  >
                    <span style={{ ...TYPE.scale.finePrint, color: COLOR.onDark, fontWeight: 700 }}>
                      {action.priority}
                    </span>
                  </div>
                  <div style={{ flex: 1 }}>
                    <p style={{ ...TYPE.scale.captionStrong, color: COLOR.ink, margin: 0 }}>
                      {action.action}
                    </p>
                    <p
                      style={{
                        ...TYPE.scale.finePrint,
                        color: COLOR.inkMuted48,
                        margin: `${SPACE.xxs}px 0 0`,
                      }}
                    >
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
            <div style={{ display: "flex", flexDirection: "column", gap: SPACE.xs }}>
              {incident.investigation_steps.map((step, i) => (
                <div
                  key={i}
                  style={{
                    display: "flex",
                    gap: SPACE.sm,
                    alignItems: "flex-start",
                    padding: `${SPACE.xxs}px 0`,
                  }}
                >
                  <span
                    style={{
                      ...TYPE.scale.finePrint,
                      color: COLOR.primary,
                      fontWeight: 700,
                      minWidth: 18,
                      marginTop: 1,
                    }}
                  >
                    {i + 1}.
                  </span>
                  <span style={{ ...TYPE.scale.caption, color: COLOR.ink }}>{step}</span>
                </div>
              ))}
            </div>
          </Section>
        )}

        {/* Long-term Fix */}
        {incident.long_term_fix && (
          <Section label="Long-Term Remediation">
            <div
              style={{
                background: COLOR.canvasParchment,
                border: `1px solid ${COLOR.hairline}`,
                borderRadius: RADIUS.sm,
                padding: `${SPACE.md}px`,
              }}
            >
              <p style={{ ...TYPE.scale.body, color: COLOR.ink, margin: 0 }}>{incident.long_term_fix}</p>
            </div>
          </Section>
        )}
      </div>
    </div>
  );
}

function Section({ label, children }) {
  return (
    <div style={{ marginBottom: SPACE.lg }}>
      <div
        style={{
          borderBottom: `1px solid ${COLOR.hairline}`,
          marginBottom: SPACE.sm,
          paddingBottom: SPACE.xxs,
        }}
      >
        <SectionLabel>{label}</SectionLabel>
      </div>
      {children}
    </div>
  );
}

function InfoRow({ label, value, mono }) {
  return (
    <div
      style={{
        display: "flex",
        gap: SPACE.lg,
        marginBottom: SPACE.sm,
        padding: `${SPACE.xs}px ${SPACE.md}px`,
        background: COLOR.canvasParchment,
        borderRadius: RADIUS.sm,
        border: `1px solid ${COLOR.hairline}`,
        alignItems: "center",
      }}
    >
      <span style={{ ...TYPE.scale.captionStrong, color: COLOR.inkMuted48, minWidth: 130 }}>{label}</span>
      <span
        style={{
          ...TYPE.scale.caption,
          color: COLOR.ink,
          fontFamily: mono ? `"SF Mono", "JetBrains Mono", monospace` : undefined,
        }}
      >
        {value}
      </span>
    </div>
  );
}
