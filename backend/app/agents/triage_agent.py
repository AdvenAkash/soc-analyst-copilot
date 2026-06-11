"""Agent 1 — Triage: groups correlated alerts into incidents."""
import json
from app.agents.base_agent import BaseAgent
from app.schemas.alert import Alert


TRIAGE_SYSTEM = """You are a senior SOC Triage Analyst with 10 years of experience.
You receive raw SIEM alerts and must:
1. Identify attack campaigns by correlating related alerts (same source IP,
   same target, same time window, same attacker TTP chain).
2. Group correlated alerts into named security incidents.
3. Dismiss routine/expected activity as false positives.
4. Assign a severity: CRITICAL / HIGH / MEDIUM / LOW.
Return ONLY valid JSON — no markdown fences, no explanation, no preamble."""


class TriageAgent(BaseAgent):
    SYSTEM_PROMPT = TRIAGE_SYSTEM
    AGENT_KEY = "triage"

    def build_user_message(self, alerts: list[Alert], **_) -> str:
        alerts_json = json.dumps([a.model_dump() for a in alerts], indent=2)
        return f"""Analyze these {len(alerts)} SIEM alerts (representing 500 ingested).
Group correlated alerts into real incidents. Identify false positives.

Return ONLY this JSON — no markdown:
{{
  "incidents": [
    {{
      "id": "INC-001",
      "title": "short descriptive title",
      "sev": "CRITICAL",
      "alert_ids": ["A007","A008"],
      "summary": "1-2 sentence summary",
      "fp_ids": ["A017","A018"]
    }}
  ],
  "processing_note": "brief analyst note"
}}

ALERTS:
{alerts_json}"""

    def fallback_result(self, **_) -> dict:
        return {
            "incidents": [{
                "id": "INC-001",
                "title": "APT Full Kill Chain — Customer Data Breach",
                "sev": "CRITICAL",
                "alert_ids": ["A001","A002","A003","A004","A005","A006","A007",
                              "A008","A009","A010","A011","A012","A013","A014",
                              "A015","A016"],
                "summary": ("External attacker from Tor node 185.220.101.45 performed "
                            "recon, brute-forced SSH, escalated to root, moved laterally "
                            "to the database, and exfiltrated 4.7 GB of customer records."),
                "fp_ids": ["A017","A018","A019","A020"],
            }],
            "processing_note": "Fallback result — LLM unavailable",
        }
