"""FastAPI application factory."""
import logging
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.api.routes.analysis import router as analysis_router
from app.api.routes.health import router as health_router

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s — %(message)s",
)


def create_app() -> FastAPI:
    app = FastAPI(
        title="SOC Analyst Copilot API",
        version="1.0.0",
        description="4-agent AI pipeline for SIEM alert triage (AMD ROCm / vLLM)",
    )

    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origins_list,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    app.include_router(analysis_router)
    app.include_router(health_router)

    return app


app = create_app()
