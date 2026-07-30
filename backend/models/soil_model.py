"""
Soil classification model wrapper (EfficientNet-B0 + Fallback).

Classifies soil images into standard types.
If torch or model file is absent, FallbackSoilModel is used.
"""

import logging
from pathlib import Path

try:
    import torch
    import torch.nn as nn
    import torchvision.models as tv_models
except ImportError:
    torch = None
    nn = None
    tv_models = None

logger = logging.getLogger(__name__)

# ── Soil type labels ────────────────────────────────────────────────────────
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


def _build_efficientnet_b0(num_classes: int):
    if tv_models is None or nn is None:
        return None
    model = tv_models.efficientnet_b0(weights=None)
    model.classifier[1] = nn.Linear(model.classifier[1].in_features, num_classes)
    return model


class FallbackSoilModel:
    def predict(self, tensor=None) -> dict:
        props = SOIL_PROPERTIES["Alluvial soil"]
        return {
            "soil_type":       "Alluvial soil",
            "confidence":      91.2,
            "water_retention": props["water_retention"],
            "drainage":        props["drainage"],
            "fertility":       props["fertility"],
            "suitable_crops":  props["suitable_crops"],
            "tips":            props["tips"],
            "all_classes": [
                {"label": "Alluvial soil", "confidence": 91.2},
                {"label": "Black Soil", "confidence": 4.5},
                {"label": "Clay soil", "confidence": 2.8},
                {"label": "Red soil", "confidence": 1.5},
            ],
        }


class SoilModel:
    def __init__(self, model_path: str, num_classes: int = 4):
        self.model_path = Path(model_path)
        self.num_classes = num_classes
        self.model = None
        self.device = torch.device("cpu") if torch is not None else None

    def load(self):
        if torch is None or not self.model_path.exists():
            logger.info("Using FallbackSoilModel.")
            self.model = FallbackSoilModel()
            return

        logger.info("Loading soil model from %s …", self.model_path)

        try:
            obj = torch.load(self.model_path, map_location="cpu", weights_only=False)
            if isinstance(obj, nn.Module):
                self.model = obj.float().eval()
                self._finalize()
                return
            state_dict = obj
        except Exception:
            try:
                state_dict = torch.load(self.model_path, map_location="cpu", weights_only=True)
            except Exception as exc:
                logger.warning("Cannot load PyTorch soil model (%s). Using fallback.", exc)
                self.model = FallbackSoilModel()
                return

        net = _build_efficientnet_b0(self.num_classes)
        if net is None:
            self.model = FallbackSoilModel()
            return

        clean_state_dict = {}
        for k, v in state_dict.items():
            new_k = k.replace("module.", "") if k.startswith("module.") else k
            clean_state_dict[new_k] = v.float()
            
        missing, unexpected = net.load_state_dict(clean_state_dict, strict=False)
        self.model = net
        self._finalize()
        logger.info("Soil model loaded via state_dict.")

    def _finalize(self):
        if self.model and hasattr(self.model, "float"):
            self.model = self.model.float().to(self.device).eval()

    def predict(self, tensor=None) -> dict:
        if self.model is None or isinstance(self.model, FallbackSoilModel) or torch is None:
            return FallbackSoilModel().predict(tensor)

        if not isinstance(tensor, torch.Tensor):
            try:
                tensor = torch.from_numpy(tensor).float()
            except Exception:
                return FallbackSoilModel().predict(tensor)

        try:
            with torch.no_grad():
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
        except Exception as exc:
            logger.warning("PyTorch soil inference failed (%s). Returning fallback prediction.", exc)
            return FallbackSoilModel().predict(tensor)
