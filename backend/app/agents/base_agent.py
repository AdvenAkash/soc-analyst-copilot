"""Abstract base class for all SOC pipeline agents."""
from abc import ABC, abstractmethod
import logging
from app.services.llm_service import LLMService
from app.utils.json_parser import extract_json

logger = logging.getLogger(__name__)


class BaseAgent(ABC):
    SYSTEM_PROMPT: str = ""
    AGENT_KEY: str = ""

    def __init__(self, llm: LLMService) -> None:
        self._llm = llm

    @abstractmethod
    def build_user_message(self, **kwargs) -> str:
        """Build the user-turn message from pipeline context."""

    @abstractmethod
    def fallback_result(self, **kwargs) -> dict:
        """Return a safe hardcoded result if the LLM call fails."""

    async def run(self, **kwargs) -> dict:
        """Call the LLM, extract JSON, return structured dict."""
        user_msg = self.build_user_message(**kwargs)
        try:
            raw_text = await self._llm.complete(self.SYSTEM_PROMPT, user_msg)
            result = extract_json(raw_text)
            logger.info("[%s] success", self.AGENT_KEY)
            return result
        except Exception as exc:
            logger.warning("[%s] failed (%s) — using fallback", self.AGENT_KEY, exc)
            return self.fallback_result(**kwargs)
