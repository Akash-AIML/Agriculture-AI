"""
Disease detection model wrapper.

Your disease_model_fp16.pth is loaded and cast to float32 for CPU inference.
The class list below matches the 38-class PlantVillage dataset — edit
DISEASE_CLASSES if your training used different labels.
"""

import logging
from pathlib import Path
from typing import Optional

import torch
import torch.nn as nn
import torchvision.models as tv_models

logger = logging.getLogger(__name__)

# ── PlantVillage 38-class labels ─────────────────────────────────────────────
DISEASE_CLASSES = [
    "Apple___Apple_scab", "Apple___Black_rot", "Apple___Cedar_apple_rust",
    "Apple___healthy", "Blueberry___healthy", "Cherry___Powdery_mildew",
    "Cherry___healthy", "Corn___Cercospora_leaf_spot",
    "Corn___Common_rust", "Corn___Northern_Leaf_Blight", "Corn___healthy",
    "Grape___Black_rot", "Grape___Esca_(Black_Measles)",
    "Grape___Leaf_blight_(Isariopsis_Leaf_Spot)", "Grape___healthy",
    "Orange___Haunglongbing_(Citrus_greening)",
    "Peach___Bacterial_spot", "Peach___healthy",
    "Pepper,_bell___Bacterial_spot", "Pepper,_bell___healthy",
    "Potato___Early_blight", "Potato___Late_blight", "Potato___healthy",
    "Raspberry___healthy", "Soybean___healthy",
    "Squash___Powdery_mildew", "Strawberry___Leaf_scorch",
    "Strawberry___healthy", "Tomato___Bacterial_spot",
    "Tomato___Early_blight", "Tomato___Late_blight",
    "Tomato___Leaf_Mold", "Tomato___Septoria_leaf_spot",
    "Tomato___Spider_mites Two-spotted_spider_mite",
    "Tomato___Target_Spot", "Tomato___Tomato_Yellow_Leaf_Curl_Virus",
    "Tomato___Tomato_mosaic_virus", "Tomato___healthy",
]

# Treatments indexed by class name (extend as needed)
TREATMENTS: dict[str, list[str]] = {
    "Tomato___Early_blight":   ["Apply copper-based fungicide", "Remove infected leaves", "Improve air circulation"],
    "Tomato___Late_blight":    ["Use mancozeb fungicide", "Avoid overhead watering", "Destroy infected plants"],
    "Potato___Early_blight":   ["Chlorothalonil spray", "Crop rotation", "Use certified seed"],
    "Potato___Late_blight":    ["Metalaxyl + mancozeb", "Destroy crop debris", "Plant resistant varieties"],
    "Corn___Common_rust":      ["Propiconazole fungicide", "Plant resistant hybrids"],
    "Grape___Black_rot":       ["Mancozeb at bud break", "Remove mummified berries"],
    "Apple___Apple_scab":      ["Captan or myclobutanil spray", "Rake fallen leaves"],
    "Apple___Black_rot":       ["Prune infected wood", "Apply fungicide at petal fall"],
}


def _build_mobilenet_v2(num_classes: int) -> nn.Module:
    model = tv_models.mobilenet_v2(weights=None)
    model.classifier[1] = nn.Linear(model.last_channel, num_classes)
    return model


class DiseaseModel:
    def __init__(self, model_path: str, num_classes: int = 38):
        self.model_path = Path(model_path)
        self.num_classes = num_classes
        self.model: Optional[nn.Module] = None
        self.device = torch.device("cpu")

    def load(self):
        if not self.model_path.exists():
            raise FileNotFoundError(f"Disease model not found: {self.model_path}")

        logger.info("Loading disease model from %s …", self.model_path)

        # Strategy 1 — full model pickle
        try:
            obj = torch.load(self.model_path, map_location="cpu", weights_only=False)
            if isinstance(obj, nn.Module):
                self.model = obj
                logger.info("Disease model loaded as full Module.")
                self._finalize()
                return
            # It's a state_dict
            state_dict = obj
        except Exception:
            # Strategy 2 — weights_only (safer, newer torch)
            try:
                state_dict = torch.load(self.model_path, map_location="cpu", weights_only=True)
            except Exception as exc:
                raise RuntimeError(f"Cannot load disease model: {exc}") from exc

        net = _build_mobilenet_v2(self.num_classes)
        # Strip fp16 → fp32 and remove DataParallel 'module.' prefix if present
        clean_state_dict = {}
        for k, v in state_dict.items():
            new_k = k.replace("module.", "") if k.startswith("module.") else k
            clean_state_dict[new_k] = v.float()
            
        missing, unexpected = net.load_state_dict(clean_state_dict, strict=False)
        if missing:
            logger.warning("Disease model — missing keys: %s", missing[:5])
        self.model = net
        self._finalize()
        logger.info("Disease model loaded via state_dict (MobileNetV2 backbone).")

    def _finalize(self):
        self.model = self.model.float().to(self.device).eval()

    @torch.no_grad()
    def predict(self, tensor: "torch.Tensor") -> dict:
        """
        tensor: (1, 3, 224, 224) float32
        Returns dict with top-3 predictions.
        """
        if self.model is None:
            raise RuntimeError("Disease model not loaded. Call load() first.")

        logits = self.model(tensor.to(self.device))          # (1, C)
        probs  = torch.softmax(logits, dim=1)[0]             # (C,)
        top3_prob, top3_idx = torch.topk(probs, k=min(3, self.num_classes))

        top_idx  = top3_idx[0].item()
        top_name = DISEASE_CLASSES[top3_idx[0]] if top3_idx[0] < len(DISEASE_CLASSES) else f"class_{top3_idx[0]}"
        top_conf = round(float(top3_prob[0]) * 100, 2)

        is_healthy = "healthy" in top_name.lower()

        return {
            "disease":     top_name.replace("___", " — ").replace("_", " "),
            "confidence":  top_conf,
            "is_healthy":  is_healthy,
            "treatments":  [] if is_healthy else TREATMENTS.get(DISEASE_CLASSES[top3_idx[0]], ["Consult local agronomist"]),
            "top3": [
                {
                    "label":      (DISEASE_CLASSES[i] if i < len(DISEASE_CLASSES) else f"class_{i}").replace("___", " — ").replace("_", " "),
                    "confidence": round(float(p) * 100, 2),
                }
                for p, i in zip(top3_prob.tolist(), top3_idx.tolist())
            ],
        }
