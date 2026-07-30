// Base URL for the FastAPI backend. Set VITE_API_BASE_URL in .env for prod.
// Defaults to same-origin (works when backend is proxied via vite.config.ts / vercel.json rewrites).
export const API_BASE: string =
  (import.meta.env.VITE_API_BASE_URL as string | undefined) ?? "";

const url = (p: string) => `${API_BASE}${p}`;

export type DiseaseResult = {
  disease: string;
  scientific_name?: string;
  confidence: number;
  treatment?: string;
  urgency?: "low" | "moderate" | "high";
};

export type SoilResult = {
  soil_type: string;
  confidence: number;
  properties?: Record<string, string | number>;
};

export type CropInput = {
  N: number;
  P: number;
  K: number;
  temperature: number;
  humidity: number;
  ph: number;
  rainfall: number;
};

export type CropSuggestion = { crop: string; probability: number };

export async function analyzeDisease(
  file: File,
  lang: string,
): Promise<DiseaseResult> {
  const fd = new FormData();
  fd.append("file", file);
  fd.append("lang", lang);
  const r = await fetch(url(`/api/v1/analyze/disease`), {
    method: "POST",
    body: fd,
  });
  if (!r.ok) throw new Error(`HTTP ${r.status}`);
  const data = await r.json();
  const rawConf = data.confidence ?? 0;
  // Backend returns confidence as 0..100 (e.g. 98.45). UI components expect 0..1 scale.
  const confidence = rawConf > 1 ? rawConf / 100 : rawConf;
  const isHealthy = data.is_healthy ?? false;
  const treatmentsList = Array.isArray(data.treatments)
    ? data.treatments.join(". ")
    : data.treatment ?? "";
  const urgency: "low" | "moderate" | "high" = isHealthy
    ? "low"
    : confidence > 0.8
      ? "high"
      : "moderate";

  return {
    disease: data.disease ?? "Unknown",
    scientific_name: data.scientific_name,
    confidence,
    treatment: treatmentsList,
    urgency,
  };
}

export async function analyzeSoil(
  file: File,
  lang: string,
): Promise<SoilResult> {
  const fd = new FormData();
  fd.append("file", file);
  fd.append("lang", lang);
  const r = await fetch(url(`/api/v1/analyze/soil`), {
    method: "POST",
    body: fd,
  });
  if (!r.ok) throw new Error(`HTTP ${r.status}`);
  const data = await r.json();
  const rawConf = data.confidence ?? 0;
  // Backend returns confidence as 0..100 (e.g. 92.1). UI components expect 0..1 scale.
  const confidence = rawConf > 1 ? rawConf / 100 : rawConf;

  const properties: Record<string, string | number> = {};
  if (data.water_retention) properties["Water Retention"] = data.water_retention;
  if (data.drainage) properties["Drainage"] = data.drainage;
  if (data.fertility) properties["Fertility"] = data.fertility;
  if (Array.isArray(data.suitable_crops) && data.suitable_crops.length > 0) {
    properties["Suitable Crops"] = data.suitable_crops.join(", ");
  }
  if (Array.isArray(data.tips) && data.tips.length > 0) {
    properties["Tips"] = data.tips.join(". ");
  }
  if (data.properties && typeof data.properties === "object") {
    Object.assign(properties, data.properties);
  }

  return {
    soil_type: data.soil_type ?? "Unknown",
    confidence,
    properties,
  };
}

export async function recommendCrop(
  input: CropInput,
  lang: string,
): Promise<{ recommendations: CropSuggestion[] }> {
  const r = await fetch(url(`/api/v1/recommend/crop`), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ...input, language: lang }),
  });
  if (!r.ok) throw new Error(`HTTP ${r.status}`);
  const data = await r.json();
  const rawRecs = Array.isArray(data.recommendations) ? data.recommendations : [];
  const recommendations: CropSuggestion[] = rawRecs.map(
    (item: { crop?: string; probability?: number }) => {
      const rawProb = item.probability ?? 0;
      return {
        crop: item.crop ?? "Unknown",
        probability: rawProb > 1 ? rawProb / 100 : rawProb,
      };
    },
  );

  return { recommendations };
}

export async function streamAdvice(
  payload: {
    question?: string;
    disease?: DiseaseResult | null;
    soil?: SoilResult | null;
    crop?: CropSuggestion[] | null;
    lang: string;
  },
  onChunk: (chunk: string) => void,
  signal?: AbortSignal,
): Promise<void> {
  const body = {
    prompt: payload.question || undefined,
    disease_result: payload.disease || undefined,
    soil_result: payload.soil || undefined,
    crop_result:
      payload.crop && payload.crop.length > 0
        ? { recommendations: payload.crop }
        : undefined,
    language: payload.lang ?? "en",
    stream: true,
  };

  const r = await fetch(url(`/api/v1/advice`), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
    signal,
  });
  if (!r.ok || !r.body) throw new Error(`HTTP ${r.status}`);
  const reader = r.body.getReader();
  const decoder = new TextDecoder();
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    onChunk(decoder.decode(value, { stream: true }));
  }
}
