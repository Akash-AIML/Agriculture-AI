"""
Terra·AI Backend API + Gradio UI on Hugging Face Spaces.

HF Gradio SDK auto-detects the `app` variable and runs uvicorn on it.
FastAPI AI endpoints run at /api/v1/*
Gradio landing page at /gradio/
"""

import os
import sys
from pathlib import Path
import gradio as gr

root_dir = Path(__file__).resolve().parent
backend_dir = root_dir / "backend"

for d in [str(root_dir), str(backend_dir)]:
    if d not in sys.path:
        sys.path.insert(0, d)

from main import app as fastapi_app  # FastAPI backend

# Minimal Gradio landing page
with gr.Blocks(title="Terra·AI — Agricultural Intelligence API") as demo:
    gr.Markdown("# 🌿 Terra·AI Agricultural Intelligence Platform")
    gr.Markdown(
        "Full Multi-Model AI API running. Use the endpoints below:"
    )
    gr.Markdown(
        "- `POST /api/v1/analyze/disease` — Leaf disease detection\n"
        "- `POST /api/v1/analyze/soil` — Soil classification\n"
        "- `POST /api/v1/recommend/crop` — Crop recommendation\n"
        "- `GET /api/v1/health` — Health check\n"
        "- `GET /docs` — Swagger UI"
    )

# Mount Gradio onto FastAPI — HF detects `app` and runs uvicorn automatically
app = gr.mount_gradio_app(fastapi_app, demo, path="/gradio")
