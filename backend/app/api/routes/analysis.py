"""POST /api/analysis/run — streams 4-agent pipeline as SSE."""
import json
import logging
from typing import AsyncGenerator

from fastapi import APIRouter, Depends
from fastapi.responses import StreamingResponse

from app.agents.triage_agent import TriageAgent
from app.agents.threat_intel_agent import ThreatIntelAgent
from app.agents.investigation_agent import InvestigationAgent
from app.agents.playbook_agent import PlaybookAgent
from app.api.dependencies import get_llm_service
from app.schemas.alert import Alert
from app.services.llm_service import LLMService

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/analysis", tags=["analysis"])


def _sse(payload: dict) -> str:
    return f"data: {json.dumps(payload)}\n\n"


async def _run_pipeline(
    alerts: list[Alert], llm: LLMService
) -> AsyncGenerator[str, None]:
    triage_result: dict = {}
    enriched_result: dict = {}
    invest_result: dict = {}

    yield _sse({"type":"agent_start","agent":"triage",
                "message":f"Analyzing {len(alerts)} alerts, identifying attack patterns..."})
    try:
        triage_result = await TriageAgent(llm).run(alerts=alerts)
        incidents_raw = triage_result.get("incidents", [])
        fp_count = sum(len(i.get("fp_ids", [])) for i in incidents_raw)
        yield _sse({"type":"agent_done","agent":"triage","data":triage_result,
                    "message":f"{len(incidents_raw)} incident(s) found, {fp_count} false positives dismissed"})
    except Exception as exc:
        logger.exception("Triage agent error")
        yield _sse({"type":"error","message":str(exc)})
        return

    yield _sse({"type":"agent_start","agent":"threat_intel",
                "message":"Cross-referencing MITRE ATT&CK framework, enriching IOCs..."})
    try:
        enriched_result = await ThreatIntelAgent(llm).run(
            incidents=triage_result.get("incidents", []), alerts=alerts
        )
        ttp_count = len(enriched_result.get("enriched", [{}])[0].get("mitre_techniques", []))
        yield _sse({"type":"agent_done","agent":"threat_intel","data":enriched_result,
                    "message":f"{ttp_count} MITRE ATT&CK techniques mapped"})
    except Exception as exc:
        logger.exception("ThreatIntel agent error")
        yield _sse({"type":"error","message":str(exc)})
        return

    yield _sse({"type":"agent_start","agent":"investigation",
                "message":"Reconstructing attack timeline, mapping kill chain..."})
    try:
        invest_result = await InvestigationAgent(llm).run(
            incidents=triage_result.get("incidents", []), alerts=alerts
        )
        event_count = len(invest_result.get("investigations", [{}])[0].get("timeline", []))
        yield _sse({"type":"agent_done","agent":"investigation","data":invest_result,
                    "message":f"{event_count} timeline events reconstructed"})
    except Exception as exc:
        logger.exception("Investigation agent error")
        yield _sse({"type":"error","message":str(exc)})
        return

    yield _sse({"type":"agent_start","agent":"playbook",
                "message":"Generating prioritized remediation playbook..."})
    try:
        playbook_result = await PlaybookAgent(llm).run(
            incidents=triage_result.get("incidents", []),
            investigations=invest_result.get("investigations", []),
        )
        action_count = len(playbook_result.get("playbooks", [{}])[0].get("immediate_actions", []))
        yield _sse({"type":"agent_done","agent":"playbook","data":playbook_result,
                    "message":f"{action_count} immediate actions generated"})
    except Exception as exc:
        logger.exception("Playbook agent error")
        yield _sse({"type":"error","message":str(exc)})
        return

    final_incidents = _merge_results(triage_result, enriched_result, invest_result, playbook_result)
    yield _sse({"type":"pipeline_done","incidents":final_incidents})


def _merge_results(triage: dict, threat_intel: dict, investigation: dict, playbook: dict) -> list[dict]:
    merged = []
    for inc in triage.get("incidents", []):
        iid = inc["id"]
        threat = next((e for e in threat_intel.get("enriched", []) if e.get("id") == iid), {})
        invest = next((i for i in investigation.get("investigations", []) if i.get("id") == iid), {})
        play = next((p for p in playbook.get("playbooks", []) if p.get("id") == iid), {})
        merged.append({
            **inc,
            "mitre_tactics":       threat.get("mitre_tactics", []),
            "mitre_techniques":    threat.get("mitre_techniques", []),
            "threat_actor":        threat.get("threat_actor", ""),
            "confidence":          threat.get("confidence", "MEDIUM"),
            "iocs":                threat.get("iocs", []),
            "kill_chain_stage":    invest.get("kill_chain_stage", ""),
            "timeline":            invest.get("timeline", []),
            "affected_assets":     invest.get("affected_assets", []),
            "impact":              invest.get("impact", ""),
            "immediate_actions":   play.get("immediate_actions", []),
            "investigation_steps": play.get("investigation_steps", []),
            "long_term_fix":       play.get("long_term_fix", ""),
        })
    return merged


@router.post("/run")
async def run_analysis(
    alerts: list[Alert],
    llm: LLMService = Depends(get_llm_service),
) -> StreamingResponse:
    return StreamingResponse(
        _run_pipeline(alerts, llm),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"},
    )
