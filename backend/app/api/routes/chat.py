"""POST /api/chat/ — streams LLM answers about a selected incident as SSE."""
import json
import logging
from typing import AsyncGenerator

from fastapi import APIRouter, Depends
from fastapi.responses import StreamingResponse
from pydantic import BaseModel

from app.api.dependencies import get_llm_service
from app.services.llm_service import LLMService

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/chat", tags=["chat"])


class ChatMessage(BaseModel):
    role: str   # "user" | "assistant"
    content: str


class ChatRequest(BaseModel):
    incident: dict
    messages: list[ChatMessage]


CHAT_SYSTEM_TEMPLATE = """You are a senior SOC analyst assistant with 15 years of experience.
You are analyzing the following confirmed security incident:

INCIDENT: {incident_title}
SEVERITY: {incident_sev}
SUMMARY: {incident_summary}

FULL INCIDENT DATA:
{incident_json}

Answer the analyst's questions concisely and clearly.
Be specific — reference exact IPs, timestamps, and techniques from the incident data.
For MITRE techniques, explain what they mean in plain English first, then the technical detail.
If asked to draft communications (emails, reports), provide a complete, ready-to-use draft.
Keep responses under 300 words unless drafting a document.
Never say "I cannot" — always provide your best answer using the incident data available."""


def _sse(payload: dict) -> str:
    return f"data: {json.dumps(payload)}\n\n"


async def _stream_chat(
    request: ChatRequest, llm: LLMService
) -> AsyncGenerator[str, None]:
    incident = request.incident
    system_prompt = CHAT_SYSTEM_TEMPLATE.format(
        incident_title=incident.get("title", "Unknown"),
        incident_sev=incident.get("sev", "Unknown"),
        incident_summary=incident.get("summary", ""),
        incident_json=json.dumps(incident, indent=2)[:3000],
    )

    messages = [{"role": m.role, "content": m.content} for m in request.messages]

    try:
        response_text = await llm.complete(system_prompt, messages[-1]["content"])

        chunk_size = 50
        for i in range(0, len(response_text), chunk_size):
            chunk = response_text[i:i + chunk_size]
            yield _sse({"type": "token", "content": chunk})

        yield _sse({"type": "done"})

    except Exception as exc:
        logger.exception("Chat error")
        yield _sse({"type": "error", "message": str(exc)})


@router.post("/")
async def chat(
    request: ChatRequest,
    llm: LLMService = Depends(get_llm_service),
) -> StreamingResponse:
    return StreamingResponse(
        _stream_chat(request, llm),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"},
    )
