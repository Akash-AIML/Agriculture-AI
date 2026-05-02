"""
Soil classification model wrapper.

Classifies soil images into standard types.
Edit SOIL_CLASSES to match your training labels exactly.
"""

import logging
from pathlib import Path
from typing import Optional

import torch
import torch.nn as nn
import torchvision.models as tv_models

logger = logging.getLogger(__name__)

# ── Soil type labels — edit to match your training set ───────────────────────
SOIL_CLASSES = ["Alluvial soil", "Black Soil", "Clay soil", "Red soil"]

SOIL_PROPERTIES: dict[str, dict] = {
    "Alluvial soil": {
        "water_retention": "High",
        "drainage":        "Good",
        "fertility":       "Very High",
        "suitable_crops":  ["Wheat", "Rice", "Sugarcane", "Cotton"],
        "tips":            ["Ideal for most crops", "Maintain organic matter"],
    },
    "Black Soil": {
        "water_retention": "Very High",
        "drainage":        "Poor",
        "fertility":       "High",
        "suitable_crops":  ["Cotton", "Soybean", "Millets", "Tobacco"],
        "tips":            ["Avoid overwatering", "Proper drainage is essential"],
    },
    "Clay soil": {
        "water_retention": "High",
        "drainage":        "Poor",
        "fertility":       "High",
        "suitable_crops":  ["Paddy", "Wheat", "Gram"],
        "tips":            ["Add organic matter to improve drainage", "Avoid working when wet"],
    },
    "Red soil": {
        "water_retention": "Low",
        "drainage":        "Good",
        "fertility":       "Medium",
        "suitable_crops":  ["Groundnut", "Millets", "Pulses", "Tobacco"],
        "tips":            ["Add lime to correct acidity", "Organic mulching retains moisture"],
    },
}


def _build_efficientnet_b0(num_classes: int) -> nn.Module:
    model = tv_models.efficientnet_b0(weights=None)
    model.classifier[1] = nn.Linear(model.classifier[1].in_features, num_classes)
    return model


class SoilModel:
    def __init__(self, model_path: str, num_classes: int = 4):
        self.model_path = Path(model_path)
        self.num_classes = num_classes
        self.model: Optional[nn.Module] = None
        self.device = torch.device("cpu")

    def load(self):
        if not self.model_path.exists():
            raise FileNotFoundError(f"Soil model not found: {self.model_path}")

        logger.info("Loading soil model from %s …", self.model_path)

        try:
            obj = torch.load(self.model_path, map_location="cpu", weights_only=False)
            if isinstance(obj, nn.Module):
                self.model = obj.float().eval()
                logger.info("Soil model loaded as full Module.")
                self._finalize()
                return
            state_dict = obj
        except Exception:
            try:
                state_dict = torch.load(self.model_path, map_location="cpu", weights_only=True)
            except Exception as exc:
                raise RuntimeError(f"Cannot load soil model: {exc}") from exc

        net = _build_efficientnet_b0(self.num_classes)
        clean_state_dict = {}
        for k, v in state_dict.items():
            new_k = k.replace("module.", "") if k.startswith("module.") else k
            clean_state_dict[new_k] = v.float()
            
        missing, unexpected = net.load_state_dict(clean_state_dict, strict=False)
        if missing:
            logger.warning("Soil model — missing keys: %s", missing[:5])
        self.model = net
        self._finalize()
        logger.info("Soil model loaded via state_dict (EfficientNet-B0 backbone).")

    def _finalize(self):
        self.model = self.model.float().to(self.device).eval()

    @torch.no_grad()
    def predict(self, tensor: "torch.Tensor") -> dict:
        if self.model is None:
            raise RuntimeError("Soil model not loaded. Call load() first.")

        logits = self.model(tensor.to(self.device))
        probs  = torch.softmax(logits, dim=1)[0]
        top_prob, top_idx = torch.max(probs, dim=0)

        soil_name = SOIL_CLASSES[top_idx.item()] if top_idx.item() < len(SOIL_CLASSES) else f"class_{top_idx.item()}"
        confidence = round(float(top_prob) * 100, 2)
        props = SOIL_PROPERTIES.get(soil_name, {})

        all_probs = [
            {"label": SOIL_CLASSES[i] if i < len(SOIL_CLASSES) else f"class_{i}", "confidence": round(float(p) * 100, 2)}
            for i, p in enumerate(probs.tolist())
        ]

        return {
            "soil_type":       soil_name,
            "confidence":      confidence,
            "water_retention": props.get("water_retention", "Unknown"),
            "drainage":        props.get("drainage", "Unknown"),
            "fertility":       props.get("fertility", "Unknown"),
            "suitable_crops":  props.get("suitable_crops", []),
            "tips":            props.get("tips", []),
            "all_classes":     all_probs,
        }
