"""
Terra·AI Backend API + React Frontend on Hugging Face Spaces.

Gradio's demo.launch() keeps the HF container alive.
FastAPI AI endpoints run at /api/v1/*
"""

import os
import sys
from pathlib import Path
import gradio as gr

root_dir = Path(__file__).resolve().parent
backend_dir = root_dir / "backend"
frontend_dist = root_dir / "agriculture-ai-frontend" / "dist"

for d in [str(root_dir), str(backend_dir)]:
    if d not in sys.path:
        sys.path.insert(0, d)

from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from main import app as fastapi_app

# Serve custom React SPA static build on /app
if frontend_dist.exists():
    assets_dir = frontend_dist / "assets"
    if assets_dir.exists():
        fastapi_app.mount("/assets", StaticFiles(directory=str(assets_dir)), name="assets")

    @fastapi_app.get("/app")
    async def serve_index():
        index_file = frontend_dist / "index.html"
        if index_file.exists():
            return FileResponse(str(index_file))
        return {"message": "React Frontend index.html not found"}

# Gradio landing UI — also exposes /api/v1/* via FastAPI
with gr.Blocks(title="Terra·AI — Agricultural Intelligence API") as demo:
    gr.Markdown("# 🌿 Terra·AI Agricultural Intelligence Platform")
    gr.Markdown(
        "Full Multi-Model AI API: Leaf Disease Detection (MobileNetV2), "
        "Soil Analysis (EfficientNet-B0), Crop Recommendation (CatBoost), and Expert Advice."
    )
    gr.Markdown(
        "### API Endpoints:\n"
        "- `POST /api/v1/analyze/disease` — Leaf disease diagnosis\n"
        "- `POST /api/v1/analyze/soil` — Soil classification\n"
        "- `POST /api/v1/recommend/crop` — Crop recommendations\n"
        "- `POST /api/v1/advice` — Expert agricultural advice\n"
        "- `GET /api/v1/health` — Health check\n"
        "- `GET /docs` — OpenAPI Swagger UI"
    )

port = int(os.getenv("PORT", "7860"))
demo.launch(
    server_name="0.0.0.0",
    server_port=port,
    app_kwargs={"routes": fastapi_app.routes},
    share=False,
)
