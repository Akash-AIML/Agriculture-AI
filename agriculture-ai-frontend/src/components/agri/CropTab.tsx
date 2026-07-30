import { useState } from "react";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { SectionHeader, TabWrapper } from "./Shell";
import { useAgri } from "@/lib/agri-store";
import { TRANSLATIONS } from "@/lib/i18n";
import { recommendCrop, type CropInput } from "@/lib/api";

const DEFAULTS: CropInput = {
  N: 42,
  P: 50,
  K: 43,
  temperature: 26,
  humidity: 70,
  ph: 6.5,
  rainfall: 120,
};

export function CropTab() {
  const { lang, crops, setCrops } = useAgri();
  const t = TRANSLATIONS[lang].crop;
  const [input, setInput] = useState<CropInput>(DEFAULTS);
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    setLoading(true);
    try {
      const res = await recommendCrop(input, lang);
      setCrops(res.recommendations);
    } catch (e) {
      console.error(e);
      toast.error(t.error);
    } finally {
      setLoading(false);
    }
  };

  const set = (k: keyof CropInput, v: number) =>
    setInput((s) => ({ ...s, [k]: Number.isFinite(v) ? v : 0 }));

  return (
    <TabWrapper>
      <SectionHeader title={t.title} subtitle={t.subtitle} />

      <div className="rounded-3xl border border-border bg-sage-soft/40 p-5 sm:p-8">
        <div className="grid gap-10 md:grid-cols-2">
          {/* Form */}
          <div className="space-y-6">
            <div className="grid grid-cols-3 gap-3 sm:gap-4">
              <NumField label={t.n} value={input.N} onChange={(v) => set("N", v)} />
              <NumField label={t.p} value={input.P} onChange={(v) => set("P", v)} />
              <NumField label={t.k} value={input.K} onChange={(v) => set("K", v)} />
            </div>

            <div className="grid grid-cols-2 gap-3 sm:gap-4">
              <NumField
                label={t.temperature}
                value={input.temperature}
                step={0.1}
                onChange={(v) => set("temperature", v)}
              />
              <NumField
                label={t.humidity}
                value={input.humidity}
                step={0.1}
                onChange={(v) => set("humidity", v)}
              />
              <NumField
                label={t.rainfall}
                value={input.rainfall}
                step={0.1}
                onChange={(v) => set("rainfall", v)}
              />
              <NumField
                label={t.ph}
                value={input.ph}
                step={0.1}
                onChange={(v) => set("ph", v)}
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-[11px] font-bold uppercase tracking-wider">
                  {t.ph}
                </label>
                <span className="font-mono text-sm font-bold">
                  {input.ph.toFixed(1)}
                </span>
              </div>
              <input
                type="range"
                min={0}
                max={14}
                step={0.1}
                value={input.ph}
                onChange={(e) => set("ph", Number(e.target.value))}
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
            {(crops ?? []).length === 0 ? (
              <div className="grid aspect-[4/3] place-items-center rounded-2xl border border-dashed border-border bg-card/50 p-6 text-center text-sm text-foreground/40">
                —
              </div>
            ) : (
              (crops ?? []).map((c, i) => {
                const pct = Math.max(0, Math.min(1, c.probability)) * 100;
                const initials = c.crop.slice(0, 2);
                return (
                  <div
                    key={c.crop + i}
                    className="flex items-center gap-4 rounded-2xl border border-border bg-card p-4"
                    style={{ opacity: 1 - i * 0.15 }}
                  >
                    <div className="grid size-12 shrink-0 place-items-center rounded-xl bg-sage-soft font-bold italic text-primary">
                      {initials}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="mb-1 flex items-end justify-between gap-2">
                        <h5 className="truncate text-sm font-bold capitalize">
                          {c.crop}
                        </h5>
                        <span className="font-mono text-[11px] font-bold">
                          {pct.toFixed(0)}% {t.match}
                        </span>
                      </div>
                      <div className="h-1 w-full rounded-full bg-sage-soft">
                        <div
                          className="h-full rounded-full bg-primary transition-[width] duration-500"
                          style={{ width: `${pct}%` }}
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

function NumField({
  label,
  value,
  onChange,
  step = 1,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  step?: number;
}) {
  return (
    <div className="min-w-0">
      <label className="mb-2 block text-[10px] font-bold uppercase tracking-widest opacity-50">
        {label}
      </label>
      <input
        type="number"
        value={value}
        step={step}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full rounded-xl border border-border bg-card px-3 py-2.5 font-mono text-sm outline-none transition-all focus:ring-2 focus:ring-primary/20"
      />
    </div>
  );
}
