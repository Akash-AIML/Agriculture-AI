"""
Crop recommendation model wrapper (CatBoost + LabelEncoder).

Input features (7):  N, P, K, temperature, humidity, ph, rainfall
These match the standard Kaggle crop-recommendation dataset.
"""

import logging
import pickle
from pathlib import Path
from typing import Optional

import numpy as np

logger = logging.getLogger(__name__)

# Feature order must match training
FEATURE_NAMES = ["N", "P", "K", "temperature", "humidity", "ph", "rainfall"]

# Feature validation ranges (soft-warn, not hard-reject)
FEATURE_RANGES = {
    "N":           (0,   200),
    "P":           (0,   200),
    "K":           (0,   200),
    "temperature": (0,    50),
    "humidity":    (0,   100),
    "ph":          (0,    14),
    "rainfall":    (0,  3000),
}

# Human-readable growing tips per crop
CROP_TIPS: dict[str, str] = {
    "rice":         "Requires flooded or waterlogged soil. Plant in warm, humid conditions.",
    "maize":        "Needs well-drained loamy soil and moderate rainfall.",
    "chickpea":     "Thrives in cool, dry climates. Avoid waterlogging.",
    "kidneybeans":  "Prefers well-drained soil and moderate temperature.",
    "pigeonpeas":   "Drought-tolerant. Suitable for semi-arid regions.",
    "mothbeans":    "Very drought-resistant, ideal for arid zones.",
    "mungbean":     "Short-duration crop, tolerates heat and drought.",
    "blackgram":    "Grows well in warm, humid conditions with good drainage.",
    "lentil":       "Cool-season crop, tolerates frost, needs dry conditions at harvest.",
    "pomegranate":  "Drought-tolerant, prefers dry climate with hot summers.",
    "banana":       "Requires rich, well-drained soil and high humidity.",
    "mango":        "Thrives in tropical/subtropical climate with a dry season.",
    "grapes":       "Prefers well-drained, loamy-sandy soil with good sunlight.",
    "watermelon":   "Needs sandy loam, warm temperatures, and low humidity.",
    "muskmelon":    "Prefers warm, dry climate and well-drained sandy loam.",
    "apple":        "Requires cold winters for dormancy and well-drained loamy soil.",
    "orange":       "Subtropical fruit, requires warm temperatures and moderate rainfall.",
    "papaya":       "Grows in tropical climates, needs well-drained soil.",
    "coconut":      "Thrives near coastal areas with high humidity.",
    "cotton":       "Requires warm temperatures, moderate rainfall, and deep soil.",
    "jute":         "Needs warm, humid climate and alluvial or loamy soil.",
    "coffee":       "Prefers shaded, humid highlands with well-drained soil.",
}


class CropModel:
    def __init__(self, model_path: str, label_encoder_path: str):
        self.model_path         = Path(model_path)
        self.label_encoder_path = Path(label_encoder_path)
        self.model          = None
        self.label_encoder  = None

    def load(self):
        if not self.model_path.exists():
            raise FileNotFoundError(f"Crop model not found: {self.model_path}")
        if not self.label_encoder_path.exists():
            raise FileNotFoundError(f"Label encoder not found: {self.label_encoder_path}")

        logger.info("Loading crop model from %s …", self.model_path)
        with open(self.model_path, "rb") as f:
            self.model = pickle.load(f)

        logger.info("Loading label encoder from %s …", self.label_encoder_path)
        with open(self.label_encoder_path, "rb") as f:
            self.label_encoder = pickle.load(f)

        logger.info("Crop model ready. Classes: %s", list(self.label_encoder.classes_))

    def predict(self, n: float, p: float, k: float,
                temperature: float, humidity: float,
                ph: float, rainfall: float) -> dict:
        if self.model is None or self.label_encoder is None:
            raise RuntimeError("Crop model not loaded. Call load() first.")

        features = np.array([[n, p, k, temperature, humidity, ph, rainfall]], dtype=np.float32)

        # Warn on out-of-range values (don't reject — let model decide)
        warnings = []
        vals = dict(zip(FEATURE_NAMES, [n, p, k, temperature, humidity, ph, rainfall]))
        for feat, (lo, hi) in FEATURE_RANGES.items():
            v = vals[feat]
            if not (lo <= v <= hi):
                warnings.append(f"{feat}={v} is outside typical range [{lo}, {hi}]")

        # Predict
        pred_encoded = self.model.predict(features)
        pred_val     = int(np.asarray(pred_encoded).ravel()[0])
        crop_name    = self.label_encoder.inverse_transform([pred_val])[0]

        # Class probabilities if available
        recommendations = []
        if hasattr(self.model, "predict_proba"):
            proba = self.model.predict_proba(features)[0]
            top_n = min(5, len(proba))
            top_idx  = np.argsort(proba)[::-1][:top_n]
            top_prob = proba[top_idx]
            classes  = self.label_encoder.inverse_transform(top_idx)
            recommendations = [
                {"crop": c, "probability": round(float(p) * 100, 2)}
                for c, p in zip(classes, top_prob)
            ]
        else:
            recommendations = [{"crop": crop_name, "probability": 100.0}]

        return {
            "recommended_crop": crop_name,
            "tip":              CROP_TIPS.get(crop_name.lower(), "Consult your local agricultural extension officer."),
            "recommendations":  recommendations,
            "input_warnings":   warnings,
        }
