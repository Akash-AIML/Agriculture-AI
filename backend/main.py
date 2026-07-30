"""
AgroSense AI — FastAPI Backend
================================
Run:  uvicorn main:app --reload --host 0.0.0.0 --port 8000
Docs: http://localhost:8000/docs
"""

import logging
import os

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
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded

load_dotenv(override=True)
logging.basicConfig(level=logging.INFO, format="%(levelname)s | %(name)s | %(message)s")
logger = logging.getLogger("agrosense")

# ── Lazy imports (keep startup fast even if some deps missing) ────────────────
from models.disease_model import DiseaseModel
from models.soil_model     import SoilModel
from models.crop_model     import CropModel
from services.orchestrator import Orchestrator
from services.rag_service  import RAGService
from services.llm_service  import LLMService
from utils.preprocessing   import preprocess_image
from utils.cache           import cache
from middleware.auth       import get_current_user, create_token_response, TokenResponse, User

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
        disease_model = None

    soil_model = SoilModel(
        model_path  = os.getenv("SOIL_MODEL_PATH") or str(base_dir / "models/soil_model.pth"),
        num_classes = int(os.getenv("SOIL_NUM_CLASSES", "4")),
    )
    try:
        soil_model.load()
    except Exception as e:
        logger.error("Soil model load failed: %s", e)
        soil_model = None

    crop_model_obj = CropModel(
        model_path          = os.getenv("CROP_MODEL_PATH") or str(base_dir / "models/crop_model.pkl"),
        label_encoder_path  = os.getenv("LABEL_ENCODER_PATH") or str(base_dir / "models/label_enoder_crop.pkl"),
    )
    try:
        crop_model_obj.load()
    except Exception as e:
        logger.error("Crop model load failed: %s", e)
        crop_model_obj = None

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
limiter = Limiter(key_func=get_remote_address, default_limits=[RATE_LIMIT])
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


# ── Schemas ───────────────────────────────────────────────────────────────────
class CropInput(BaseModel):
    N:           float = Field(..., ge=0, le=200, description="Nitrogen (kg/ha)")
    P:           float = Field(..., ge=0, le=200, description="Phosphorus (kg/ha)")
    K:           float = Field(..., ge=0, le=200, description="Potassium (kg/ha)")
    temperature: float = Field(..., ge=0, le=50,  description="°C")
    humidity:    float = Field(..., ge=0, le=100, description="%")
    ph:          float = Field(..., ge=0, le=14,  description="Soil pH")
    rainfall:    float = Field(..., ge=0, le=3000,description="mm per year")
    language:    str   = Field("en", pattern="^(en|ta|hi|te)$")


class AdviceRequest(BaseModel):
    disease_result: Optional[dict] = None
    soil_result:    Optional[dict] = None
    crop_result:    Optional[dict] = None
    language:       str = Field("en", pattern="^(en|ta|hi|te)$")
    stream:         bool = False
    prompt:         Optional[str] = None


# ── Health ────────────────────────────────────────────────────────────────────
@app.get("/api/v1/health", tags=["meta"])
async def health():
    return {
        "status": "ok",
        "models": {
            "disease": disease_model  is not None,
            "soil":    soil_model     is not None,
            "crop":    crop_model_obj is not None,
        },
        "llm_ready": llm_service is not None,
        "rag_ready": rag_service  is not None,
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
    if not disease_model:
        raise HTTPException(status_code=503, detail="Disease model not loaded.")

    image_bytes = await file.read()
    if len(image_bytes) > 10 * 1024 * 1024:
        raise HTTPException(status_code=413, detail="File too large (max 10 MB).")

    try:
        tensor, cache_key = preprocess_image(image_bytes)
        logger.info(f"File Size: {len(image_bytes)} | Hash: {cache_key}")
    except ValueError as exc:
        raise HTTPException(status_code=422, detail=str(exc))

    # Cache check
    cached = await cache.get(f"disease:{cache_key}")
    if cached:
        return {**cached, "cached": True}

    try:
        result = disease_model.predict(tensor)
    except Exception as exc:
        logger.exception("Disease inference failed")
        raise HTTPException(status_code=500, detail=f"Inference error: {exc}")

    await cache.set(f"disease:{cache_key}", result, ttl=3600)
    return {**result, "cached": False}


# ── Soil analysis ─────────────────────────────────────────────────────────────
@app.post("/api/v1/analyze/soil", tags=["models"])
@limiter.limit(RATE_LIMIT)
async def analyze_soil(
    request : Request,
    file    : UploadFile = File(..., description="Soil image"),
    lang    : Optional[str] = Form("en"),
):
    if not soil_model:
        raise HTTPException(status_code=503, detail="Soil model not loaded.")

    image_bytes = await file.read()
    if len(image_bytes) > 10 * 1024 * 1024:
        raise HTTPException(status_code=413, detail="File too large (max 10 MB).")

    try:
        tensor, cache_key = preprocess_image(image_bytes)
        logger.info(f"File Size: {len(image_bytes)} | Hash: {cache_key}")
    except ValueError as exc:
        raise HTTPException(status_code=422, detail=str(exc))

    # Cache check
    cached = await cache.get(f"soil:{cache_key}")
    if cached:
        return {**cached, "cached": True}

    try:
        result = soil_model.predict(tensor)
    except Exception as exc:
        logger.exception("Soil inference failed")
        raise HTTPException(status_code=500, detail=f"Inference error: {exc}")

    await cache.set(f"soil:{cache_key}", result, ttl=3600)
    return {**result, "cached": False}


# ── Crop recommendation ───────────────────────────────────────────────────────
@app.post("/api/v1/recommend/crop", tags=["models"])
@limiter.limit(RATE_LIMIT)
async def recommend_crop(
    request : Request,
    data    : CropInput,
):
    if not crop_model_obj:
        raise HTTPException(status_code=503, detail="Crop model not loaded.")

    cache_key = f"crop:{data.N}:{data.P}:{data.K}:{data.temperature}:{data.humidity}:{data.ph}:{data.rainfall}"
    # Cache check
    cached = await cache.get(cache_key)
    if cached:
        return {**cached, "cached": True}

    try:
        result = crop_model_obj.predict(
            data.N, data.P, data.K,
            data.temperature, data.humidity, data.ph, data.rainfall,
        )
    except Exception as exc:
        logger.exception("Crop inference failed")
        raise HTTPException(status_code=500, detail=f"Inference error: {exc}")

    await cache.set(cache_key, result, ttl=600)
    return {**result, "cached": False}


# ── Full analysis (disease + soil together) ───────────────────────────────────
@app.post("/api/v1/analyze/full", tags=["models"])
@limiter.limit(RATE_LIMIT)
async def full_analysis(
    request      : Request,
    disease_image: Optional[UploadFile] = File(None),
    soil_image   : Optional[UploadFile] = File(None),
):
    disease_result = soil_result = None

    if disease_image:
        img_bytes = await disease_image.read()
        try:
            tensor, _ = preprocess_image(img_bytes)
            if disease_model:
                disease_result = disease_model.predict(tensor)
        except (ValueError, Exception) as e:
            logger.warning("Disease inference skipped: %s", e)

    if soil_image:
        img_bytes = await soil_image.read()
        try:
            tensor, _ = preprocess_image(img_bytes)
            if soil_model:
                soil_result = soil_model.predict(tensor)
        except (ValueError, Exception) as e:
            logger.warning("Soil inference skipped: %s", e)

    merged = orchestrator.merge(disease_result, soil_result)
    return merged


# ── LLM Advice ────────────────────────────────────────────────────────────────
@app.post("/api/v1/advice", tags=["llm"])
@limiter.limit("10/minute")
async def get_advice(
    request : Request,
    body    : AdviceRequest,
):
    if not llm_service:
        raise HTTPException(status_code=503, detail="LLM service not configured (missing OPENAI_API_KEY).")

    merged   = orchestrator.merge(body.disease_result, body.soil_result, body.crop_result)
    context  = orchestrator.build_llm_context(merged, language=body.language)
    passages = rag_service.retrieve(merged["summary"]) if rag_service else ""

    if body.stream:
        async def _stream():
            async for chunk in llm_service.stream(context, passages, body.prompt):
                yield chunk
        return StreamingResponse(_stream(), media_type="text/plain")
    else:
        text = await llm_service.invoke(context, passages, body.prompt)
        return {"advice": text}

    advice = llm_service.generate(context, passages)
    return {"advice": advice, "language": body.language, "summary": merged["summary"]}
