---
title: Agri AI
emoji: 🌿
colorFrom: green
colorTo: green
sdk: docker
app_port: 7860
pinned: false
---

# Agriculture-AI

[![Live Demo](https://img.shields.io/badge/Live%20Demo-agri.akashg.me-brightgreen?style=for-the-badge&logo=vercel)](https://agri.akashg.me/)

Multi-model agricultural AI: disease detection, soil analysis, crop recommendation, and LLM-powered advice — with full multilingual support (English, Tamil, Hindi, Telugu).

---

## Project Structure

```
agri-ai/
├── backend/
│   ├── main.py                    # FastAPI app (all routes)
│   ├── requirements.txt
│   ├── .env.example               # Copy to .env and configure
│   ├── models/
│   │   ├── disease_model.py       # Disease CNN wrapper
│   │   ├── soil_model.py          # Soil CNN wrapper
│   │   └── crop_model.py          # CatBoost crop wrapper
│   ├── services/
│   │   ├── orchestrator.py        # Merges model outputs + confidence thresholds
│   │   ├── rag_service.py         # FAISS RAG over your .txt knowledge base
│   │   └── llm_service.py         # Anthropic Claude streaming advice
│   ├── middleware/
│   │   └── auth.py                # JWT auth (disable by leaving JWT_SECRET_KEY empty)
│   ├── utils/
│   │   ├── preprocessing.py       # Image validation + transforms
│   │   └── cache.py               # Redis cache with in-memory fallback
│   └── rag_docs/                  # Drop .txt files here for RAG knowledge base
└── agriculture-ai-frontend/
    ├── index.html
    ├── vite.config.ts
    ├── package.json
    └── src/
        ├── routes/                 # TanStack Router routes
        ├── styles.css              # Styling
        ├── lib/
        │   ├── api.ts              # FastAPI integration & data mapping
        │   ├── agri-store.ts       # Global state management
        │   └── i18n.ts             # Translations
        └── components/agri/
            ├── DiseaseTab.tsx
            ├── SoilTab.tsx
            ├── CropTab.tsx
            ├── AdviceTab.tsx
            ├── ImageDrop.tsx
            └── ConfidenceBar.tsx
```

---

## Setup

### 1. Copy your trained models

```bash
# Paths are configured in backend/.env
# Default expects your models relative to backend/
ls ../dataset/agri_ai_dataset/models/
# crop_model.pkl  disease_model_fp16.pth  label_enoder_crop.pkl  soil_model.pth
```

### 2. Backend (Global Python Environment)

```bash
cd backend

# Install dependencies (using global Python environment)
pip install -r requirements.txt

# Configure environment
cp .env.example .env
# Edit .env:
#   - Set model paths
#   - Add your OPENAI_API_KEY / LLM keys
#   - Optionally set REDIS_URL, JWT_SECRET_KEY

# Start server
uvicorn main:app --reload --host 0.0.0.0 --port 8000

# API docs available at:
# http://localhost:8000/docs
```

### 3. Add RAG knowledge (optional but recommended)

```bash
mkdir -p backend/rag_docs

# Add any .txt files with agricultural knowledge:
# - crop disease treatment guides
# - soil management practices
# - regional crop calendars
# The RAG service auto-indexes them on first query.

# Example:
echo "Late blight in tomatoes is caused by Phytophthora infestans.
Apply metalaxyl + mancozeb fungicide at first sign of infection.
Destroy infected plant material immediately." > backend/rag_docs/tomato_diseases.txt
```

### 4. Frontend

```bash
cd agriculture-ai-frontend

npm install
npm run dev

# Opens at http://localhost:5173
# API calls proxy to http://localhost:8000 via vite.config.ts / VITE_API_BASE_URL
```

---

## Model configuration

Edit `backend/.env` to match your exact setup:

| Variable             | Default                                           | Description                        |
|----------------------|---------------------------------------------------|------------------------------------|
| `DISEASE_MODEL_PATH` | `../dataset/agri_ai_dataset/models/disease_model_fp16.pth` | Your disease CNN |
| `SOIL_MODEL_PATH`    | `../dataset/agri_ai_dataset/models/soil_model.pth`         | Your soil CNN    |
| `CROP_MODEL_PATH`    | `../dataset/agri_ai_dataset/models/crop_model.pkl`         | Your CatBoost    |
| `LABEL_ENCODER_PATH` | `../dataset/agri_ai_dataset/models/label_enoder_crop.pkl`  | Label encoder    |
| `DISEASE_NUM_CLASSES`| `38`                                              | CNN output classes                 |
| `SOIL_NUM_CLASSES`   | `4`                                               | CNN output classes                 |

**If your model architecture differs from ResNet-50 (disease) / ResNet-18 (soil)**, edit the `_build_resnet50` / `_build_resnet18` functions in the respective model files to match your architecture exactly.

---

## API Endpoints

| Method | Endpoint                  | Description                               |
|--------|---------------------------|-------------------------------------------|
| GET    | `/api/v1/health`          | Check all model + service status          |
| POST   | `/api/v1/analyze/disease` | Upload plant leaf image → disease result  |
| POST   | `/api/v1/analyze/soil`    | Upload soil image → soil classification   |
| POST   | `/api/v1/analyze/full`    | Upload both images together               |
| POST   | `/api/v1/recommend/crop`  | Send N/P/K + climate → crop recommendation|
| POST   | `/api/v1/advice`          | Get streaming LLM advice from all results |
| POST   | `/api/v1/auth/token`      | Get JWT token (username/password)         |

---

## Customization

### Add crop disease labels
Edit `DISEASE_CLASSES` list and `TREATMENTS` dict in `backend/models/disease_model.py`.

### Add soil types
Edit `SOIL_CLASSES` and `SOIL_PROPERTIES` in `backend/models/soil_model.py`.

### Add a language
1. Add entry to `LANGUAGES` array in `frontend/src/i18n/translations.js`
2. Add full translation object under your new language code
3. Add to `lang` validation regex in `backend/main.py` (`pattern="^(en|ta|hi|te|xx)$"`)

### Change LLM behavior
Edit `SYSTEM_PROMPT` in `backend/services/llm_service.py`.

### Adjust confidence thresholds
Edit `DISEASE_THRESHOLD`, `SOIL_THRESHOLD`, `CROP_MIN_PROB` in `backend/services/orchestrator.py`.

---

## Production deployment

```bash
# Backend — use gunicorn + uvicorn workers
pip install gunicorn
gunicorn main:app -w 2 -k uvicorn.workers.UvicornWorker --bind 0.0.0.0:8000

# Frontend — build static files
cd frontend && npm run build
# Serve dist/ with nginx or any static host

# Redis — strongly recommended in production
docker run -d -p 6379:6379 redis:alpine
# Set REDIS_URL=redis://localhost:6379 in .env

# Set a real JWT_SECRET_KEY
export JWT_SECRET_KEY=$(openssl rand -hex 32)
```
