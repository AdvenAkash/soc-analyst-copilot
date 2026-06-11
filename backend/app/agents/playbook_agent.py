"""Agent 4 — Playbook: prioritized remediation steps."""
import json
from app.agents.base_agent import BaseAgent


PLAYBOOK_SYSTEM = """You are an Incident Response Playbook Specialist.
Generate precise, immediately actionable remediation steps.
Every action must be specific enough to execute without further clarification.
Assign realistic time-to-complete and responsible team for each action.
Return ONLY valid JSON — no markdown fences, no explanation, no preamble."""


class PlaybookAgent(BaseAgent):
    SYSTEM_PROMPT = PLAYBOOK_SYSTEM
    AGENT_KEY = "playbook"

    def build_user_message(self, incidents: list[dict], investigations: list[dict], **_) -> str:
        return f"""Generate a complete remediation playbook for each incident.

Return ONLY this JSON — no markdown:
{{
  "playbooks": [
    {{
      "id": "INC-001",
      "immediate_actions": [
        {{
          "priority": 1,
          "action": "exact executable action",
          "owner": "responsible team",
          "eta": "5 min"
        }}
      ],
      "investigation_steps": ["specific forensic step"],
      "long_term_fix": "strategic prevention recommendation"
    }}
  ]
}}

INCIDENTS:
{json.dumps(incidents, indent=2)}

ATTACK TIMELINES:
{json.dumps(investigations, indent=2)}"""

    def fallback_result(self, **_) -> dict:
        return {
            "playbooks": [{
                "id": "INC-001",
                "immediate_actions": [
                    {"priority":1,"action":"Isolate LINUX-WEB-01 and DB-SERVER-02 from all network segments","owner":"Network Security","eta":"5 min"},
                    {"priority":2,"action":"Block 185.220.101.45 and all Tor exit node ranges at perimeter firewall","owner":"SOC Analyst","eta":"10 min"},
                    {"priority":3,"action":"Revoke svc_deploy credentials and terminate all active sessions","owner":"IAM Team","eta":"10 min"},
                    {"priority":4,"action":"Remove malicious cron and unauthorized SSH key from LINUX-WEB-01","owner":"Incident Response","eta":"15 min"},
                    {"priority":5,"action":"Capture forensic disk image of affected systems before remediation","owner":"Digital Forensics","eta":"30 min"},
                ],
                "investigation_steps": [
                    "Review all commands by svc_deploy since 09:47 (auth.log, bash_history, auditd)",
                    "Identify exact records in the 2.3M-row DB query — determine full PII scope",
                    "Audit all SSH authorized_keys across infrastructure for additional backdoors",
                    "Search SIEM for 185.220.101.45 in last 30 days — recurring attacker?",
                    "Verify whether attacker accessed credential stores, vault secrets, or cloud keys",
                ],
                "long_term_fix": ("Enforce SSH key-only auth (disable password login). Implement PAM. "
                                  "Add micro-segmentation between web and DB tiers. Deploy DLP on outbound transfers above 100 MB."),
            }]
        }
