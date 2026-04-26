import { useState, useEffect } from "react";
import { Sparkles, Lightbulb, RefreshCw, ChevronUp, ChevronDown, Target, Copy, Trash2, Edit2, Calendar } from "lucide-react";
import { generatePostIdeas, fetchPeecInsights } from "@/server/brand.functions";
import type { PostIdea } from "@/server/brand.functions";
import { loadBrandProfile, loadLatestCampaignFromDB, loadPostIdeationState, savePostIdeationState } from "@/hooks/use-brand-store";
import { getPlatformIcon } from "@/utils/platformIcons";

const PLATFORM_COLORS: Record<string, string> = {
  LinkedIn: "bg-blue-100 text-blue-700",
  Instagram: "bg-pink-100 text-pink-700",
  "X/Twitter": "bg-slate-100 text-slate-700",
  YouTube: "bg-red-100 text-red-700",
  Facebook: "bg-indigo-100 text-indigo-700",
  "Blog Post": "bg-amber-100 text-amber-700",
};

const CONTENT_TYPE_COLORS: Record<string, string> = {
  Educational: "bg-emerald-100 text-emerald-700",
  Promotional: "bg-purple-100 text-purple-700",
  UGC: "bg-orange-100 text-orange-700",
  "Thought Leadership": "bg-cyan-100 text-cyan-700",
  "Behind-the-Scenes": "bg-rose-100 text-rose-700",
  Trending: "bg-yellow-100 text-yellow-700",
};

function readLocal<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try { return JSON.parse(localStorage.getItem(key) ?? "null") ?? fallback; } catch { return fallback; }
}

type PeecData = {
  volumeRankedPrompts: { prompt: string; rank: number; volume: string }[];
  chatGaps: string[];
  ugcBrief: string;
};

export default function PostIdeation() {
  const [brandName, setBrandName] = useState("");
  const [introduction, setIntroduction] = useState("");
  const [platforms, setPlatforms] = useState<string[]>([]);
  const [contentPillars, setContentPillars] = useState<string[]>([]);

  // Read selected trends from campaigns page localStorage
  const [selectedTrendIds] = useState<string[]>(() => readLocal("camp_tavily_selected", []));
  const [trendsByPillar] = useState<Record<string, { id: string; title: string; content: string }[]>>(
    () => readLocal("camp_tavily_by_pillar", {}),
  );

  // Peec AI signals
  const [peecData, setPeecData] = useState<PeecData | null>(null);
  const [isFetchingPeec, setIsFetchingPeec] = useState(false);
  const [isPeecExpanded, setIsPeecExpanded] = useState(true);
  const [selectedPeecSignals, setSelectedPeecSignals] = useState<{
    prompts: Set<number>; chatGaps: Set<number>; ugcBrief: Set<number>;
  }>({ prompts: new Set(), chatGaps: new Set(), ugcBrief: new Set() });

  // Post ideas
  const [numberOfPosts, setNumberOfPosts] = useState(6);
  const [ideas, setIdeas] = useState<PostIdea[]>([]);
  const [savedIdeas, setSavedIdeas] = useState<PostIdea[]>([]);
  const [generating, setGenerating] = useState(false);
  const [genError, setGenError] = useState("");

  useEffect(() => {
    (async () => {
      const [profile, campaign, saved] = await Promise.all([
        loadBrandProfile(),
        loadLatestCampaignFromDB(),
        loadPostIdeationState(),
      ]);
      if (profile) {
        setBrandName(profile.brandName);
        setIntroduction(profile.introduction);
        // Only fetch Peec if we don't have saved data
        if (profile.brandName && !saved?.peecData) {
          fetchPeec(profile.brandName, profile.introduction);
        }
      }
      if (campaign) {
        setPlatforms(campaign.selectedPlatforms ?? []);
        setContentPillars((campaign.contentPillars ?? []).filter(Boolean));
      }
      if (saved) {
        if (saved.peecData) setPeecData(saved.peecData as any);
        if (saved.selectedPeecSignals) {
          setSelectedPeecSignals({
            prompts: new Set(saved.selectedPeecSignals.prompts),
            chatGaps: new Set(saved.selectedPeecSignals.chatGaps),
            ugcBrief: new Set(saved.selectedPeecSignals.ugcBrief),
          });
        }
        if (saved.ideas?.length) setIdeas(saved.ideas as any);
        if (saved.savedIdeas?.length) setSavedIdeas(saved.savedIdeas as any);
        if (saved.numberOfPosts) setNumberOfPosts(saved.numberOfPosts);
      }
    })();
  }, []);

  // Persist state to DB whenever it changes (debounced via 1s timeout)
  useEffect(() => {
    if (typeof window === "undefined") return;
    const t = setTimeout(() => {
      savePostIdeationState({
        peecData,
        selectedPeecSignals: {
          prompts: Array.from(selectedPeecSignals.prompts),
          chatGaps: Array.from(selectedPeecSignals.chatGaps),
          ugcBrief: Array.from(selectedPeecSignals.ugcBrief),
        },
        ideas,
        savedIdeas,
        numberOfPosts,
      });
    }, 1000);
    return () => clearTimeout(t);
  }, [peecData, selectedPeecSignals, ideas, savedIdeas, numberOfPosts]);

  async function fetchPeec(name: string, intro: string) {
    if (!name) return;
    setIsFetchingPeec(true);
    try {
      const res = await fetchPeecInsights({ data: { brandName: name, introduction: intro } });
      if (!res.error) {
        setPeecData({
          volumeRankedPrompts: res.postIdeation.volumeRankedPrompts,
          chatGaps: res.postIdeation.chatGaps,
          ugcBrief: res.postIdeation.ugcBrief,
        });
      }
    } catch { /* silent */ } finally {
      setIsFetchingPeec(false);
    }
  }

  function togglePeec(section: "prompts" | "chatGaps" | "ugcBrief", i: number) {
    setSelectedPeecSignals((prev) => {
      const next = new Set(prev[section]);
      next.has(i) ? next.delete(i) : next.add(i);
      return { ...prev, [section]: next };
    });
  }

  const totalSelected = selectedPeecSignals.prompts.size + selectedPeecSignals.chatGaps.size + selectedPeecSignals.ugcBrief.size;

  async function handleGenerate() {
    if (!brandName) { setGenError("Complete Brand Setup first."); return; }
    setGenerating(true);
    setGenError("");
    setIdeas([]);

    const allArticles = Object.values(trendsByPillar).flat();
    const trendingContext = selectedTrendIds
      .map((id) => { const a = allArticles.find((x) => x.id === id); return a ? `${a.title}: ${a.content}` : null; })
      .filter(Boolean).join("\n\n");

    // Build structured Peec context — label each signal so Gemini can tag ideas
    const peecAiVisibilitySignals: string[] = [];
    const peecReputationSignals: string[] = [];

    if (peecData) {
      Array.from(selectedPeecSignals.prompts).forEach((i) => {
        const p = peecData.volumeRankedPrompts[i];
        if (p) peecAiVisibilitySignals.push(p.prompt);
      });
      Array.from(selectedPeecSignals.chatGaps).forEach((i) => {
        if (peecData.chatGaps[i]) peecReputationSignals.push(peecData.chatGaps[i]);
      });
      Array.from(selectedPeecSignals.ugcBrief).forEach((i) => {
        const lines = peecData.ugcBrief.split("|||").filter(Boolean);
        if (lines[i]) peecReputationSignals.push(lines[i].trim());
      });
    }

    const peecSection = [
      peecAiVisibilitySignals.length > 0
        ? `PEEC AI VISIBILITY — Questions people are asking AI about ${brandName} (create posts that make ${brandName} the answer):\n${peecAiVisibilitySignals.map((q, i) => `${i + 1}. ${q}`).join("\n")}`
        : "",
      peecReputationSignals.length > 0
        ? `PEEC REPUTATION FIX — Negative things AI says about ${brandName} (create posts that counter these narratives with real stories):\n${peecReputationSignals.map((q, i) => `${i + 1}. ${q}`).join("\n")}`
        : "",
    ].filter(Boolean).join("\n\n");

    const combinedContext = [
      trendingContext || "",
      peecSection,
    ].filter(Boolean).join("\n\n");

    try {
      const res = await generatePostIdeas({
        data: { brandName, introduction, platforms, contentPillars, trendingContext: combinedContext, count: numberOfPosts || 6 },
      });
      if (res.error) setGenError(res.error);
      else setIdeas(res.ideas);
    } catch (err) {
      setGenError(err instanceof Error ? err.message : "Failed to generate.");
    } finally {
      setGenerating(false);
    }
  }

  function saveIdea(idea: PostIdea) {
    setIdeas((prev) => prev.filter((i) => i.id !== idea.id));
    setSavedIdeas((prev) => [...prev, idea]);
  }

  function unsaveIdea(id: string) {
    setSavedIdeas((prev) => prev.filter((i) => i.id !== id));
  }

  return (
    <div className="space-y-4 pb-16">
      {/* Header */}
      <div className="mb-16">
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Post Ideation</h1>
        <p className="mt-1 text-sm text-slate-500">
          Generate AI-powered post ideas using your brand, campaign, and live AI signals.
        </p>
      </div>

      {/* Number of Posts */}
      <div className="max-w-xs">
        <label htmlFor="numberOfPosts" className="text-sm font-medium text-slate-700">
          Number of Posts (Max 30)
        </label>
        <input
          id="numberOfPosts"
          type="number"
          min="1"
          max="30"
          value={numberOfPosts === 0 ? "" : numberOfPosts}
          onChange={(e) => {
            const val = e.target.value;
            if (val === "") { setNumberOfPosts(0); return; }
            const parsed = parseInt(val);
            if (!isNaN(parsed)) setNumberOfPosts(Math.min(30, Math.max(1, parsed)));
          }}
          placeholder="Enter number of posts (1-30)"
          className="mt-1 block w-full h-8 rounded-lg border border-slate-200 px-3 text-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
        />
      </div>

      {/* Peec AI Signals Panel */}
      {(isFetchingPeec || peecData) && (
        <div className="rounded-2xl border border-purple-100 overflow-hidden">
          {/* Header */}
          <div
            className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-purple-50 to-fuchsia-50 border-b border-purple-100 cursor-pointer select-none"
            onClick={() => setIsPeecExpanded((v) => !v)}
          >
            <div className="flex items-center gap-2">
              <span className="text-base">⚡</span>
              <div>
                <p className="text-sm font-semibold text-purple-800">Peec AI — Post Ideation Signals</p>
                {isPeecExpanded && (
                  <p className="text-xs text-purple-500">Live data from ChatGPT, Perplexity & other AI tools — used to shape your post ideas</p>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2">
              {totalSelected > 0 && !isPeecExpanded && (
                <span className="text-xs font-medium bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full">
                  ⚡ {totalSelected} selected
                </span>
              )}
              <button
                onClick={(e) => { e.stopPropagation(); fetchPeec(brandName, introduction); }}
                disabled={isFetchingPeec}
                className="text-purple-400 hover:text-purple-600 transition-colors disabled:opacity-40"
                title="Refresh Peec data"
              >
                <RefreshCw className={`h-4 w-4 ${isFetchingPeec ? "animate-spin" : ""}`} />
              </button>
              {isPeecExpanded
                ? <ChevronUp className="h-4 w-4 text-purple-400" />
                : <ChevronDown className="h-4 w-4 text-purple-400" />
              }
            </div>
          </div>

          {isPeecExpanded && <div className="p-4 space-y-4 bg-white">
            {isFetchingPeec && (
              <p className="text-xs text-purple-500 animate-pulse">Fetching live AI signals for {brandName}…</p>
            )}

            {/* Volume-ranked prompts */}
            {peecData && peecData.volumeRankedPrompts.length > 0 && (
              <div className="space-y-2">
                <div>
                  <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide">What people are asking AI about {brandName}</p>
                  <p className="text-xs text-gray-400 mt-0.5">These are real questions people typed into ChatGPT, Perplexity, etc.</p>
                </div>
                <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
                  {peecData.volumeRankedPrompts.map((p, i) => {
                    const selected = selectedPeecSignals.prompts.has(i);
                    return (
                      <div
                        key={i}
                        onClick={() => togglePeec("prompts", i)}
                        className={`flex items-center gap-3 rounded-lg px-3 py-2 cursor-pointer transition-colors ${selected ? "bg-purple-100 border border-purple-300" : "bg-purple-50 border border-transparent hover:border-purple-200"}`}
                      >
                        <div className={`h-4 w-4 shrink-0 rounded border-2 flex items-center justify-center transition-colors ${selected ? "border-purple-500 bg-purple-500" : "border-purple-300 bg-white"}`}>
                          {selected && <svg className="h-2.5 w-2.5 text-white" viewBox="0 0 10 10" fill="none"><path d="M2 5l2.5 2.5L8 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>}
                        </div>
                        <span className="text-xs text-gray-700 flex-1 leading-snug">{p.prompt}</span>
                        <span className="shrink-0 text-xs font-semibold text-purple-700 bg-white border border-purple-200 px-2 py-0.5 rounded-full whitespace-nowrap">rank #{i + 1}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Chat gaps */}
            {peecData && peecData.chatGaps.length > 0 && (
              <div className="space-y-2">
                <div>
                  <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Where competitors are winning</p>
                  <p className="text-xs text-gray-400 mt-0.5">Questions where AI recommends a competitor over {brandName}. Make content here to take that spot.</p>
                </div>
                <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
                  {peecData.chatGaps.map((gap, i) => {
                    const selected = selectedPeecSignals.chatGaps.has(i);
                    return (
                      <div
                        key={i}
                        onClick={() => togglePeec("chatGaps", i)}
                        className={`rounded-lg px-3 py-2 cursor-pointer transition-colors flex items-start gap-2 ${selected ? "bg-orange-100 border border-orange-300" : "bg-orange-50 border border-orange-100 hover:border-orange-200"}`}
                      >
                        <div className={`mt-0.5 h-4 w-4 shrink-0 rounded border-2 flex items-center justify-center transition-colors ${selected ? "border-orange-500 bg-orange-500" : "border-orange-300 bg-white"}`}>
                          {selected && <svg className="h-2.5 w-2.5 text-white" viewBox="0 0 10 10" fill="none"><path d="M2 5l2.5 2.5L8 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>}
                        </div>
                        <p className="text-xs text-gray-700 leading-snug">{gap}</p>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* UGC brief — one line per negative point */}
            {peecData && peecData.ugcBrief && (
              <div className="space-y-2">
                <div>
                  <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide">What AI says negatively about {brandName}</p>
                  <p className="text-xs text-gray-400 mt-0.5">AI is telling people this about your brand. Create real customer stories to change this narrative.</p>
                </div>
                <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
                  {peecData.ugcBrief.split("|||").filter(Boolean).map((line, i) => {
                    const selected = selectedPeecSignals.ugcBrief.has(i);
                    return (
                      <div
                        key={i}
                        onClick={() => togglePeec("ugcBrief", i)}
                        className={`flex items-center gap-2 rounded-lg px-3 py-2 cursor-pointer transition-colors ${selected ? "bg-red-100 border border-red-300" : "bg-red-50 border border-red-100 hover:border-red-200"}`}
                      >
                        <div className={`h-4 w-4 shrink-0 rounded border-2 flex items-center justify-center transition-colors ${selected ? "border-red-500 bg-red-500" : "border-red-300 bg-white"}`}>
                          {selected && <svg className="h-2.5 w-2.5 text-white" viewBox="0 0 10 10" fill="none"><path d="M2 5l2.5 2.5L8 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>}
                        </div>
                        <p className="text-xs text-gray-700 leading-none truncate">{line.trim()}</p>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {totalSelected > 0
              ? <p className="text-xs text-purple-600 font-medium pt-1">{totalSelected} signal{totalSelected !== 1 ? "s" : ""} selected — will be used in idea generation</p>
              : <p className="text-xs text-gray-400 pt-1">Click any item above to include it in your idea generation.</p>
            }
          </div>}
        </div>
      )}

      {/* Generate card */}
      <div className="rounded-2xl border border-primary/20 bg-gradient-to-br from-indigo-50 to-purple-50 p-4">
        <div className="text-center space-y-3">
          <div className="flex justify-center">
            <div className="p-2 rounded-full bg-purple-100">
              <Sparkles className="h-5 w-5 text-purple-600" />
            </div>
          </div>
          <button
            onClick={handleGenerate}
            disabled={generating || !brandName}
            className="flex items-center gap-1.5 mx-auto px-4 py-1.5 text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 rounded-full disabled:opacity-50 transition-colors"
          >
            {generating
              ? <><div className="animate-spin rounded-full h-3.5 w-3.5 border-b-2 border-white" />Generating...</>
              : <><Sparkles className="h-3.5 w-3.5" />Generate with Gemini 3</>
            }
          </button>
          {genError && <p className="text-xs text-red-500">{genError}</p>}
        </div>
      </div>

      {/* Generated ideas */}
      {ideas.length > 0 && (
        <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-gray-800 flex items-center gap-1.5">
              <Lightbulb className="h-4 w-4 text-yellow-500" />
              {ideas.length} Post Ideas Generated
            </p>
            <span className="text-xs text-gray-400">Click bookmark to save</span>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {ideas.map((idea, i) => (
              <IdeaCard key={idea.id} idea={idea} index={i + 1} campaignPlatforms={platforms} onSave={() => saveIdea(idea)} onDelete={() => setIdeas(prev => prev.filter(x => x.id !== idea.id))} variant="suggestion" />
            ))}
          </div>
        </div>
      )}

      {/* Saved ideas */}
      {savedIdeas.length > 0 && (
        <div className="rounded-2xl border border-emerald-100 bg-white p-4 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-gray-800 flex items-center gap-1.5">
              <span className="text-base">🔖</span>
              Saved Ideas ({savedIdeas.length})
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {savedIdeas.map((idea, i) => (
              <IdeaCard key={idea.id} idea={idea} index={i + 1} campaignPlatforms={platforms} onSave={() => unsaveIdea(idea.id)} onDelete={() => unsaveIdea(idea.id)} variant="saved" />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function IdeaCard({ idea, index, campaignPlatforms, onSave, onDelete, variant }: {
  idea: PostIdea & { peecSource?: string | null; peecSignal?: string };
  index: number;
  campaignPlatforms: string[];
  onSave: () => void;
  onDelete: () => void;
  variant: "suggestion" | "saved";
}) {
  const [showStrategy, setShowStrategy] = useState(false);
  const [copied, setCopied] = useState(false);
  // Selected platforms per card — default to all campaign platforms selected
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>(campaignPlatforms);

  function togglePlatform(p: string) {
    setSelectedPlatforms((prev) =>
      prev.includes(p) ? prev.filter((x) => x !== p) : [...prev, p]
    );
  }

  function copyCaption() {
    navigator.clipboard.writeText(`${idea.hook}\n\n${idea.caption}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <div className={`rounded-2xl border shadow-sm text-gray-900 overflow-hidden transition-colors ${variant === "saved" ? "border-green-300 bg-green-50" : "border-gray-100 bg-white"}`}>
      <div className="p-4">
        {/* Top row: badges left, checkbox right */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="bg-blue-100 text-blue-700 font-medium rounded-full px-2.5 py-0.5 text-xs">
              Post {index}
            </span>
            {idea.contentType && (
              <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${CONTENT_TYPE_COLORS[idea.contentType] ?? "bg-gray-100 text-gray-700"}`}>
                {idea.contentType}
              </span>
            )}
            {idea.peecSource === "reputation_fix" && (
              <span
                className="bg-red-100 text-red-700 rounded-full px-2.5 py-0.5 text-xs font-semibold"
                title={idea.peecSignal ?? "Counters a negative AI narrative about this brand"}
              >
                ⚡ Peec · Reputation Fix
              </span>
            )}
            {idea.peecSource === "ai_visibility" && (
              <span
                className="bg-purple-100 text-purple-700 rounded-full px-2.5 py-0.5 text-xs font-semibold"
                title={idea.peecSignal ?? "Addresses a real AI question about this brand"}
              >
                ⚡ Peec · AI Visibility
              </span>
            )}
          </div>
          {/* Checkbox */}
          <div
            onClick={onSave}
            className={`w-5 h-5 rounded border-2 flex items-center justify-center cursor-pointer transition-colors shrink-0 mt-0.5 ${
              variant === "saved" ? "border-indigo-500 bg-indigo-500" : "border-gray-300 hover:border-indigo-400"
            }`}
          >
            {variant === "saved" && (
              <svg className="h-3 w-3 text-white" viewBox="0 0 10 10" fill="none">
                <path d="M2 5l2.5 2.5L8 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            )}
          </div>
        </div>

        {/* Title + description */}
        <div className="space-y-1.5 mb-4">
          <h4 className="font-semibold text-base leading-snug">{idea.title}</h4>
          <p className="text-sm text-gray-600 leading-relaxed">
            {idea.hook ? `${idea.hook} ${idea.caption}` : idea.caption}
          </p>
        </div>

        {/* Strategy details collapse */}
        {showStrategy && (
          <div className="mb-4 bg-gray-50 rounded-xl p-3 space-y-2 text-xs border border-gray-100">
            {idea.pillar && (
              <div className="flex items-start gap-2">
                <span className="text-gray-500 font-medium whitespace-nowrap">🏛️ Pillar:</span>
                <span className="bg-slate-100 text-slate-700 rounded-full px-2 py-0.5">{idea.pillar}</span>
              </div>
            )}
            {idea.hook && (
              <div className="flex items-start gap-2">
                <span className="text-gray-500 font-medium whitespace-nowrap">🪝 Hook:</span>
                <span className="text-gray-700 italic">"{idea.hook}"</span>
              </div>
            )}
            {idea.peecSignal && (
              <div className="flex items-start gap-2">
                <span className="text-gray-500 font-medium whitespace-nowrap">
                  {idea.peecSource === "reputation_fix" ? "🛡️ Counters:" : "🎯 Addresses:"}
                </span>
                <span className="text-gray-700 leading-snug">{idea.peecSignal}</span>
              </div>
            )}
          </div>
        )}

        {/* Platform badges */}
        <div className="flex flex-wrap gap-1.5 mb-4">
          {idea.platform.split(/[,/]/).map((p) => p.trim()).filter(Boolean).map((p) => (
            <span key={p} className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium ${PLATFORM_COLORS[p] ?? PLATFORM_COLORS[idea.platform] ?? "bg-slate-100 text-slate-700"}`}>
              {p}
            </span>
          ))}
        </div>

        {/* Bottom action bar */}
        <div className="flex items-center justify-between pt-3 border-t border-gray-100">
          <button
            onClick={() => setShowStrategy(!showStrategy)}
            className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-700 transition-colors h-7 px-1"
          >
            <Target className="h-3 w-3" />
            Strategy details
          </button>
          <div className="flex items-center gap-0.5">
            <button
              onClick={copyCaption}
              title="Copy"
              className="h-7 w-7 flex items-center justify-center rounded-md text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
            >
              {copied
                ? <svg className="h-3.5 w-3.5 text-emerald-500" viewBox="0 0 10 10" fill="none"><path d="M2 5l2.5 2.5L8 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
                : <Copy className="h-3.5 w-3.5" />
              }
            </button>
            <button title="Schedule" className="h-7 w-7 flex items-center justify-center rounded-md text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors">
              <Calendar className="h-3.5 w-3.5" />
            </button>
            <button title="Edit" className="h-7 w-7 flex items-center justify-center rounded-md text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors">
              <Edit2 className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={onDelete}
              title="Delete"
              className="h-7 w-7 flex items-center justify-center rounded-md text-gray-400 hover:bg-red-50 hover:text-red-500 transition-colors"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
