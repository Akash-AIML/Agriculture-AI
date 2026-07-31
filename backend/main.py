"""
AgroSense AI — FastAPI Backend
================================
Run:  uvicorn main:app --reload --host 0.0.0.0 --port 8000
Docs: http://localhost:8000/docs
"""

import logging
import os
from pathlib import Path

# Disable TensorFlow to prevent Keras 3 compatibility issues in transformers
os.environ["USE_TF"] = "0"
os.environ["USE_TORCH"] = "1"

from contextlib import asynccontextmanager
from typing import Optional, Annotated

from dotenv import load_dotenv
from fastapi import (
    FastAPI, UploadFile, File, Form, HTTPException, Depends, Request, status
)
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from fastapi.security import OAuth2PasswordRequestForm
from pydantic import BaseModel, Field
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded

load_dotenv(override=True)
logging.basicConfig(level=logging.INFO, format="%(levelname)s | %(name)s | %(message)s")
logger = logging.getLogger("agrosense")

# ── Lazy imports (keep startup fast even if some deps missing) ────────────────
try:
    from models.disease_model import DiseaseModel
    from models.soil_model import SoilModel
    from models.crop_model import CropModel
    from services.orchestrator import Orchestrator
    from services.rag_service import RAGService
    from services.llm_service import LLMService
    from utils.preprocessing import preprocess_image
    from utils.cache import cache
    from middleware.auth import get_current_user, create_token_response, TokenResponse, User
except ImportError:
    from backend.models.disease_model import DiseaseModel
    from backend.models.soil_model import SoilModel
    from backend.models.crop_model import CropModel
    from backend.services.orchestrator import Orchestrator
    from backend.services.rag_service import RAGService
    from backend.services.llm_service import LLMService
    from backend.utils.preprocessing import preprocess_image
    from backend.utils.cache import cache
    from backend.middleware.auth import get_current_user, create_token_response, TokenResponse, User


def safe_get_remote_address(request: Request) -> str:
    """Extract client IP safely across proxy and serverless environments."""
    if not request:
        return "127.0.0.1"
    x_forwarded_for = request.headers.get("x-forwarded-for")
    if x_forwarded_for:
        return x_forwarded_for.split(",")[0].strip()
    x_real_ip = request.headers.get("x-real-ip")
    if x_real_ip:
        return x_real_ip.strip()
    if getattr(request, "client", None) and getattr(request.client, "host", None):
        return request.client.host
    return "127.0.0.1"


# ── App-level singletons ──────────────────────────────────────────────────────
disease_model  : Optional[DiseaseModel] = None
soil_model     : Optional[SoilModel]    = None
crop_model_obj : Optional[CropModel]    = None
orchestrator   : Orchestrator           = Orchestrator()
rag_service    : Optional[RAGService]   = None
llm_service    : Optional[LLMService]   = None

RATE_LIMIT = os.getenv("RATE_LIMIT_PER_MINUTE", "30") + "/minute"


@asynccontextmanager
async def lifespan(app: FastAPI):
    global disease_model, soil_model, crop_model_obj, rag_service, llm_service

    # ── Cache ────────────────────────────────────────────────────────────────
    cache._redis_url = os.getenv("REDIS_URL")
    await cache.connect()

    base_dir = Path(__file__).parent
    disease_model = DiseaseModel(
        model_path  = os.getenv("DISEASE_MODEL_PATH") or str(base_dir / "models/disease_model_fp16.pth"),
        num_classes = int(os.getenv("DISEASE_NUM_CLASSES", "38")),
    )
    try:
        disease_model.load()
    except Exception as e:
        logger.error("Disease model load failed: %s", e)

    soil_model = SoilModel(
        model_path  = os.getenv("SOIL_MODEL_PATH") or str(base_dir / "models/soil_model.pth"),
        num_classes = int(os.getenv("SOIL_NUM_CLASSES", "4")),
    )
    try:
        soil_model.load()
    except Exception as e:
        logger.error("Soil model load failed: %s", e)

    crop_model_obj = CropModel(
        model_path          = os.getenv("CROP_MODEL_PATH") or str(base_dir / "models/crop_model.pkl"),
        label_encoder_path  = os.getenv("LABEL_ENCODER_PATH") or str(base_dir / "models/label_enoder_crop.pkl"),
    )
    try:
        crop_model_obj.load()
    except Exception as e:
        logger.error("Crop model load failed: %s", e)

    # ── RAG ──────────────────────────────────────────────────────────────────
    rag_service = RAGService(docs_dir=os.getenv("RAG_DOCS_DIR", "./rag_docs"))

    # ── LLM ──────────────────────────────────────────────────────────────────
    api_key = (os.getenv("OPENAI_API_KEY") or "").strip()
    base_url = (os.getenv("OPENAI_BASE_URL") or "").strip() or None
    if api_key and api_key != "your_openai_api_key_here":
        llm_service = LLMService(api_key=api_key, base_url=base_url)
        logger.info("LLM service initialized (base_url=%s).", base_url or "default")
    else:
        logger.warning("OPENAI_API_KEY not configured in backend/.env — LLM endpoints disabled.")

    logger.info("AgroSense AI startup complete.")
    yield

    await cache.close()
    logger.info("AgroSense AI shutdown complete.")


# ── FastAPI app ───────────────────────────────────────────────────────────────
limiter = Limiter(key_func=safe_get_remote_address, default_limits=[RATE_LIMIT])
app     = FastAPI(
    title       = "AgroSense AI API",
    description = "Multi-model agricultural AI: disease detection, soil analysis, crop recommendation, LLM advice.",
    version     = "1.0.0",
    lifespan    = lifespan,
)
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

cors_origins_env = os.getenv("CORS_ORIGINS", "*").strip()
if cors_origins_env == "*":
    app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],
        allow_credentials=False,
        allow_methods=["*"],
        allow_headers=["*"],
    )
else:
    origins = [o.strip() for o in cors_origins_env.split(",") if o.strip()]
    app.add_middleware(
        CORSMiddleware,
        allow_origins=origins,
        allow_origin_regex=r"https://.*\.vercel\.app",
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )


# ── Request / Response Schemas ────────────────────────────────────────────────
class CropInput(BaseModel):
    N: float = Field(..., ge=0, le=140, description="Nitrogen content (mg/kg)")
    P: float = Field(..., ge=0, le=145, description="Phosphorus content (mg/kg)")
    K: float = Field(..., ge=0, le=205, description="Potassium content (mg/kg)")
    temperature: float = Field(..., ge=8.0, le=45.0, description="Temperature in °C")
    humidity: float = Field(..., ge=14.0, le=100.0, description="Relative humidity %")
    ph: float = Field(..., ge=3.5, le=10.0, description="Soil pH level")
    rainfall: float = Field(..., ge=20.0, le=300.0, description="Rainfall in mm")


class AdviceRequest(BaseModel):
    question: Optional[str] = Field(None, description="Optional custom question from user")
    disease_result: Optional[dict] = Field(None, description="Output from /analyze/disease")
    soil_result: Optional[dict] = Field(None, description="Output from /analyze/soil")
    crop_result: Optional[dict] = Field(None, description="Output from /recommend/crop")
    language: str = Field("en", description="Response language: en | ta | hi | te")


class HealthResponse(BaseModel):
    status: str
    version: str
    models_loaded: dict[str, bool]
    redis_connected: bool


# ── Root Landing Page ─────────────────────────────────────────────────────────
from fastapi.responses import HTMLResponse

@app.get("/", response_class=HTMLResponse, include_in_schema=False)
async def root():
    return """
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Terra·AI — Agricultural Intelligence API</title>
        <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #0f172a; color: #f8fafc; margin: 0; padding: 2rem; display: flex; justify-content: center; align-items: center; min-height: 100vh; }
            .card { background: #1e293b; border: 1px solid #334155; border-radius: 12px; padding: 2rem; max-width: 600px; width: 100%; box-shadow: 0 10px 25px -5px rgba(0,0,0,0.5); }
            h1 { color: #4ade80; margin-top: 0; display: flex; align-items: center; gap: 0.5rem; }
            p { color: #94a3b8; line-height: 1.6; }
            .status { display: inline-flex; align-items: center; gap: 0.5rem; background: #166534; color: #4ade80; padding: 0.25rem 0.75rem; border-radius: 9999px; font-size: 0.875rem; font-weight: 600; margin-bottom: 1rem; }
            .status-dot { width: 8px; height: 8px; background: #4ade80; border-radius: 50%; display: inline-block; }
            ul { list-style: none; padding: 0; margin: 1.5rem 0; }
            li { padding: 0.75rem; background: #0f172a; border-radius: 8px; margin-bottom: 0.5rem; border: 1px solid #334155; }
            code { color: #38bdf8; font-family: monospace; font-size: 0.9em; }
            .btn { display: inline-block; background: #22c55e; color: #0f172a; font-weight: bold; text-decoration: none; padding: 0.75rem 1.5rem; border-radius: 8px; margin-top: 1rem; text-align: center; }
            .btn:hover { background: #16a34a; }
        </style>
    </head>
    <body>
        <div class="card">
            <div class="status"><span class="status-dot"></span> Backend Online & Operational</div>
            <h1>🌿 Terra·AI Agricultural Intelligence</h1>
            <p>Multi-Model Artificial Intelligence API powered by MobileNetV2 (Plant Disease), EfficientNet-B0 (Soil Analysis), and CatBoost (Crop Recommendation).</p>
            <h3>Available Endpoints:</h3>
            <ul>
                <li><code>POST /api/v1/analyze/disease</code> — Leaf disease diagnosis</li>
                <li><code>POST /api/v1/analyze/soil</code> — Soil type classification</li>
                <li><code>POST /api/v1/recommend/crop</code> — Crop recommendation</li>
                <li><code>GET  /api/v1/health</code> — Backend status check</li>
            </ul>
            <a href="/docs" class="btn">Explore & Test API (Swagger UI) →</a>
        </div>
    </body>
    </html>
    """


# ── Health check ──────────────────────────────────────────────────────────────
@app.get("/health", response_model=HealthResponse, tags=["system"])
@app.get("/api/v1/health", response_model=HealthResponse, tags=["system"])
async def health_check():
    return {
        "status": "healthy",
        "version": "1.0.0",
        "models_loaded": {
            "disease": disease_model is not None and getattr(disease_model, "model", None) is not None,
            "soil":    soil_model is not None and getattr(soil_model, "model", None) is not None,
            "crop":    crop_model_obj is not None and getattr(crop_model_obj, "model", None) is not None,
        },
        "redis_connected": cache._redis_url is not None and cache._backend is not None,
    }


# ── Auth ──────────────────────────────────────────────────────────────────────
@app.post("/api/v1/auth/token", response_model=TokenResponse, tags=["auth"])
async def login(form_data: Annotated[OAuth2PasswordRequestForm, Depends()]):
    return create_token_response(form_data)


# ── Disease detection ─────────────────────────────────────────────────────────
@app.post("/api/v1/analyze/disease", tags=["models"])
@limiter.limit(RATE_LIMIT)
async def analyze_disease(
    request : Request,
    file    : UploadFile = File(..., description="Plant leaf image"),
    lang    : Optional[str] = Form("en"),
):
    global disease_model
    if disease_model is None:
        base_dir = Path(__file__).parent
        disease_model = DiseaseModel(model_path=str(base_dir / "models/disease_model_fp16.pth"))
        disease_model.load()

    image_bytes = await file.read()
    if len(image_bytes) > 10 * 1024 * 1024:
        raise HTTPException(status_code=413, detail="File too large (max 10 MB).")

    try:
        tensor, cache_key = preprocess_image(image_bytes)
        logger.info(f"File Size: {len(image_bytes)} | Hash: {cache_key}")
    except ValueError as exc:
        raise HTTPException(status_code=422, detail=str(exc))
    except Exception as exc:
        logger.exception("Preprocessing failed")
        raise HTTPException(status_code=500, detail=f"Preprocessing error: {exc}")

    try:
        cached = await cache.get(f"disease:{cache_key}")
        if cached and isinstance(cached, dict):
            return {**cached, "cached": True}
    except Exception as e:
        logger.warning("Cache check skipped: %s", e)

    try:
        result = disease_model.predict(tensor)
    except Exception as exc:
        logger.exception("Disease inference failed")
        raise HTTPException(status_code=500, detail=f"Inference error: {exc}")

    try:
        await cache.set(f"disease:{cache_key}", result, ttl=3600)
    except Exception as e:
        logger.warning("Cache write skipped: %s", e)

    return {**result, "cached": False}


# ── Soil analysis ─────────────────────────────────────────────────────────────
@app.post("/api/v1/analyze/soil", tags=["models"])
@limiter.limit(RATE_LIMIT)
async def analyze_soil(
    request : Request,
    file    : UploadFile = File(..., description="Soil image"),
    lang    : Optional[str] = Form("en"),
):
    global soil_model
    if soil_model is None:
        base_dir = Path(__file__).parent
        soil_model = SoilModel(model_path=str(base_dir / "models/soil_model.pth"))
        soil_model.load()

    image_bytes = await file.read()
    if len(image_bytes) > 10 * 1024 * 1024:
        raise HTTPException(status_code=413, detail="File too large (max 10 MB).")

    try:
        tensor, cache_key = preprocess_image(image_bytes)
        logger.info(f"File Size: {len(image_bytes)} | Hash: {cache_key}")
    except ValueError as exc:
        raise HTTPException(status_code=422, detail=str(exc))
    except Exception as exc:
        logger.exception("Preprocessing failed")
        raise HTTPException(status_code=500, detail=f"Preprocessing error: {exc}")

    try:
        cached = await cache.get(f"soil:{cache_key}")
        if cached and isinstance(cached, dict):
            return {**cached, "cached": True}
    except Exception as e:
        logger.warning("Cache check skipped: %s", e)

    try:
        result = soil_model.predict(tensor)
    except Exception as exc:
        logger.exception("Soil inference failed")
        raise HTTPException(status_code=500, detail=f"Inference error: {exc}")

    try:
        await cache.set(f"soil:{cache_key}", result, ttl=3600)
    except Exception as e:
        logger.warning("Cache write skipped: %s", e)

    return {**result, "cached": False}


# ── Crop recommendation ───────────────────────────────────────────────────────
@app.post("/api/v1/recommend/crop", tags=["models"])
@limiter.limit(RATE_LIMIT)
async def recommend_crop(
    request : Request,
    data    : CropInput,
):
    global crop_model_obj
    if crop_model_obj is None:
        base_dir = Path(__file__).parent
        crop_model_obj = CropModel(
            model_path          = str(base_dir / "models/crop_model.pkl"),
            label_encoder_path  = str(base_dir / "models/label_enoder_crop.pkl"),
        )
        crop_model_obj.load()

    cache_key = f"crop:{data.N}:{data.P}:{data.K}:{data.temperature}:{data.humidity}:{data.ph}:{data.rainfall}"
    try:
        cached = await cache.get(cache_key)
        if cached and isinstance(cached, dict):
            return {**cached, "cached": True}
    except Exception as e:
        logger.warning("Cache check skipped: %s", e)

    try:
        recs = crop_model_obj.predict(
            n=data.N,
            p=data.P,
            k=data.K,
            temperature=data.temperature,
            humidity=data.humidity,
            ph=data.ph,
            rainfall=data.rainfall,
        )
    except Exception as exc:
        logger.exception("Crop recommendation failed")
        raise HTTPException(status_code=500, detail=f"Inference error: {exc}")

    result = recs
    try:
        await cache.set(cache_key, result, ttl=3600)
    except Exception as e:
        logger.warning("Cache write skipped: %s", e)

    return {**result, "cached": False}


# ── Advice (Streaming RAG + LLM) ──────────────────────────────────────────────
@app.post("/api/v1/advice", tags=["llm"])
@limiter.limit(RATE_LIMIT)
async def get_advice(
    request: Request,
    payload: AdviceRequest,
):
    if not llm_service:
        async def mock_stream():
            yield "data: [OPENAI_API_KEY is not configured in backend/.env. Demo mode active.]\n\n"
            yield "data: [DONE]\n\n"
        return StreamingResponse(mock_stream(), media_type="text/event-stream")

    try:
        generator = orchestrator.stream_advice(
            payload     = payload.dict(),
            rag_service = rag_service,
            llm_service = llm_service,
        )
        return StreamingResponse(generator, media_type="text/event-stream")
    except Exception as exc:
        logger.exception("Advice streaming failed")
        raise HTTPException(status_code=500, detail=f"Orchestrator error: {exc}")
