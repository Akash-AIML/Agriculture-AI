"""
Orchestrator: merges disease, soil, and crop model outputs
and applies confidence thresholds before sending to RAG + LLM.
"""

import logging
from typing import Optional

logger = logging.getLogger(__name__)

# ── Confidence thresholds ─────────────────────────────────────────────────────
DISEASE_THRESHOLD = 60.0   # below → flag as uncertain
SOIL_THRESHOLD    = 55.0
CROP_MIN_PROB     = 30.0   # only pass recommendations above this probability


class Orchestrator:
    """
    Combines partial or full model results into a single analysis dict
    that flows into the RAG + LLM pipeline.
    """

    def merge(
        self,
        disease_result: Optional[dict] = None,
        soil_result:    Optional[dict] = None,
        crop_result:    Optional[dict] = None,
    ) -> dict:
        """
        Returns a merged analysis dict with uncertainty flags.
        Any of the three inputs may be None (partial analysis).
        """
        merged: dict = {
            "disease":  None,
            "soil":     None,
            "crop":     None,
            "warnings": [],
            "summary":  "",
        }

        # ── Disease ───────────────────────────────────────────────────────────
        if disease_result:
            conf = disease_result.get("confidence", 0)
            uncertain = conf < DISEASE_THRESHOLD
            merged["disease"] = {
                **disease_result,
                "uncertain": uncertain,
            }
            if uncertain:
                merged["warnings"].append(
                    f"Disease detection confidence is low ({conf:.1f}%). "
                    "Consider uploading a clearer image."
                )

        # ── Soil ──────────────────────────────────────────────────────────────
        if soil_result:
            conf = soil_result.get("confidence", 0)
            uncertain = conf < SOIL_THRESHOLD
            merged["soil"] = {
                **soil_result,
                "uncertain": uncertain,
            }
            if uncertain:
                merged["warnings"].append(
                    f"Soil classification confidence is low ({conf:.1f}%). "
                    "Try a closer, well-lit image of bare soil."
                )

        # ── Crop ──────────────────────────────────────────────────────────────
        if crop_result:
            # Filter low-probability alternatives
            filtered_recs = [
                r for r in crop_result.get("recommendations", [])
                if r["probability"] >= CROP_MIN_PROB
            ]
            merged["crop"] = {
                **crop_result,
                "recommendations": filtered_recs or crop_result.get("recommendations", [])[:1],
            }
            if crop_result.get("input_warnings"):
                merged["warnings"].extend(crop_result["input_warnings"])

        merged["summary"] = self._build_summary(merged)
        return merged

    # ─────────────────────────────────────────────────────────────────────────

    @staticmethod
    def _build_summary(merged: dict) -> str:
        parts = []

        d = merged.get("disease")
        if d:
            if d.get("is_healthy"):
                parts.append("Plant appears healthy.")
            elif d.get("uncertain"):
                parts.append(f"Possible disease detected: {d['disease']} (low confidence).")
            else:
                parts.append(f"Disease detected: {d['disease']} ({d['confidence']:.1f}% confidence).")

        s = merged.get("soil")
        if s:
            parts.append(
                f"Soil type: {s['soil_type']} — "
                f"fertility {s.get('fertility', '?')}, "
                f"drainage {s.get('drainage', '?')}."
            )

        c = merged.get("crop")
        if c:
            top = c.get("recommended_crop", "")
            parts.append(f"Recommended crop: {top}.")

        return " ".join(parts) if parts else "No analysis data available."

    def build_llm_context(self, merged: dict, language: str = "en") -> str:
        """
        Formats the merged analysis into a structured string for the LLM prompt.
        """
        lines = ["=== Farm Analysis Report ===", merged["summary"], ""]

        d = merged.get("disease")
        if d:
            lines.append("## Disease Detection")
            lines.append(f"- Detected: {d['disease']}")
            lines.append(f"- Confidence: {d['confidence']:.1f}%")
            if d.get("uncertain"):
                lines.append("- Note: confidence below threshold — treat with caution")
            if d.get("treatments"):
                lines.append("- Suggested treatments: " + "; ".join(d["treatments"]))
            lines.append("")

        s = merged.get("soil")
        if s:
            lines.append("## Soil Analysis")
            lines.append(f"- Type: {s['soil_type']} ({s['confidence']:.1f}% confidence)")
            lines.append(f"- Water retention: {s.get('water_retention', '?')}")
            lines.append(f"- Drainage: {s.get('drainage', '?')}")
            lines.append(f"- Fertility: {s.get('fertility', '?')}")
            if s.get("suitable_crops"):
                lines.append("- Suitable crops: " + ", ".join(s["suitable_crops"]))
            if s.get("tips"):
                lines.append("- Soil management tips: " + "; ".join(s["tips"]))
            lines.append("")

        c = merged.get("crop")
        if c:
            lines.append("## Crop Recommendation")
            lines.append(f"- Top recommendation: {c['recommended_crop']}")
            if c.get("recommendations"):
                alts = [f"{r['crop']} ({r['probability']:.1f}%)" for r in c["recommendations"][:3]]
                lines.append("- Alternatives: " + ", ".join(alts))
            if c.get("tip"):
                lines.append(f"- Tip: {c['tip']}")
            lines.append("")

        if merged.get("warnings"):
            lines.append("## Warnings")
            for w in merged["warnings"]:
                lines.append(f"- {w}")

        lang_map = {
            "ta": "Tamil (தமிழ்)",
            "hi": "Hindi (हिन्दी)",
            "te": "Telugu (తెలుగు)",
            "en": "English",
        }
        lines.append(f"\n[Respond in {lang_map.get(language, 'English')}]")

        return "\n".join(lines)
