"""FastAPI application factory."""
import logging
from pathlib import Path
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse

from app.config import settings
from app.api.routes.analysis import router as analysis_router
from app.api.routes.health import router as health_router

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s — %(message)s",
)

STATIC_DIR = Path(__file__).parent.parent.parent / "frontend" / "dist"


def create_app() -> FastAPI:
    app = FastAPI(
        title="SOC Analyst Copilot API",
        version="1.0.0",
        description="4-agent AI pipeline for SIEM alert triage (AMD ROCm / vLLM)",
    )

    app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    app.include_router(analysis_router)
    app.include_router(health_router)

    # Serve built frontend if dist/ exists
    if STATIC_DIR.exists():
        app.mount("/assets", StaticFiles(directory=STATIC_DIR / "assets"), name="assets")

        @app.get("/{full_path:path}", include_in_schema=False)
        async def serve_spa(full_path: str):
            index = STATIC_DIR / "index.html"
            return FileResponse(index)

    return app


app = create_app()
