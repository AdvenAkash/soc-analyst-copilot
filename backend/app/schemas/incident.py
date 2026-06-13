"""Pydantic schemas for enriched incident data."""
from enum import StrEnum
from pydantic import BaseModel


class ConfidenceLevel(StrEnum):
    HIGH = "HIGH"
    MEDIUM = "MEDIUM"
    LOW = "LOW"


class MitreTechnique(BaseModel):
    id: str
    name: str
    tactic: str


class TimelineEvent(BaseModel):
    time: str
    event: str
    stage: str
    alert_id: str


class ImmediateAction(BaseModel):
    priority: int
    action: str
    owner: str
    eta: str


class Incident(BaseModel):
    id: str
    title: str
    sev: str
    alert_ids: list[str]
    fp_ids: list[str] = []
    summary: str
    mitre_tactics: list[str] = []
    mitre_techniques: list[MitreTechnique] = []
    threat_actor: str = ""
    confidence: ConfidenceLevel = ConfidenceLevel.MEDIUM
    iocs: list[str] = []
    timeline: list[TimelineEvent] = []
    kill_chain_stage: str = ""
    affected_assets: list[str] = []
    impact: str = ""
    immediate_actions: list[ImmediateAction] = []
    investigation_steps: list[str] = []
    long_term_fix: str = ""
    executive_summary: dict = {}
