"""Agent 3 — Investigation: attack timeline reconstruction."""
import json
from app.agents.base_agent import BaseAgent
from app.schemas.alert import Alert


INVESTIGATION_SYSTEM = """You are a Security Investigation Analyst.
Reconstruct precise, chronological attack timelines from correlated SIEM alerts.
Map each step to a Cyber Kill Chain phase.
Write each timeline event in plain English clear enough for a CISO.
Return ONLY valid JSON — no markdown fences, no explanation, no preamble."""


class InvestigationAgent(BaseAgent):
    SYSTEM_PROMPT = INVESTIGATION_SYSTEM
    AGENT_KEY = "investigation"

    def build_user_message(self, incidents: list[dict], alerts: list[Alert], **_) -> str:
        return f"""Build a detailed attack timeline for each incident.

Return ONLY this JSON — no markdown:
{{
  "investigations": [
    {{
      "id": "INC-001",
      "kill_chain_stage": "Exfiltration (Attack Complete)",
      "timeline": [
        {{
          "time": "09:47:23",
          "event": "Attacker initiated port scan of entire DMZ subnet",
          "stage": "Reconnaissance",
          "alert_id": "A001"
        }}
      ],
      "affected_assets": ["LINUX-WEB-01 (10.0.1.15)"],
      "impact": "business and data exposure description"
    }}
  ]
}}

INCIDENTS:
{json.dumps(incidents, indent=2)}

ALERTS:
{json.dumps([a.model_dump() for a in alerts], indent=2)}"""

    def fallback_result(self, **_) -> dict:
        return {
            "investigations": [{
                "id": "INC-001",
                "kill_chain_stage": "Exfiltration — Attack Complete",
                "timeline": [
                    {"time":"09:47:23","event":"Attacker initiated port scan of DMZ subnet",             "stage":"Reconnaissance",      "alert_id":"A001"},
                    {"time":"09:52:11","event":"SSH brute force launched against LINUX-WEB-01",          "stage":"Initial Access",      "alert_id":"A004"},
                    {"time":"09:54:17","event":"SSH login successful — svc_deploy account compromised",  "stage":"Initial Access",      "alert_id":"A007"},
                    {"time":"09:55:33","event":"Privilege escalation to root via sudo",                  "stage":"Privilege Escalation","alert_id":"A008"},
                    {"time":"09:56:05","event":"Persistence via malicious cron + SSH key backdoor",      "stage":"Persistence",         "alert_id":"A010"},
                    {"time":"09:58:44","event":"Lateral movement attempted to 14 internal hosts",        "stage":"Lateral Movement",    "alert_id":"A012"},
                    {"time":"09:59:12","event":"DB-SERVER-02 compromised via credential reuse",          "stage":"Lateral Movement",    "alert_id":"A013"},
                    {"time":"09:59:55","event":"Mass DB query — 2.3M customer records accessed by root", "stage":"Collection",          "alert_id":"A014"},
                    {"time":"10:02:33","event":"4.7 GB exfiltrated to attacker C2 server",              "stage":"Exfiltration",        "alert_id":"A015"},
                ],
                "affected_assets": ["LINUX-WEB-01 (10.0.1.15)","DB-SERVER-02 (10.0.2.45)","AD-SERVER-01"],
                "impact": "2.3M customer PII records exposed. Potential GDPR breach. Estimated exposure: significant regulatory fines.",
            }]
        }
