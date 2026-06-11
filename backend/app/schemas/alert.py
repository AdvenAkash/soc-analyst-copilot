"""Pydantic schemas for SIEM alerts."""
from enum import StrEnum
from pydantic import BaseModel


class AlertSeverity(StrEnum):
    CRITICAL = "CRITICAL"
    HIGH = "HIGH"
    MEDIUM = "MEDIUM"
    LOW = "LOW"


class Alert(BaseModel):
    id: str
    time: str
    sev: AlertSeverity
    rule: str
    src: str
    dst: str
    detail: str
    host: str
