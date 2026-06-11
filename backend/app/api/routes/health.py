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
