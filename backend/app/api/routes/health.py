from fastapi import APIRouter
from app.config import settings

router = APIRouter(prefix="/api", tags=["health"])


@router.get("/health")
async def health_check() -> dict:
    return {
        "status": "ok",
        "llm_backend": settings.llm_backend,
        "model": (
            settings.vllm_model
            if settings.llm_backend == "vllm"
            else settings.ollama_model
        ),
    }


@router.get("/config")
async def get_config() -> dict:
    """Return current backend configuration (read from .env at startup)."""
    return {
        "llm_backend":       settings.llm_backend,
        "active_model":      settings.ollama_model if settings.llm_backend == "ollama" else settings.vllm_model,
        "ollama_url":        settings.ollama_base_url,
        "ollama_model":      settings.ollama_model,
        "ollama_timeout":    settings.ollama_timeout_seconds,
        "vllm_url":          settings.vllm_base_url,
        "vllm_model":        settings.vllm_model,
        "vllm_timeout":      settings.vllm_timeout_seconds,
        "temperature":       settings.llm_temperature,
        "max_tokens":        settings.llm_max_tokens,
        "cors_origins":      settings.cors_origins,
        "api_port":          settings.api_port,
    }
