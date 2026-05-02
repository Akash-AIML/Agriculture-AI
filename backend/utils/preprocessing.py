"""Image preprocessing pipeline for disease and soil CNN models."""

import io
import hashlib
from PIL import Image
import numpy as np
import torch
from torchvision import transforms

inference_transform = transforms.Compose([
    transforms.Resize((224, 224)),
    transforms.ToTensor(),
])


def preprocess_image(image_bytes: bytes) -> tuple[torch.Tensor, str]:
    """
    Validate, preprocess and return a (1, 3, 224, 224) float32 tensor
    plus a deterministic cache key (SHA-256 of raw bytes).
    Raises ValueError for invalid / non-image data.
    """
    # --- validate ---
    try:
        img = Image.open(io.BytesIO(image_bytes))
        img.verify()            # catches truncated files
        img = Image.open(io.BytesIO(image_bytes))  # reopen after verify
    except Exception as exc:
        raise ValueError(f"Invalid image file: {exc}") from exc

    # --- convert to RGB (handles RGBA, palette, grayscale) ---
    img = img.convert("RGB")

    # --- reject suspiciously small images ---
    w, h = img.size
    if w < 64 or h < 64:
        raise ValueError(f"Image too small ({w}×{h}). Minimum 64×64 px required.")

    # --- transform ---
    tensor = inference_transform(img).unsqueeze(0)  # (1, 3, 224, 224)

    # --- cache key ---
    cache_key = hashlib.sha256(image_bytes).hexdigest()

    return tensor, cache_key


def bytes_to_pil(image_bytes: bytes) -> Image.Image:
    """Return a PIL Image from raw bytes, converted to RGB."""
    return Image.open(io.BytesIO(image_bytes)).convert("RGB")
