import { useMemo, useState, type ReactNode } from "react";
import { Leaf, Sprout, TestTube2, Wheat, MessagesSquare } from "lucide-react";
import { AgriContext } from "@/lib/agri-store";
import { LANGUAGES, TRANSLATIONS, type LangCode } from "@/lib/i18n";
import type { CropSuggestion, DiseaseResult, SoilResult } from "@/lib/api";
import { DiseaseTab } from "./DiseaseTab";
import { SoilTab } from "./SoilTab";
import { CropTab } from "./CropTab";
import { AdviceTab } from "./AdviceTab";
import { ErrorBoundary } from "./ErrorBoundary";

type TabId = "disease" | "soil" | "crop" | "advice";

const NAV: { id: TabId; icon: typeof Leaf }[] = [
  { id: "disease", icon: Leaf },
  { id: "soil", icon: TestTube2 },
  { id: "crop", icon: Wheat },
  { id: "advice", icon: MessagesSquare },
];

export function Shell() {
  const [lang, setLang] = useState<LangCode>("en");
  const [tab, setTab] = useState<TabId>("disease");
  const [disease, setDisease] = useState<DiseaseResult | null>(null);
  const [soil, setSoil] = useState<SoilResult | null>(null);
  const [crops, setCrops] = useState<CropSuggestion[] | null>(null);

  const t = TRANSLATIONS[lang];

  const store = useMemo(
    () => ({ lang, setLang, disease, setDisease, soil, setSoil, crops, setCrops }),
    [lang, disease, soil, crops],
  );

  return (
    <AgriContext.Provider value={store}>
      <div className="min-h-screen bg-background text-foreground selection:bg-primary/10">
        {/* Desktop sidebar */}
        <nav className="fixed top-0 left-0 z-50 hidden h-full w-64 flex-col border-r border-border bg-sage-soft p-6 md:flex">
          <div className="mb-10 flex items-center gap-2">
            <div className="grid size-9 place-items-center rounded-lg bg-primary text-primary-foreground">
              <Sprout className="size-5" />
            </div>
            <div className="min-w-0">
              <h1 className="truncate text-base font-bold uppercase italic tracking-tight text-primary">
                {t.brand}
              </h1>
              <p className="mt-0.5 font-mono text-[10px] uppercase tracking-widest text-foreground/50">
                {t.brandSub}
              </p>
            </div>
          </div>

          <div className="flex-1 space-y-1.5">
            {NAV.map((n) => {
              const active = tab === n.id;
              const Icon = n.icon;
              return (
                <button
                  key={n.id}
                  onClick={() => setTab(n.id)}
                  className={`flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-all ${
                    active
                      ? "bg-primary text-primary-foreground shadow-sm shadow-primary/20"
                      : "text-foreground/70 hover:bg-sage-mid"
                  }`}
                >
                  <Icon className="size-4 shrink-0" />
                  <span className="truncate">{t.nav[n.id]}</span>
                </button>
              );
            })}
          </div>

          <div className="border-t border-border pt-6">
            <div className="flex items-center gap-2 rounded-lg border border-border bg-sage-mid/50 p-2">
              <span className="size-2 shrink-0 animate-pulse rounded-full bg-emerald-500" />
              <span className="truncate font-mono text-[11px] text-foreground/60">
                {t.systemReady}
              </span>
            </div>
          </div>
        </nav>

        {/* Header */}
        <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-md md:pl-64">
          <div className="mx-auto grid h-16 max-w-7xl grid-cols-[minmax(0,1fr)_auto] items-center gap-4 px-4 sm:px-6">
            <div className="flex min-w-0 items-center gap-2 md:hidden">
              <Sprout className="size-4 shrink-0 text-primary" />
              <span className="truncate font-bold italic text-primary">
                {t.brand}
              </span>
            </div>
            <div className="hidden md:block" />
            <LanguageSelect lang={lang} onChange={setLang} />
          </div>
        </header>

        {/* Main */}
        <main className="pb-28 md:pb-12 md:pl-64">
          <div className="mx-auto max-w-5xl space-y-8 p-4 sm:p-6">
            <ErrorBoundary>
              {tab === "disease" && <DiseaseTab />}
              {tab === "soil" && <SoilTab />}
              {tab === "crop" && <CropTab />}
              {tab === "advice" && <AdviceTab />}
            </ErrorBoundary>
          </div>
        </main>

        {/* Mobile bottom nav */}
        <nav className="animate-reveal fixed bottom-6 left-1/2 z-50 flex h-16 w-[calc(100%-2rem)] max-w-md -translate-x-1/2 items-center justify-around rounded-full border border-border bg-white px-2 shadow-2xl md:hidden">
          {NAV.map((n) => {
            const active = tab === n.id;
            const Icon = n.icon;
            return (
              <button
                key={n.id}
                onClick={() => setTab(n.id)}
                aria-label={t.nav[n.id]}
                className={`grid place-items-center rounded-full p-3 transition-all ${
                  active
                    ? "bg-primary text-primary-foreground shadow-md shadow-primary/20"
                    : "text-foreground/40"
                }`}
              >
                <Icon className="size-5" />
              </button>
            );
          })}
        </nav>
      </div>
    </AgriContext.Provider>
  );
}

function LanguageSelect({
  lang,
  onChange,
}: {
  lang: LangCode;
  onChange: (l: LangCode) => void;
}) {
  return (
    <label className="relative flex shrink-0 items-center">
      <select
        value={lang}
        onChange={(e) => onChange(e.target.value as LangCode)}
        className="cursor-pointer appearance-none rounded-full border border-border bg-sage-soft px-4 py-1.5 pr-8 text-xs font-medium text-foreground outline-none transition-colors hover:border-primary/30 focus:ring-2 focus:ring-primary/20"
      >
        {LANGUAGES.map((l) => (
          <option key={l.code} value={l.code}>
            {l.native}
          </option>
        ))}
      </select>
      <span className="pointer-events-none absolute right-3 text-[8px] opacity-40">
        ▼
      </span>
    </label>
  );
}

export function SectionHeader({
  title,
  subtitle,
  workflowId,
}: {
  title: string;
  subtitle: string;
  workflowId?: string;
}) {
  return (
    <header className="mb-6 grid grid-cols-[minmax(0,1fr)_auto] items-end gap-4">
      <div className="min-w-0">
        <h2 className="truncate text-2xl font-bold tracking-tight">{title}</h2>
        <p className="text-sm text-foreground/60">{subtitle}</p>
      </div>
      {workflowId ? (
        <div className="hidden text-right sm:block">
          <span className="font-mono text-[10px] uppercase tracking-wider opacity-40">
            Workflow ID
          </span>
          <p className="font-mono text-xs">{workflowId}</p>
        </div>
      ) : null}
    </header>
  );
}

export function TabWrapper({ children }: { children: ReactNode }) {
  return <section className="animate-reveal">{children}</section>;
}
