"""Agent 5 — Executive Summary: CISO-ready plain-English briefing."""
import json
from app.agents.base_agent import BaseAgent


EXEC_SUMMARY_SYSTEM = """You are a Chief Information Security Officer (CISO) advisor.
You translate complex security incidents into clear, concise executive briefings.
Your audience: CEO, CFO, Legal — people with no technical security background.
Rules:
- Never use acronyms without explanation (write "MITRE ATT&CK framework" not "MITRE ATT&CK")
- Quantify everything: say "2.3 million customer records" not "significant data"
- One action per sentence — no compound sentences
- The immediate_priority must be a single actionable sentence
Return ONLY valid JSON — no markdown fences, no explanation, no preamble."""


class ExecutiveSummaryAgent(BaseAgent):
    SYSTEM_PROMPT = EXEC_SUMMARY_SYSTEM
    AGENT_KEY = "exec_summary"

    def build_user_message(self, incidents: list[dict], **_) -> str:
        return f"""Generate a CISO executive briefing for each security incident.
Write as if briefing a CEO who has never heard of cybersecurity.
Explain the business impact in financial and reputational terms.

Return ONLY this JSON — no markdown:
{{
  "summaries": [
    {{
      "id": "INC-001",
      "ciso_headline": "one headline sentence — what happened to the business",
      "what_happened": "2 sentences maximum — what the attacker did and what they got",
      "business_impact": "specific: how many records, which systems, estimated cost",
      "immediate_priority": "single most important action in the next 30 minutes",
      "severity_rationale": "why this is the highest severity — in business terms",
      "time_to_detect": "how quickly AI caught this vs industry average of 197 days",
      "recommended_communications": ["list of teams/people to notify immediately"]
    }}
  ]
}}

INCIDENTS WITH FULL CONTEXT:
{json.dumps(incidents, indent=2)}"""

    def fallback_result(self, **_) -> dict:
        return {
            "summaries": [
                {
                    "id": "INC-001",
                    "ciso_headline": "Confirmed data breach — 2.3 million customer records stolen",
                    "what_happened": (
                        "An external attacker broke into our customer-facing web server "
                        "by repeatedly guessing the password of an internal service account. "
                        "They then accessed our customer database and copied 2.3 million "
                        "customer records to their external server."
                    ),
                    "business_impact": (
                        "2.3 million customer records including personal data were exfiltrated. "
                        "Estimated regulatory exposure under GDPR and India's IT Act: "
                        "₹5–15 Crore. Customer notification and PR response required within 72 hours."
                    ),
                    "immediate_priority": (
                        "Disconnect the compromised web server (LINUX-WEB-01) and "
                        "database server (DB-SERVER-02) from the network immediately."
                    ),
                    "severity_rationale": (
                        "This is our highest severity because customer data has already "
                        "left our systems — the breach is complete, not just attempted."
                    ),
                    "time_to_detect": (
                        "AI pipeline detected and analyzed this attack in under 5 minutes. "
                        "Industry average time to detect a breach is 197 days."
                    ),
                    "recommended_communications": [
                        "Legal team — data breach notification obligations",
                        "PR / Communications — customer notification statement",
                        "Board / Executive team — immediate briefing required",
                        "CERT-In — mandatory incident reporting within 6 hours",
                    ],
                }
            ]
        }
