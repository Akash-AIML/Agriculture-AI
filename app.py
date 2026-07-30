"""
Terra·AI Backend API + React Frontend.

FastAPI handles all API requests at /api/v1/*
Custom React Frontend is served at /
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

# Serve your custom React SPA static build on root '/'
if frontend_dist.exists():
    assets_dir = frontend_dist / "assets"
    if assets_dir.exists():
        fastapi_app.mount("/assets", StaticFiles(directory=str(assets_dir)), name="assets")

    @fastapi_app.get("/")
    async def serve_index():
        index_file = frontend_dist / "index.html"
        if index_file.exists():
            return FileResponse(str(index_file))
        return {"message": "Terra·AI React Frontend index.html not found"}

    @fastapi_app.get("/{full_path:path}")
    async def serve_spa_routes(full_path: str):
        if full_path.startswith("api/") or full_path.startswith("docs") or full_path.startswith("openapi.json"):
            return None
        
        file_path = frontend_dist / full_path
        if file_path.exists() and file_path.is_file():
            return FileResponse(str(file_path))
            
        index_file = frontend_dist / "index.html"
        if index_file.exists():
            return FileResponse(str(index_file))
        return {"message": "Route not found"}

# Internal Gradio block wrapper so Hugging Face SDK allocates 16 GB free RAM
with gr.Blocks(title="Terra·AI API Backend") as demo:
    gr.Markdown("# 🌿 Terra·AI API Backend Running")

app = gr.mount_gradio_app(fastapi_app, demo, path="/gradio_internal")

if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", "7860"))
    uvicorn.run("app:app", host="0.0.0.0", port=port, reload=False)
