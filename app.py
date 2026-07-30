"""
Terra·AI Backend API + Gradio UI on Hugging Face Spaces.

Mounts Gradio onto FastAPI, then runs uvicorn directly to keep
the HF Space container alive.
  - FastAPI AI endpoints:  /api/v1/*
  - Swagger UI:            /docs
  - Gradio landing page:  /gradio
"""

import os
import sys
from pathlib import Path

root_dir = Path(__file__).resolve().parent
backend_dir = root_dir / "backend"

for d in [str(root_dir), str(backend_dir)]:
    if d not in sys.path:
        sys.path.insert(0, d)

import gradio as gr
import uvicorn
from main import app as fastapi_app  # FastAPI backend

# Minimal Gradio landing page
with gr.Blocks(title="Terra·AI — Agricultural Intelligence API") as demo:
    gr.Markdown("# 🌿 Terra·AI Agricultural Intelligence Platform")
    gr.Markdown("Full Multi-Model AI API is running. Available endpoints:")
    gr.Markdown(
        "- `POST /api/v1/analyze/disease` — Leaf disease detection\n"
        "- `POST /api/v1/analyze/soil` — Soil classification\n"
        "- `POST /api/v1/recommend/crop` — Crop recommendation\n"
        "- `GET  /api/v1/health` — Health check\n"
        "- `GET  /docs` — Swagger UI"
    )

# Mount Gradio at ROOT so HF health check at /startup-events returns 200
# FastAPI /api/v1/* routes still work — they're on the same app instance
app = gr.mount_gradio_app(fastapi_app, demo, path="/")

# Run uvicorn — blocks forever, keeping the HF container alive
if __name__ == "__main__":
    port = int(os.getenv("PORT", "7860"))
    uvicorn.run(app, host="0.0.0.0", port=port)
