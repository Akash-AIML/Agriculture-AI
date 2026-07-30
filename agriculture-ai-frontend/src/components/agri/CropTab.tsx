import { useState } from "react";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { SectionHeader, TabWrapper } from "./Shell";
import { useAgri } from "@/lib/agri-store";
import { TRANSLATIONS } from "@/lib/i18n";
import { recommendCrop, type CropInput } from "@/lib/api";

export function CropTab() {
  const { lang, crops, setCrops } = useAgri();
  const t = TRANSLATIONS[lang]?.crop ?? TRANSLATIONS.en.crop;

  const [n, setN] = useState(42);
  const [p, setP] = useState(50);
  const [k, setK] = useState(43);
  const [temperature, setTemperature] = useState(26);
  const [humidity, setHumidity] = useState(70);
  const [ph, setPh] = useState(6.5);
  const [rainfall, setRainfall] = useState(120);

  const [loading, setLoading] = useState(false);

  const submit = async () => {
    setLoading(true);
    try {
      const payload: CropInput = {
        N: Number(n) || 0,
        P: Number(p) || 0,
        K: Number(k) || 0,
        temperature: Number(temperature) || 0,
        humidity: Number(humidity) || 0,
        ph: Number(ph) || 0,
        rainfall: Number(rainfall) || 0,
      };
      const res = await recommendCrop(payload, lang);
      setCrops(res.recommendations);
    } catch (e) {
      console.error(e);
      toast.error(t.error);
    } finally {
      setLoading(false);
    }
  };

  const safeCrops = Array.isArray(crops) ? crops : [];

  return (
    <TabWrapper>
      <SectionHeader title={t.title} subtitle={t.subtitle} />

      <div className="rounded-3xl border border-border bg-sage-soft/40 p-5 sm:p-8">
        <div className="grid gap-10 md:grid-cols-2">
          {/* Form */}
          <div className="space-y-6">
            <div className="grid grid-cols-3 gap-3 sm:gap-4">
              <div>
                <label className="mb-2 block text-[10px] font-bold uppercase tracking-widest opacity-50">
                  {t.n}
                </label>
                <input
                  type="number"
                  value={n}
                  onChange={(e) => setN(parseFloat(e.target.value) || 0)}
                  className="w-full rounded-xl border border-border bg-card px-3 py-2.5 font-mono text-sm outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>

              <div>
                <label className="mb-2 block text-[10px] font-bold uppercase tracking-widest opacity-50">
                  {t.p}
                </label>
                <input
                  type="number"
                  value={p}
                  onChange={(e) => setP(parseFloat(e.target.value) || 0)}
                  className="w-full rounded-xl border border-border bg-card px-3 py-2.5 font-mono text-sm outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>

              <div>
                <label className="mb-2 block text-[10px] font-bold uppercase tracking-widest opacity-50">
                  {t.k}
                </label>
                <input
                  type="number"
                  value={k}
                  onChange={(e) => setK(parseFloat(e.target.value) || 0)}
                  className="w-full rounded-xl border border-border bg-card px-3 py-2.5 font-mono text-sm outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 sm:gap-4">
              <div>
                <label className="mb-2 block text-[10px] font-bold uppercase tracking-widest opacity-50">
                  {t.temperature}
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={temperature}
                  onChange={(e) => setTemperature(parseFloat(e.target.value) || 0)}
                  className="w-full rounded-xl border border-border bg-card px-3 py-2.5 font-mono text-sm outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>

              <div>
                <label className="mb-2 block text-[10px] font-bold uppercase tracking-widest opacity-50">
                  {t.humidity}
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={humidity}
                  onChange={(e) => setHumidity(parseFloat(e.target.value) || 0)}
                  className="w-full rounded-xl border border-border bg-card px-3 py-2.5 font-mono text-sm outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>

              <div>
                <label className="mb-2 block text-[10px] font-bold uppercase tracking-widest opacity-50">
                  {t.rainfall}
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={rainfall}
                  onChange={(e) => setRainfall(parseFloat(e.target.value) || 0)}
                  className="w-full rounded-xl border border-border bg-card px-3 py-2.5 font-mono text-sm outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>

              <div>
                <label className="mb-2 block text-[10px] font-bold uppercase tracking-widest opacity-50">
                  {t.ph}
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={ph}
                  onChange={(e) => setPh(parseFloat(e.target.value) || 0)}
                  className="w-full rounded-xl border border-border bg-card px-3 py-2.5 font-mono text-sm outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-[11px] font-bold uppercase tracking-wider">
                  {t.ph}
                </label>
                <span className="font-mono text-sm font-bold">
                  {Number(ph).toFixed(1)}
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="14"
                step="0.1"
                value={ph}
                onChange={(e) => setPh(parseFloat(e.target.value) || 0)}
                className="w-full cursor-pointer accent-primary"
              />
              <div className="flex justify-between font-mono text-[9px] opacity-40">
                <span>{t.acidic}</span>
                <span>{t.alkaline}</span>
              </div>
            </div>

            <button
              onClick={submit}
              disabled={loading}
              className="flex w-full items-center justify-center gap-2 rounded-2xl bg-primary py-4 font-bold tracking-tight text-primary-foreground shadow-lg shadow-primary/20 transition-transform hover:scale-[1.01] disabled:opacity-60"
            >
              {loading ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  {t.submitting}
                </>
              ) : (
                t.submit
              )}
            </button>
          </div>

          {/* Results */}
          <div className="space-y-3">
            <p className="text-[10px] font-bold uppercase tracking-widest text-foreground/50">
              {t.ranked}
            </p>
            {safeCrops.length === 0 ? (
              <div className="grid aspect-[4/3] place-items-center rounded-2xl border border-dashed border-border bg-card/50 p-6 text-center text-sm text-foreground/40">
                —
              </div>
            ) : (
              safeCrops.map((c, i) => {
                const cropName = String(c?.crop ?? "Crop");
                const prob = Number(c?.probability) || 0;
                const pct = prob > 1 ? Math.min(100, prob) : Math.min(100, prob * 100);
                const initials = cropName.substring(0, 2).toUpperCase() || "CR";

                return (
                  <div
                    key={`${cropName}-${i}`}
                    className="flex items-center gap-4 rounded-2xl border border-border bg-card p-4"
                  >
                    <div className="grid size-12 shrink-0 place-items-center rounded-xl bg-sage-soft font-bold italic text-primary">
                      {initials}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="mb-1 flex items-end justify-between gap-2">
                        <h5 className="truncate text-sm font-bold capitalize">
                          {cropName}
                        </h5>
                        <span className="font-mono text-[11px] font-bold">
                          {Math.round(pct)}% {t.match}
                        </span>
                      </div>
                      <div className="h-1 w-full rounded-full bg-sage-soft">
                        <div
                          className="h-full rounded-full bg-primary"
                          style={{ width: `${Math.round(pct)}%` }}
                        />
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </TabWrapper>
  );
}
