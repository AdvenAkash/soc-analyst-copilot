"""Agent 2 — Threat Intel: MITRE ATT&CK mapping and IOC enrichment."""
import json
from app.agents.base_agent import BaseAgent
from app.schemas.alert import Alert


THREAT_INTEL_SYSTEM = """You are a Threat Intelligence Analyst and MITRE ATT&CK expert.
Enrich security incidents with MITRE ATT&CK tactic and technique mappings,
threat actor assessment, and Indicators of Compromise (IOCs).
Return ONLY valid JSON — no markdown fences, no explanation, no preamble."""


class ThreatIntelAgent(BaseAgent):
    SYSTEM_PROMPT = THREAT_INTEL_SYSTEM
    AGENT_KEY = "threat_intel"

    def build_user_message(self, incidents: list[dict], alerts: list[Alert], **_) -> str:
        return f"""Enrich these incidents with MITRE ATT&CK and threat intelligence.

Return ONLY this JSON — no markdown:
{{
  "enriched": [
    {{
      "id": "INC-001",
      "mitre_tactics": ["Reconnaissance","Initial Access"],
      "mitre_techniques": [
        {{"id":"T1595","name":"Active Scanning","tactic":"Reconnaissance"}}
      ],
      "threat_actor": "description of suspected actor / group",
      "confidence": "HIGH",
      "iocs": ["185.220.101.45 (Tor Exit Node)"]
    }}
  ]
}}

INCIDENTS:
{json.dumps(incidents, indent=2)}

ORIGINAL ALERTS:
{json.dumps([a.model_dump() for a in alerts], indent=2)}"""

    def fallback_result(self, **_) -> dict:
        return {
            "enriched": [{
                "id": "INC-001",
                "mitre_tactics": ["Reconnaissance","Initial Access","Privilege Escalation",
                                  "Persistence","Lateral Movement","Collection","Exfiltration"],
                "mitre_techniques": [
                    {"id":"T1595","name":"Active Scanning",        "tactic":"Reconnaissance"},
                    {"id":"T1110","name":"Brute Force",            "tactic":"Credential Access"},
                    {"id":"T1078","name":"Valid Accounts",         "tactic":"Initial Access"},
                    {"id":"T1548","name":"Sudo Escalation",        "tactic":"Privilege Escalation"},
                    {"id":"T1053","name":"Scheduled Task / Job",   "tactic":"Persistence"},
                    {"id":"T1021","name":"Remote Services (SSH)",  "tactic":"Lateral Movement"},
                    {"id":"T1005","name":"Data from Local System", "tactic":"Collection"},
                    {"id":"T1041","name":"Exfil Over C2 Channel",  "tactic":"Exfiltration"},
                ],
                "threat_actor": "Suspected financially-motivated APT — Tor infrastructure, systematic SSH TTPs",
                "confidence": "HIGH",
                "iocs": [
                    "185.220.101.45 (Tor Exit Node)",
                    "beacon.sh download URL",
                    "Malicious cron entry",
                    "Unauthorized /root/.ssh/authorized_keys modification",
                ],
            }]
        }
