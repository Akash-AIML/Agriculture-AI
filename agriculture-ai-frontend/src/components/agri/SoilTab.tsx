import { useState } from "react";
import { toast } from "sonner";
import { SectionHeader, TabWrapper } from "./Shell";
import { ImageDrop } from "./ImageDrop";
import { ConfidenceBar } from "./ConfidenceBar";
import { useAgri } from "@/lib/agri-store";
import { TRANSLATIONS } from "@/lib/i18n";
import { analyzeSoil } from "@/lib/api";

export function SoilTab() {
  const { lang, soil, setSoil } = useAgri();
  const t = TRANSLATIONS[lang].soil;
  const [loading, setLoading] = useState(false);

  const onFile = async (f: File) => {
    setLoading(true);
    try {
      const res = await analyzeSoil(f, lang);
      setSoil(res);
    } catch (e) {
      console.error(e);
      toast.error(t.error);
    } finally {
      setLoading(false);
    }
  };

  const props = soil?.properties
    ? Object.entries(soil.properties)
    : [];

  return (
    <TabWrapper>
      <SectionHeader
        title={t.title}
        subtitle={t.subtitle}
        workflowId={t.workflowId}
      />

      <div className="grid gap-6 lg:grid-cols-5">
        <div className="lg:col-span-3">
          <ImageDrop
            title={t.dropTitle}
            hint={t.dropHint}
            cta={t.select}
            loading={loading}
            onFile={onFile}
            onClear={() => setSoil(null)}
          />
        </div>

        <div className="space-y-4 lg:col-span-2">
          <div className="rounded-3xl border border-border bg-card p-6 shadow-sm">
            <div className="mb-6 flex items-start justify-between gap-3">
              <span className="rounded border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-emerald-700">
                {t.result}
              </span>
              <div className="text-right">
                <span className="block font-mono text-[24px] font-bold text-primary">
                  {soil ? (soil.confidence * 100).toFixed(1) : "—"}
                  <span className="text-sm">%</span>
                </span>
                <span className="text-[10px] uppercase tracking-tighter opacity-40">
                  {t.confidence}
                </span>
              </div>
            </div>

            <div className="mb-6">
              <h3 className="text-xl font-bold">{soil?.soil_type ?? "—"}</h3>
            </div>

            <ConfidenceBar
              label={t.confidence}
              value={soil?.confidence ?? 0}
            />
          </div>

          {props.length > 0 ? (
            <div className="rounded-2xl border border-border bg-card p-5">
              <h4 className="mb-3 text-xs font-bold uppercase tracking-widest opacity-60">
                {t.properties}
              </h4>
              <dl className="space-y-2">
                {props.map(([k, v]) => (
                  <div
                    key={k}
                    className="flex items-center justify-between gap-3 text-sm"
                  >
                    <dt className="truncate capitalize text-foreground/70">
                      {k.replace(/_/g, " ")}
                    </dt>
                    <dd className="font-mono text-xs font-semibold text-primary">
                      {String(v)}
                    </dd>
                  </div>
                ))}
              </dl>
            </div>
          ) : null}
        </div>
      </div>
    </TabWrapper>
  );
}
