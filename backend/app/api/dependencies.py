from functools import lru_cache
from app.services.llm_service import LLMService
from app.config import settings


@lru_cache(maxsize=1)
def get_llm_service() -> LLMService:
    return LLMService(settings)
