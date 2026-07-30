"""
Terra·AI Backend API + React Frontend.

FastAPI handles all API requests at /api/v1/*
Gradio handles HF Space supervisor health probes
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

# Serve custom React SPA static build on root '/'
if frontend_dist.exists():
    assets_dir = frontend_dist / "assets"
    if assets_dir.exists():
        fastapi_app.mount("/assets", StaticFiles(directory=str(assets_dir)), name="assets")

    @fastapi_app.get("/app")
    async def serve_index():
        index_file = frontend_dist / "index.html"
        if index_file.exists():
            return FileResponse(str(index_file))
        return {"message": "Terra·AI React Frontend index.html not found"}

# Gradio interface for HF Space supervisor health check
with gr.Blocks(title="Terra·AI — Agricultural Intelligence API") as demo:
    gr.Markdown("# 🌿 Terra·AI Agricultural Intelligence API")
    gr.Markdown(
        "API service powering Leaf Disease Detection (MobileNetV2), "
        "Soil Analysis (EfficientNet-B0), Crop Recommendation (CatBoost), and Expert RAG/LLM Advice."
    )
    gr.Markdown(
        "### Endpoints Available:\n"
        "- `POST /api/v1/analyze/disease` — Leaf disease diagnosis\n"
        "- `POST /api/v1/analyze/soil` — Soil classification & properties\n"
        "- `POST /api/v1/recommend/crop` — NPK & climate crop recommendations\n"
        "- `POST /api/v1/advice` — Expert agricultural advice stream\n"
        "- `GET /api/v1/health` — System health check\n"
        "- `GET /docs` — Interactive OpenAPI Swagger UI"
    )

app = gr.mount_gradio_app(fastapi_app, demo, path="/")

if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", "7860"))
    uvicorn.run("app:app", host="0.0.0.0", port=port, reload=False)
