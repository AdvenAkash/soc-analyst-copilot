"""Application configuration loaded from environment / .env file."""
from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import field_validator
from typing import Literal


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    llm_backend: Literal["vllm", "ollama"] = "vllm"

    vllm_base_url: str = "http://localhost:8001/v1"
    vllm_model: str = "meta-llama/Llama-3.1-8B-Instruct"
    vllm_api_key: str = "EMPTY"
    vllm_timeout_seconds: int = 120

    ollama_base_url: str = "http://localhost:11434"
    ollama_model: str = "llama3.1:8b"
    ollama_timeout_seconds: int = 120

    api_host: str = "0.0.0.0"
    api_port: int = 8000
    cors_origins: str = "http://localhost:5173"

    llm_temperature: float = 0.1
    llm_max_tokens: int = 1500

    @field_validator("cors_origins", mode="before")
    @classmethod
    def parse_cors(cls, v: str) -> str:
        return v

    @property
    def cors_origins_list(self) -> list[str]:
        return [o.strip() for o in self.cors_origins.split(",")]


settings = Settings()
