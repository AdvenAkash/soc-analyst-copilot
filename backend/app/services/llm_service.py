"""
LLM service — abstracts vLLM and Ollama backends.
"""
import logging
import httpx
from app.config import settings as _default_settings, Settings

logger = logging.getLogger(__name__)


class LLMService:
    def __init__(self, cfg: Settings = _default_settings) -> None:
        self._cfg = cfg

    async def complete(self, system_prompt: str, user_message: str) -> str:
        if self._cfg.llm_backend == "vllm":
            return await self._complete_vllm(system_prompt, user_message)
        return await self._complete_ollama(system_prompt, user_message)

    async def _complete_vllm(self, system: str, user: str) -> str:
        payload = {
            "model": self._cfg.vllm_model,
            "messages": [
                {"role": "system", "content": system},
                {"role": "user", "content": user},
            ],
            "temperature": self._cfg.llm_temperature,
            "max_tokens": self._cfg.llm_max_tokens,
            "stream": False,
        }
        headers = {
            "Content-Type": "application/json",
            "Authorization": f"Bearer {self._cfg.vllm_api_key}",
        }
        timeout = httpx.Timeout(self._cfg.vllm_timeout_seconds)
        async with httpx.AsyncClient(timeout=timeout) as client:
            response = await client.post(
                f"{self._cfg.vllm_base_url}/chat/completions",
                json=payload,
                headers=headers,
            )
            response.raise_for_status()
            data = response.json()
        content = data["choices"][0]["message"]["content"]
        logger.debug("[vLLM] tokens_used=%s", data.get("usage", {}).get("total_tokens"))
        return content

    async def _complete_ollama(self, system: str, user: str) -> str:
        payload = {
            "model": self._cfg.ollama_model,
            "stream": False,
            "options": {
                "temperature": self._cfg.llm_temperature,
                "num_predict": self._cfg.llm_max_tokens,
            },
            "messages": [
                {"role": "system", "content": system},
                {"role": "user", "content": user},
            ],
        }
        timeout = httpx.Timeout(self._cfg.ollama_timeout_seconds)
        async with httpx.AsyncClient(timeout=timeout) as client:
            response = await client.post(
                f"{self._cfg.ollama_base_url}/api/chat",
                json=payload,
            )
            response.raise_for_status()
            data = response.json()
        return data["message"]["content"]
