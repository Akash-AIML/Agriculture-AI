import sys
from pathlib import Path
import gradio as gr

# Add root and backend directory to sys.path
root_dir = Path(__file__).resolve().parent
backend_dir = root_dir / "backend"

for d in [str(root_dir), str(backend_dir)]:
    if d not in sys.path:
        sys.path.insert(0, d)

from main import app as fastapi_app

# Interactive dashboard & API landing page for Hugging Face Spaces
with gr.Blocks(title="Terra·AI — Agricultural Intelligence API") as demo:
    gr.Markdown("# 🌿 Terra·AI — Agricultural Intelligence API")
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
