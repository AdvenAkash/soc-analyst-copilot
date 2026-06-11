"""Server-Sent Event payload schemas."""
from enum import StrEnum
from typing import Any
from pydantic import BaseModel


class SSEEventType(StrEnum):
    AGENT_START   = "agent_start"
    AGENT_DONE    = "agent_done"
    PIPELINE_DONE = "pipeline_done"
    ERROR         = "error"


class SSEEvent(BaseModel):
    type: SSEEventType
    agent: str | None = None
    message: str = ""
    data: dict[str, Any] | None = None
    incidents: list[dict[str, Any]] | None = None
