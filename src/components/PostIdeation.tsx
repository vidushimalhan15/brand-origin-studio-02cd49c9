import { useState, useEffect } from "react";
import { Sparkles, Lightbulb, TrendingUp, RefreshCw, ChevronUp, ChevronDown } from "lucide-react";
import { generatePostIdeas, fetchPeecInsights } from "@/server/brand.functions";
import type { PostIdea } from "@/server/brand.functions";
import { loadBrandProfile, loadLatestCampaignFromDB } from "@/hooks/use-brand-store";

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
      const [profile, campaign] = await Promise.all([loadBrandProfile(), loadLatestCampaignFromDB()]);
      if (profile) {
        setBrandName(profile.brandName);
        setIntroduction(profile.introduction);
        if (profile.brandName) fetchPeec(profile.brandName, profile.introduction);
      }
      if (campaign) {
        setPlatforms(campaign.selectedPlatforms ?? []);
        setContentPillars((campaign.contentPillars ?? []).filter(Boolean));
      }
    })();
  }, []);

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

    // Build peec context from selected signals
    const peecContext: string[] = [];
    if (peecData) {
      Array.from(selectedPeecSignals.prompts).forEach((i) => {
        const p = peecData.volumeRankedPrompts[i];
        if (p) peecContext.push(`AI question: ${p.prompt}`);
      });
      Array.from(selectedPeecSignals.chatGaps).forEach((i) => {
        if (peecData.chatGaps[i]) peecContext.push(`Content gap: ${peecData.chatGaps[i]}`);
      });
      if (selectedPeecSignals.ugcBrief.size > 0 && peecData.ugcBrief) {
        peecContext.push(`UGC brief: ${peecData.ugcBrief}`);
      }
    }

    const combinedContext = [...(trendingContext ? [trendingContext] : []), ...peecContext].join("\n\n");

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
      <div className="rounded-2xl border border-indigo-100 bg-gradient-to-br from-indigo-50 via-purple-50 to-fuchsia-50 p-5 space-y-4">
        {/* Context summary */}
        <div className="space-y-2">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Generating with</p>
          <div className="flex flex-wrap gap-1.5">
            {brandName
              ? <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-white border border-gray-200 text-gray-700 shadow-sm">{brandName}</span>
              : <span className="px-2.5 py-1 rounded-full text-xs bg-amber-50 border border-amber-200 text-amber-600">⚠ No brand set up</span>
            }
            {platforms.map((p) => (
              <span key={p} className={`px-2.5 py-1 rounded-full text-xs font-medium border border-transparent ${PLATFORM_COLORS[p] ?? "bg-slate-100 text-slate-700"}`}>{p}</span>
            ))}
            {contentPillars.filter(Boolean).map((p) => (
              <span key={p} className="px-2.5 py-1 rounded-full text-xs font-medium bg-indigo-100 text-indigo-700 border border-indigo-200">{p}</span>
            ))}
            {selectedTrendIds.length > 0 && (
              <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700 border border-blue-200 flex items-center gap-1">
                <TrendingUp className="h-3 w-3" />
                {selectedTrendIds.length} trend{selectedTrendIds.length !== 1 ? "s" : ""}
              </span>
            )}
            {totalSelected > 0 && (
              <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-700 border border-purple-200">
                ⚡ {totalSelected} Peec signal{totalSelected !== 1 ? "s" : ""}
              </span>
            )}
            {platforms.length === 0 && contentPillars.filter(Boolean).length === 0 && (
              <span className="text-xs text-gray-400 italic">Set up a campaign to add platforms & pillars</span>
            )}
          </div>
        </div>

        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-500">Posts to generate:</span>
            <span className="text-sm font-bold text-indigo-700">{numberOfPosts || 6}</span>
          </div>
          <button
            onClick={handleGenerate}
            disabled={generating || !brandName}
            className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 px-6 py-2.5 text-sm font-semibold text-white hover:from-indigo-700 hover:to-purple-700 disabled:opacity-50 transition-all shadow-sm hover:shadow-md"
          >
            {generating
              ? <><div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />Generating {numberOfPosts || 6} ideas…</>
              : <><Sparkles className="h-4 w-4" />Generate {numberOfPosts || 6} Post Ideas</>
            }
          </button>
        </div>

        {genError && (
          <p className="text-xs text-red-500 bg-red-50 border border-red-100 rounded-lg px-3 py-2">{genError}</p>
        )}
      </div>

      {/* Loading skeleton */}
      {generating && (
        <div className="rounded-2xl border border-gray-100 bg-white p-4 space-y-3">
          <div className="flex items-center gap-2">
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-indigo-400 border-t-transparent" />
            <span className="text-sm text-gray-500 animate-pulse">Crafting {numberOfPosts || 6} post ideas…</span>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {Array.from({ length: Math.min(numberOfPosts || 6, 4) }).map((_, i) => (
              <div key={i} className="rounded-xl border border-gray-100 p-3 space-y-2 animate-pulse">
                <div className="h-4 bg-gray-100 rounded w-3/4" />
                <div className="flex gap-1">
                  <div className="h-5 bg-gray-100 rounded-full w-16" />
                  <div className="h-5 bg-gray-100 rounded-full w-20" />
                </div>
                <div className="h-3 bg-gray-100 rounded w-full" />
                <div className="h-3 bg-gray-100 rounded w-5/6" />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Generated ideas */}
      {!generating && ideas.length > 0 && (
        <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-gray-800 flex items-center gap-1.5">
              <Lightbulb className="h-4 w-4 text-yellow-500" />
              {ideas.length} Post Ideas Generated
            </p>
            <span className="text-xs text-gray-400">Click bookmark to save</span>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {ideas.map((idea) => (
              <IdeaCard key={idea.id} idea={idea} onSave={() => saveIdea(idea)} variant="suggestion" />
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
            {savedIdeas.map((idea) => (
              <IdeaCard key={idea.id} idea={idea} onSave={() => unsaveIdea(idea.id)} variant="saved" />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function IdeaCard({ idea, onSave, variant }: {
  idea: PostIdea; onSave: () => void; variant: "suggestion" | "saved";
}) {
  const [copied, setCopied] = useState(false);

  function copyCaption() {
    navigator.clipboard.writeText(`${idea.hook}\n\n${idea.caption}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <div className={`rounded-xl border p-3.5 space-y-2.5 transition-shadow hover:shadow-sm ${
      variant === "saved"
        ? "border-emerald-200 bg-emerald-50/60"
        : "border-slate-200 bg-white hover:border-indigo-200"
    }`}>
      {/* Title + actions */}
      <div className="flex items-start justify-between gap-2">
        <span className="text-sm font-semibold text-slate-800 leading-snug">{idea.title}</span>
        <div className="flex items-center gap-1 shrink-0">
          <button
            onClick={copyCaption}
            title="Copy caption"
            className="w-6 h-6 rounded-md flex items-center justify-center text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
          >
            {copied
              ? <svg className="h-3.5 w-3.5 text-emerald-500" viewBox="0 0 10 10" fill="none"><path d="M2 5l2.5 2.5L8 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
              : <svg className="h-3.5 w-3.5" viewBox="0 0 16 16" fill="none"><rect x="5" y="5" width="8" height="8" rx="1.5" stroke="currentColor" strokeWidth="1.3"/><path d="M3 11V3h8" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/></svg>
            }
          </button>
          <button
            onClick={onSave}
            title={variant === "saved" ? "Remove" : "Save idea"}
            className={`w-6 h-6 rounded-md flex items-center justify-center transition-colors ${
              variant === "saved"
                ? "text-emerald-500 hover:bg-emerald-100"
                : "text-gray-400 hover:bg-indigo-50 hover:text-indigo-600"
            }`}
          >
            {variant === "saved"
              ? <svg className="h-3.5 w-3.5" viewBox="0 0 16 16" fill="currentColor"><path d="M3 2h10a1 1 0 011 1v11l-5-2.5L4 14V3a1 1 0 011-1z"/></svg>
              : <svg className="h-3.5 w-3.5" viewBox="0 0 16 16" fill="none"><path d="M3 2h10a1 1 0 011 1v11l-5-2.5L4 14V3a1 1 0 011-1z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round"/></svg>
            }
          </button>
        </div>
      </div>

      {/* Tags */}
      <div className="flex flex-wrap gap-1">
        <span className={`px-2 py-0.5 rounded-full text-[11px] font-medium ${PLATFORM_COLORS[idea.platform] ?? "bg-slate-100 text-slate-700"}`}>{idea.platform}</span>
        <span className={`px-2 py-0.5 rounded-full text-[11px] font-medium ${CONTENT_TYPE_COLORS[idea.contentType] ?? "bg-slate-100 text-slate-700"}`}>{idea.contentType}</span>
        {idea.pillar && <span className="px-2 py-0.5 rounded-full text-[11px] bg-indigo-50 text-indigo-600 border border-indigo-100">{idea.pillar}</span>}
      </div>

      {/* Hook */}
      {idea.hook && (
        <p className="text-xs font-medium text-slate-700 bg-slate-50 rounded-lg px-2.5 py-1.5 border border-slate-100 leading-snug">
          "{idea.hook}"
        </p>
      )}

      {/* Caption */}
      <p className="text-xs text-slate-500 leading-relaxed">{idea.caption}</p>
    </div>
  );
}
