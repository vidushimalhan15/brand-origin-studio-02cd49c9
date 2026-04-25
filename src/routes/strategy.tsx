import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import {
  Target,
  BookOpen,
  Scaling,
  Megaphone,
  Settings2,
  Sparkles,
} from "lucide-react";
import AppLayout from "@/components/AppLayout";

export const Route = createFileRoute("/strategy")({
  head: () => ({
    meta: [
      { title: "Content Strategy — SocialFlow" },
      {
        name: "description",
        content: "Define your post distribution and content mix strategy.",
      },
    ],
  }),
  component: StrategyPage,
});

type CategoryKey =
  | "educational"
  | "product"
  | "promotional"
  | "visual"
  | "interactive"
  | "ugc"
  | "personal";

type Mix = Record<CategoryKey, number>;

const CATEGORIES: { key: CategoryKey; label: string; color: string; bar: string }[] = [
  { key: "educational", label: "Educational", color: "#6366f1", bar: "bg-indigo-500" },
  { key: "product", label: "Product-Focused", color: "#8b5cf6", bar: "bg-violet-500" },
  { key: "promotional", label: "Promotional", color: "#ec4899", bar: "bg-pink-500" },
  { key: "visual", label: "Visual", color: "#10b981", bar: "bg-emerald-500" },
  { key: "interactive", label: "Interactive", color: "#06b6d4", bar: "bg-cyan-500" },
  { key: "ugc", label: "UGC", color: "#f59e0b", bar: "bg-amber-500" },
  { key: "personal", label: "Personal Story", color: "#f43f5e", bar: "bg-rose-500" },
];

type PresetId = "education-first" | "product-heavy" | "balanced" | "promotional";

const PRESETS: {
  id: PresetId;
  name: string;
  icon: typeof BookOpen;
  desc: string;
  mix: Mix;
  signal: string;
  templates: string[];
}[] = [
  {
    id: "education-first",
    name: "Education-First",
    icon: BookOpen,
    desc: "Build authority by teaching your audience.",
    mix: { educational: 40, product: 10, promotional: 5, visual: 15, interactive: 10, ugc: 10, personal: 10 },
    signal:
      "Missing from AI responses on 3 of 5 tracked prompts — educational content directly improves how AI models represent your brand.",
    templates: ["Carousel breakdowns", "Comparison guides", "How-to threads"],
  },
  {
    id: "product-heavy",
    name: "Product-Heavy",
    icon: Target,
    desc: "Focus on features and product benefits.",
    mix: { educational: 15, product: 40, promotional: 15, visual: 15, interactive: 5, ugc: 5, personal: 5 },
    signal:
      "Missing from AI responses on 4 of 6 tracked prompts — clearer product positioning helps AI surface your offering.",
    templates: ["Feature spotlights", "Use-case demos", "Before/after reels"],
  },
  {
    id: "balanced",
    name: "Balanced Mix",
    icon: Scaling,
    desc: "A healthy mix of all content types.",
    mix: { educational: 20, product: 20, promotional: 10, visual: 15, interactive: 10, ugc: 10, personal: 15 },
    signal:
      "Mentioned in 4 of 8 tracked prompts — a balanced mix sustains broad AI brand coverage across topics.",
    templates: ["Weekly digests", "Customer spotlights", "Mini-tutorials"],
  },
  {
    id: "promotional",
    name: "Promotional Push",
    icon: Megaphone,
    desc: "Aggressive focus on sales and conversion.",
    mix: { educational: 10, product: 20, promotional: 35, visual: 10, interactive: 10, ugc: 10, personal: 5 },
    signal:
      "Missing from AI responses on 2 of 7 tracked prompts — promotional bursts drive short-term recall in AI answers.",
    templates: ["Limited-time offers", "Launch announcements", "Bundle deals"],
  },
];

function donutGradient(mix: Mix): string {
  const total = Object.values(mix).reduce((a, b) => a + b, 0) || 1;
  let acc = 0;
  const stops = CATEGORIES.map((c) => {
    const start = (acc / total) * 360;
    acc += mix[c.key];
    const end = (acc / total) * 360;
    return `${c.color} ${start}deg ${end}deg`;
  });
  return `conic-gradient(${stops.join(", ")})`;
}

function StrategyPage() {
  const [selectedPreset, setSelectedPreset] = useState<PresetId>("education-first");
  const [advanced, setAdvanced] = useState(false);
  const [customMix, setCustomMix] = useState<Mix | null>(null);

  const preset = PRESETS.find((p) => p.id === selectedPreset)!;
  const mix = customMix ?? preset.mix;
  const total = useMemo(() => Object.values(mix).reduce((a, b) => a + b, 0), [mix]);

  const handlePreset = (id: PresetId) => {
    setSelectedPreset(id);
    setCustomMix(null);
  };

  const handleSlider = (key: CategoryKey, value: number) => {
    setCustomMix({ ...mix, [key]: value });
  };

  return (
    <AppLayout>
      <div className="space-y-8">
        <header>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Content Strategy</h2>
          <p className="text-slate-500 text-sm mt-1">
            Choose how you want to distribute your content.
          </p>
        </header>

        {/* Presets */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {PRESETS.map((p) => {
            const active = selectedPreset === p.id;
            return (
              <button
                key={p.id}
                onClick={() => handlePreset(p.id)}
                className={`p-4 rounded-xl border text-left transition-all ${
                  active
                    ? "border-indigo-600 bg-indigo-50/60 ring-1 ring-indigo-600 shadow-sm"
                    : "border-slate-200 bg-white hover:border-slate-300 hover:shadow-sm"
                }`}
              >
                <p.icon
                  className={`w-5 h-5 mb-2 ${active ? "text-indigo-600" : "text-slate-400"}`}
                />
                <h4 className="font-semibold text-sm text-slate-900">{p.name}</h4>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">{p.desc}</p>
              </button>
            );
          })}
        </div>

        {/* Peec AI Signals */}
        <div className="rounded-xl border border-violet-100 bg-gradient-to-br from-violet-50 to-fuchsia-50 p-5">
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-1">
              <h4 className="text-sm font-semibold text-violet-900 flex items-center gap-2">
                <Sparkles className="w-4 h-4" />
                Peec AI — Content Strategy Signals
              </h4>
              <p className="text-xs text-violet-600">
                Based on how AI models represent your brand.
              </p>
            </div>
            <span className="text-[10px] uppercase font-bold tracking-widest text-violet-500 bg-white px-2 py-1 rounded">
              AI-Driven
            </span>
          </div>

          <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-white/80 p-3 rounded-lg border border-violet-100 italic text-xs text-slate-600 leading-relaxed">
              "{preset.signal}"
            </div>
            <div className="space-y-2">
              <p className="text-[10px] font-bold text-violet-500 uppercase tracking-wider">
                Suggested Templates
              </p>
              <div className="flex flex-wrap gap-2">
                {preset.templates.map((t) => (
                  <span
                    key={t}
                    className="text-[11px] font-medium bg-violet-100 text-violet-700 px-2 py-1 rounded-md"
                  >
                    {t}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Content Mix */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h4 className="font-semibold text-slate-900">Recommended Mix</h4>
              <p className="text-xs text-slate-500 mt-0.5">
                {customMix ? "Custom mix" : `Based on ${preset.name}`}
              </p>
            </div>
            <button
              onClick={() => setAdvanced((v) => !v)}
              className={`flex items-center gap-2 text-xs font-medium px-3 py-1.5 rounded-lg border transition-all ${
                advanced
                  ? "border-indigo-200 bg-indigo-50 text-indigo-700"
                  : "border-slate-200 text-slate-600 hover:bg-slate-50"
              }`}
            >
              <Settings2 className="w-3.5 h-3.5" />
              Advanced Settings
            </button>
          </div>

          <div className="flex flex-col md:flex-row items-center gap-10">
            {/* Donut */}
            <div
              className="relative w-44 h-44 rounded-full flex items-center justify-center shrink-0"
              style={{ background: donutGradient(mix) }}
            >
              <div className="w-28 h-28 rounded-full bg-white flex items-center justify-center text-center shadow-inner">
                <div>
                  <div className="text-xl font-bold text-slate-900">{total}%</div>
                  <div className="text-[10px] font-normal text-slate-400 italic">
                    Total
                  </div>
                </div>
              </div>
            </div>

            <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-y-4 gap-x-8 w-full">
              {CATEGORIES.map((c) => (
                <div key={c.key} className="space-y-1.5">
                  <div className="flex justify-between text-[11px] font-medium">
                    <span className="text-slate-600 flex items-center gap-1.5">
                      <span
                        className="w-2 h-2 rounded-full"
                        style={{ background: c.color }}
                      />
                      {c.label}
                    </span>
                    <span className="text-slate-900 tabular-nums">{mix[c.key]}%</span>
                  </div>
                  <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full ${c.bar} transition-all`}
                      style={{ width: `${mix[c.key]}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {advanced && (
            <div className="mt-8 pt-6 border-t border-slate-100 space-y-4">
              <div className="flex items-center justify-between">
                <h5 className="text-sm font-semibold text-slate-900">Custom Mix</h5>
                {customMix && (
                  <button
                    onClick={() => setCustomMix(null)}
                    className="text-xs text-indigo-600 hover:text-indigo-700 font-medium"
                  >
                    Reset to preset
                  </button>
                )}
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-4">
                {CATEGORIES.map((c) => (
                  <div key={c.key} className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <label className="text-slate-600 font-medium">{c.label}</label>
                      <span className="text-slate-900 tabular-nums font-medium">
                        {mix[c.key]}%
                      </span>
                    </div>
                    <input
                      type="range"
                      min={0}
                      max={100}
                      value={mix[c.key]}
                      onChange={(e) => handleSlider(c.key, Number(e.target.value))}
                      className="w-full accent-indigo-600"
                    />
                  </div>
                ))}
              </div>
              {total !== 100 && (
                <p className="text-xs text-amber-600">
                  Total is {total}% — adjust sliders to reach 100%.
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
