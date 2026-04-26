import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState, useEffect } from "react";
import {
  Target,
  BookOpen,
  Scaling,
  Megaphone,
  Settings2,
  Loader2,
  BarChart3,
  Info,
  X,
} from "lucide-react";
import AppLayout from "@/components/AppLayout";
import { supabase } from "@/integrations/supabase/client";
import { getSessionId, saveStrategyToDB, loadStrategyFromDB } from "@/hooks/use-brand-store";

export const Route = createFileRoute("/strategy")({
  head: () => ({
    meta: [
      { title: "Content Strategy — SocialFlow" },
      { name: "description", content: "Define your post distribution and content mix strategy." },
    ],
  }),
  component: StrategyPage,
});

type CategoryKey = "educational" | "product" | "promotional" | "visual" | "interactive" | "ugc" | "personal";
type Mix = Record<CategoryKey, number>;

const CATEGORIES: { key: CategoryKey; label: string; color: string; bar: string; funnelStage: string; description: string }[] = [
  { key: "educational", label: "Educational", color: "#6366f1", bar: "bg-indigo-500", funnelStage: "TOFU", description: "Teaches your audience something valuable. Builds authority and trust over time." },
  { key: "product", label: "Product-Focused", color: "#8b5cf6", bar: "bg-violet-500", funnelStage: "BOFU", description: "Showcases features, use cases, and product benefits directly." },
  { key: "promotional", label: "Promotional", color: "#ec4899", bar: "bg-pink-500", funnelStage: "BOFU", description: "Drives immediate action — offers, launches, discounts." },
  { key: "visual", label: "Visual", color: "#10b981", bar: "bg-emerald-500", funnelStage: "TOFU", description: "High-impact imagery and video that stops the scroll." },
  { key: "interactive", label: "Interactive", color: "#06b6d4", bar: "bg-cyan-500", funnelStage: "MOFU", description: "Polls, questions, challenges — drives engagement and conversations." },
  { key: "ugc", label: "UGC", color: "#f59e0b", bar: "bg-amber-500", funnelStage: "MOFU", description: "Real customer stories, testimonials, and community content that builds trust." },
  { key: "personal", label: "Personal Story", color: "#f43f5e", bar: "bg-rose-500", funnelStage: "TOFU", description: "Behind-the-scenes, founder stories, brand journey content." },
];

type PresetId = "education-first" | "product-heavy" | "balanced" | "promotional" | "custom";

const PRESETS: {
  id: PresetId;
  name: string;
  icon: typeof BookOpen;
  description: string;
  detailedDescription: string;
  mix: Mix;
  productMention: number;
  intention: string;
}[] = [
  {
    id: "education-first",
    name: "Education-First",
    icon: BookOpen,
    description: "Build authority by teaching your audience.",
    detailedDescription: "Best for brands entering a crowded market or trying to establish thought leadership. Prioritises awareness and trust over direct conversion.",
    mix: { educational: 40, product: 10, promotional: 5, visual: 15, interactive: 10, ugc: 10, personal: 10 },
    productMention: 20,
    intention: "I want to be known as the go-to expert before I ask for the sale.",
  },
  {
    id: "product-heavy",
    name: "Product-Heavy",
    icon: Target,
    description: "Focus on features and product benefits.",
    detailedDescription: "Best for brands with a clear product-market fit ready to scale conversions. Prioritises BOFU content to drive purchase decisions.",
    mix: { educational: 15, product: 40, promotional: 15, visual: 15, interactive: 5, ugc: 5, personal: 5 },
    productMention: 60,
    intention: "I want every post to remind people what we sell and why it's great.",
  },
  {
    id: "balanced",
    name: "Balanced Mix",
    icon: Scaling,
    description: "A healthy mix of all content types.",
    detailedDescription: "Works for most brands at a growth stage. Covers the full funnel without over-indexing on any single content type.",
    mix: { educational: 20, product: 20, promotional: 10, visual: 15, interactive: 10, ugc: 10, personal: 15 },
    productMention: 35,
    intention: "I want broad coverage — awareness, trust, and conversion all at once.",
  },
  {
    id: "promotional",
    name: "Promotional Push",
    icon: Megaphone,
    description: "Aggressive focus on sales and conversion.",
    detailedDescription: "Best for product launches, sales seasons, or aggressive growth phases. High product mention frequency.",
    mix: { educational: 10, product: 20, promotional: 35, visual: 10, interactive: 10, ugc: 10, personal: 5 },
    productMention: 75,
    intention: "I want to drive maximum conversions right now.",
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

type PeecData = {
  shareOfVoice: number | null;
  sentiment: number | null;
  competitors: { name: string; shareOfVoice: number }[];
  contentRecommendations: {
    educational: { recommended: boolean; suggestedPercentage: number | null; reason: string; lowRankCount: number; totalPrompts: number };
    ugc: { recommended: boolean; suggestedPercentage: number | null; reason: string };
    highVolumePrompts: { prompt: string; volume: number; position: number | null; absent: boolean }[];
  } | null;
} | null;

function StrategyPage() {
  const [selectedPreset, setSelectedPreset] = useState<PresetId>("education-first");
  const [advanced, setAdvanced] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [customMix, setCustomMix] = useState<Mix | null>(null);
  const [productMention, setProductMention] = useState(20);
  const [brandName, setBrandName] = useState("");
  const [peecData, setPeecData] = useState<PeecData>(null);
  const [isFetchingPeec, setIsFetchingPeec] = useState(false);

  const preset = PRESETS.find((p) => p.id === selectedPreset) ?? PRESETS[0];
  const mix = customMix ?? preset.mix;
  const total = useMemo(() => Object.values(mix).reduce((a, b) => a + b, 0), [mix]);

  // Load brand name + strategy settings from Supabase on mount
  useEffect(() => {
    const sessionId = getSessionId();
    supabase
      .from("brand_profiles")
      .select("brand_name")
      .eq("session_id", sessionId)
      .single()
      .then(({ data }) => {
        if (data?.brand_name) setBrandName(data.brand_name);
      });

    loadStrategyFromDB().then((saved) => {
      if (!saved) return;
      if (saved.presetId === "custom" || PRESETS.find((p) => p.id === saved.presetId)) {
        setSelectedPreset(saved.presetId as PresetId);
      }
      if (saved.customMix) setCustomMix(saved.customMix as Mix);
      setProductMention(saved.productMention);
    });
  }, []);

  // Save strategy settings to Supabase whenever they change
  useEffect(() => {
    void saveStrategyToDB({ presetId: selectedPreset, customMix, productMention });
  }, [selectedPreset, customMix, productMention]);

  // Fetch Peec data when brand name is known
  useEffect(() => {
    if (!brandName || brandName.trim().length < 3) return;
    fetchPeec(brandName.trim());
  }, [brandName]);

  const fetchPeec = (name: string) => {
    setIsFetchingPeec(true);
    supabase.functions
      .invoke("fetch-peec-insights", { body: { brandName: name } })
      .then(({ data, error }) => {
        if (!error && data && !data.error) {
          setPeecData({
            shareOfVoice: data.visibility?.shareOfVoice ?? null,
            sentiment: data.sentiment ?? null,
            competitors: data.competitors || [],
            contentRecommendations: data.contentRecommendations ?? null,
          });
        }
      })
      .finally(() => setIsFetchingPeec(false));
  };

  const handlePreset = (id: PresetId) => {
    setSelectedPreset(id);
    setCustomMix(null);
    const p = PRESETS.find((x) => x.id === id);
    if (p) setProductMention(p.productMention);
  };

  const handleSlider = (key: CategoryKey, value: number) => {
    setCustomMix({ ...mix, [key]: value });
    setSelectedPreset("custom");
  };

  // Peec-driven recommendation
  const getPeecRec = () => {
    if (!peecData) return null;
    const prompts = peecData.contentRecommendations?.highVolumePrompts || [];
    const lowRankCount = peecData.contentRecommendations?.educational?.lowRankCount ?? 0;
    const totalPrompts = peecData.contentRecommendations?.educational?.totalPrompts ?? prompts.length;
    const sentiment = peecData.sentiment;
    const sov = peecData.shareOfVoice !== null ? (peecData.shareOfVoice > 1 ? peecData.shareOfVoice : peecData.shareOfVoice * 100) : null;

    if (lowRankCount >= 3 && sentiment !== null && sentiment < 60) {
      return { type: "Education-First + UGC Mix", icon: "📚🎥", color: "blue", template: "How-to carousels, myth-busting posts, authentic customer stories", reason: `Low AI rank on ${lowRankCount}/${totalPrompts} prompts + mixed sentiment — build authority through education while letting real customers shift perception.` };
    }
    if (lowRankCount >= 3) {
      return { type: "Education-First", icon: "📚", color: "blue", template: "Carousel breakdowns, comparison guides, \"X things you didn't know\" posts", reason: `Missing from AI responses on ${lowRankCount}/${totalPrompts} tracked prompts — educational content directly improves how AI models represent your brand.` };
    }
    if (sentiment !== null && sentiment < 60) {
      return { type: "UGC / Authentic Content", icon: "🎥", color: "orange", template: "Customer testimonials, behind-the-scenes, real user stories", reason: `Sentiment score of ${sentiment}/100 suggests AI associates your brand with mixed signals — authentic UGC builds trust and shifts perception.` };
    }
    if (sov !== null && sov >= 30) {
      return { type: "Balanced Mix", icon: "⚖️", color: "green", template: "Mix of educational carousels, product showcases, and community posts", reason: `Strong AI visibility at ${sov.toFixed(1)}% — maintain momentum with a balanced content mix that reinforces existing strengths.` };
    }
    return { type: "Product-Heavy", icon: "🛍️", color: "purple", template: "Product demos, feature spotlights, comparison posts vs competitors", reason: "Build product awareness to increase brand presence in AI-generated recommendations." };
  };

  const rec = getPeecRec();
  const prompts = peecData?.contentRecommendations?.highVolumePrompts || [];

  return (
    <AppLayout>
      <div className="space-y-6">
        <header className="mb-16">
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Content Strategy</h2>
          <p className="text-slate-500 text-sm mt-1">Choose how you want to distribute your content.</p>
        </header>

        <div className="space-y-4">
          <div className="space-y-2">
            <h3 className="text-sm font-medium">Choose Your Content Pillars</h3>
            <p className="text-xs text-muted-foreground">Pick a content mix that aligns with your goals. Customise further with advanced settings.</p>
          </div>

          {/* Main grid: presets left, donut right */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

            {/* Left: presets + advanced */}
            <div className="lg:col-span-2 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {PRESETS.map((p) => {
                  const Icon = p.icon;
                  const active = selectedPreset === p.id;
                  return (
                    <button
                      key={p.id}
                      onClick={() => handlePreset(p.id)}
                      className={`p-3 rounded-lg border text-left transition-all relative ${active ? "border-blue-600 bg-blue-50/50 shadow-sm" : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/50"}`}
                    >
                      <div className="flex items-start gap-3">
                        <div className={`p-2 rounded-md shrink-0 ${active ? "bg-blue-100 text-blue-600" : "bg-gray-100 text-gray-500"}`}>
                          <Icon strokeWidth={1.5} className="w-4 h-4" />
                        </div>
                        <div className="space-y-1 flex-1 min-w-0">
                          <div className="flex items-center gap-1.5">
                            <h4 className={`font-semibold text-sm ${active ? "text-blue-900" : "text-gray-900"}`}>{p.name}</h4>
                            <div title={p.detailedDescription} className="cursor-help opacity-40 hover:opacity-80 transition-opacity" onClick={(e) => e.stopPropagation()}>
                              <Info className="w-3 h-3" />
                            </div>
                          </div>
                          <p className="text-xs text-slate-500 leading-relaxed">{p.description}</p>
                          <div className={`text-xs font-medium mt-1 ${active ? "text-blue-700" : "text-slate-400"}`}>
                            Product mentions: {p.productMention}%
                          </div>
                        </div>
                      </div>
                    </button>
                  );
                })}

                {/* Custom mix card */}
                <button
                  onClick={() => { setSelectedPreset("custom"); setAdvanced(true); }}
                  className={`p-3 rounded-lg border text-left transition-all ${selectedPreset === "custom" ? "border-blue-600 bg-blue-50/50 shadow-sm" : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/50"}`}
                >
                  <div className="flex items-start gap-3">
                    <div className={`p-2 rounded-md shrink-0 ${selectedPreset === "custom" ? "bg-blue-100 text-blue-600" : "bg-gray-100 text-gray-500"}`}>
                      <Settings2 strokeWidth={1.5} className="w-4 h-4" />
                    </div>
                    <div className="space-y-1">
                      <h4 className={`font-semibold text-sm ${selectedPreset === "custom" ? "text-blue-900" : "text-gray-900"}`}>Custom Mix</h4>
                      <p className="text-xs text-slate-500">Customise content distribution</p>
                      <div className={`text-xs font-medium ${selectedPreset === "custom" ? "text-blue-700" : "text-slate-400"}`}>
                        Product mentions: {productMention}%
                      </div>
                    </div>
                  </div>
                </button>
              </div>

              {/* Advanced settings */}
              {advanced && (
                <div className="space-y-4 p-4 bg-muted rounded-lg">
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <h4 className="text-sm font-medium">Fine-tune Content Mix</h4>
                      <p className="text-xs text-muted-foreground">Adjust individual percentages. Total must equal 100%.</p>
                    </div>
                    <button onClick={() => setAdvanced(false)} className="p-1 rounded-md hover:bg-gray-200 transition-colors">
                      <X className="h-4 w-4 text-gray-500" />
                    </button>
                  </div>

                  {CATEGORIES.map((c) => (
                    <div key={c.key} className="flex items-center gap-4">
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: c.color }} />
                        <span className="text-sm font-medium text-gray-700 flex-shrink-0">{c.label}</span>
                        <span className="text-[10px] uppercase tracking-wider font-semibold text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded">{c.funnelStage}</span>
                      </div>
                      <div className="flex items-center gap-3 shrink-0">
                        <input
                          type="range"
                          min={0}
                          max={100}
                          step={5}
                          value={mix[c.key]}
                          onChange={(e) => handleSlider(c.key, Number(e.target.value))}
                          className="w-24 accent-indigo-600"
                        />
                        <span className="text-sm font-medium tabular-nums w-10 text-right">{mix[c.key]}%</span>
                      </div>
                    </div>
                  ))}

                  {/* Product mention slider */}
                  <div className="pt-3 border-t border-border space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-700">Posts with product mentions</span>
                      <div className="flex items-center gap-3">
                        <input
                          type="range"
                          min={0}
                          max={100}
                          step={5}
                          value={productMention}
                          onChange={(e) => setProductMention(Number(e.target.value))}
                          className="w-24 accent-indigo-600"
                        />
                        <span className="text-sm font-medium tabular-nums w-10 text-right">{productMention}%</span>
                      </div>
                    </div>
                    <p className="text-xs text-gray-500">Percentage of posts that directly mention your products or services.</p>
                  </div>

                  {total !== 100 && (
                    <p className="text-xs text-amber-600">Total is {total}% — adjust sliders to reach 100%.</p>
                  )}
                  {customMix && (
                    <button onClick={() => { setCustomMix(null); setSelectedPreset("education-first"); }} className="text-xs text-indigo-600 hover:text-indigo-700 font-medium">
                      Reset to preset
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* Right: content mix preview */}
            <div className="lg:col-span-1 lg:self-start">
              <div className="bg-muted rounded-lg p-4">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-sm font-medium">Content Mix Preview</h4>
                  <button
                    onClick={() => setShowDetails((v) => !v)}
                    className={`flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-md border transition-colors ${showDetails ? "bg-primary text-primary-foreground border-primary" : "text-muted-foreground border-border hover:bg-accent"}`}
                  >
                    <BarChart3 className="w-3 h-3" />
                    Details
                  </button>
                </div>

                {!showDetails ? (
                  <div className="flex items-center justify-center">
                    <div
                      className="relative w-40 h-40 rounded-full flex items-center justify-center shrink-0"
                      style={{ background: donutGradient(mix) }}
                    >
                      <div className="w-24 h-24 rounded-full bg-white flex items-center justify-center text-center shadow-inner">
                        <div>
                          <div className="text-xl font-bold text-slate-900">{total}%</div>
                          <div className="text-[10px] text-slate-400 italic">Total</div>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3 text-xs">
                    {CATEGORIES.map((c) => (
                      <div key={c.key} className="space-y-1">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full" style={{ backgroundColor: c.color }} />
                          <span className="text-muted-foreground">{c.label}</span>
                          <span className="text-[10px] uppercase tracking-wider font-semibold text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded ml-auto">{c.funnelStage}</span>
                        </div>
                        <div className="font-medium">{mix[c.key]}%</div>
                      </div>
                    ))}
                  </div>
                )}

                <div className="mt-4 pt-4 border-t border-border text-xs text-muted-foreground text-center">
                  {selectedPreset === "custom" ? "Custom Mix" : preset.name}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Peec AI Recommendations Banner — below content pillars */}
        {(isFetchingPeec || peecData) && (
          <div className="rounded-xl border border-purple-100 bg-gradient-to-br from-purple-50 to-fuchsia-50 p-4 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-purple-800">⚡ Peec AI — Content Strategy Signals</p>
                <p className="text-xs text-purple-500 mt-0.5">
                  Based on what people are actually asking AI about {brandName || "your brand"}
                </p>
              </div>
              <button
                onClick={() => brandName && fetchPeec(brandName)}
                disabled={isFetchingPeec}
                className="text-purple-400 hover:text-purple-600 transition-colors disabled:opacity-40"
                title="Refresh"
              >
                {isFetchingPeec ? <Loader2 className="h-4 w-4 animate-spin" /> : <span className="text-base">↻</span>}
              </button>
            </div>

            {isFetchingPeec && !peecData && (
              <p className="text-xs text-purple-500 animate-pulse">Fetching live AI prompts for {brandName}...</p>
            )}

            {peecData && (
              <div className="space-y-3">
                {/* High volume prompts */}
                {prompts.length > 0 && (
                  <div className="bg-white rounded-lg p-3 border border-purple-100 space-y-2">
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-medium text-gray-700">What people ask AI about {brandName}</p>
                      <span className="text-xs text-gray-400">Your rank</span>
                    </div>
                    <div className="space-y-2">
                      {prompts.slice(0, 5).map((p, i) => (
                        <div key={i} className="flex items-start gap-2 text-xs">
                          <span className={`shrink-0 mt-0.5 w-5 h-5 rounded-full flex items-center justify-center text-white font-bold text-xs ${p.absent ? "bg-red-400" : p.position !== null && p.position <= 2 ? "bg-green-500" : p.position !== null && p.position <= 4 ? "bg-yellow-500" : "bg-red-400"}`}>
                            {p.absent ? "-" : p.position}
                          </span>
                          <span className="text-gray-700 flex-1 leading-relaxed">{p.prompt}</span>
                        </div>
                      ))}
                    </div>
                    <p className="text-xs text-gray-400 pt-1">🟢 Top 2 &nbsp;·&nbsp; 🟡 3–4 &nbsp;·&nbsp; 🔴 5+ or absent</p>
                  </div>
                )}

                {/* Content type recommendation */}
                {rec && (
                  <div className={`rounded-lg p-3 border space-y-2 ${rec.color === "blue" ? "bg-blue-50 border-blue-200" : rec.color === "orange" ? "bg-orange-50 border-orange-200" : rec.color === "green" ? "bg-green-50 border-green-200" : "bg-purple-50 border-purple-200"}`}>
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-semibold text-gray-800">{rec.icon} Recommended: {rec.type}</p>
                      <span className="text-xs text-gray-400 bg-white px-2 py-0.5 rounded-full border">AI-driven</span>
                    </div>
                    <p className="text-xs text-gray-600 leading-relaxed">{rec.reason}</p>
                    <div className="bg-white rounded-md p-2 border border-gray-100">
                      <p className="text-xs text-gray-500 font-medium mb-0.5">Suggested templates</p>
                      <p className="text-xs text-gray-700">{rec.template}</p>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
