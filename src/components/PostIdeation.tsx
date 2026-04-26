import { useState, useEffect } from "react";
import { Sparkles, Lightbulb, TrendingUp } from "lucide-react";
import { generatePostIdeas } from "@/server/brand.functions";
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

  const [numberOfPosts, setNumberOfPosts] = useState(6);
  const [ideas, setIdeas] = useState<PostIdea[]>([]);
  const [savedIdeas, setSavedIdeas] = useState<PostIdea[]>([]);
  const [generating, setGenerating] = useState(false);
  const [genError, setGenError] = useState("");

  useEffect(() => {
    (async () => {
      const [profile, campaign] = await Promise.all([loadBrandProfile(), loadLatestCampaignFromDB()]);
      if (profile) { setBrandName(profile.brandName); setIntroduction(profile.introduction); }
      if (campaign) {
        setPlatforms(campaign.selectedPlatforms ?? []);
        setContentPillars((campaign.contentPillars ?? []).filter(Boolean));
      }
    })();
  }, []);

  async function handleGenerate() {
    if (!brandName) { setGenError("Complete Brand Setup first."); return; }
    setGenerating(true);
    setGenError("");
    setIdeas([]);

    const allArticles = Object.values(trendsByPillar).flat();
    const trendingContext = selectedTrendIds
      .map((id) => { const a = allArticles.find((x) => x.id === id); return a ? `${a.title}: ${a.content}` : null; })
      .filter(Boolean)
      .join("\n\n");

    try {
      const res = await generatePostIdeas({
        data: { brandName, introduction, platforms, contentPillars, trendingContext, count: numberOfPosts || 6 },
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
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Post Ideation</h1>
        <p className="mt-1 text-sm text-slate-500">
          Generate AI-powered post ideas using your brand, campaign, and trending news selected in Campaigns.
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

      {/* Generate card */}
      <div className="rounded-2xl border border-primary/20 bg-gradient-to-br from-indigo-50 to-purple-50 p-5">
        <div className="flex flex-col items-center gap-3 text-center">
          <div className="p-2 rounded-full bg-purple-100">
            <Sparkles className="h-5 w-5 text-purple-600" />
          </div>

          {/* Context pills */}
          <div className="flex flex-wrap justify-center gap-1.5">
            {platforms.map((p) => (
              <span key={p} className={`px-2 py-0.5 rounded-full text-[11px] font-medium ${PLATFORM_COLORS[p] ?? "bg-slate-100 text-slate-700"}`}>{p}</span>
            ))}
            {contentPillars.filter(Boolean).map((p) => (
              <span key={p} className="px-2 py-0.5 rounded-full text-[11px] bg-indigo-100 text-indigo-700">{p}</span>
            ))}
            {selectedTrendIds.length > 0 && (
              <span className="px-2 py-0.5 rounded-full text-[11px] bg-blue-100 text-blue-700 flex items-center gap-1">
                <TrendingUp className="h-2.5 w-2.5" />
                {selectedTrendIds.length} trend{selectedTrendIds.length !== 1 ? "s" : ""} from Campaigns
              </span>
            )}
          </div>

          <button
            onClick={handleGenerate}
            disabled={generating || !brandName}
            className="flex items-center gap-1.5 rounded-full bg-purple-600 px-5 py-1.5 text-sm font-medium text-white hover:bg-purple-700 disabled:opacity-50 transition-colors"
          >
            {generating ? (
              <><div className="h-3.5 w-3.5 animate-spin rounded-full border-b-2 border-white" />Generating...</>
            ) : (
              <><Sparkles className="h-3.5 w-3.5" />Generate Ideas</>
            )}
          </button>

          {!brandName && <p className="text-xs text-amber-600">Complete Brand Setup first to generate ideas.</p>}
          {genError && <p className="text-xs text-red-500">{genError}</p>}
        </div>
      </div>

      {/* Generated ideas */}
      {ideas.length > 0 && (
        <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm space-y-3">
          <p className="text-sm font-semibold text-gray-800 flex items-center gap-1.5">
            <Lightbulb className="h-4 w-4 text-yellow-500" />
            Generated Post Ideas ({ideas.length})
            <span className="text-xs font-normal text-gray-400 ml-1">— click + to save</span>
          </p>
          <div className="grid gap-3 sm:grid-cols-2">
            {ideas.map((idea) => (
              <IdeaCard key={idea.id} idea={idea} onAdd={() => saveIdea(idea)} addLabel="+" variant="suggestion" />
            ))}
          </div>
        </div>
      )}

      {/* Saved ideas */}
      {savedIdeas.length > 0 && (
        <div className="rounded-2xl border border-emerald-100 bg-white p-4 shadow-sm space-y-3">
          <p className="text-sm font-semibold text-gray-800">Saved Ideas ({savedIdeas.length})</p>
          <div className="grid gap-3 sm:grid-cols-2">
            {savedIdeas.map((idea) => (
              <IdeaCard key={idea.id} idea={idea} onAdd={() => unsaveIdea(idea.id)} addLabel="×" variant="saved" />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function IdeaCard({ idea, onAdd, addLabel, variant }: {
  idea: PostIdea; onAdd: () => void; addLabel: string; variant: "suggestion" | "saved";
}) {
  return (
    <div className={`rounded-xl border p-3 space-y-2 ${variant === "saved" ? "border-emerald-200 bg-emerald-50" : "border-dashed border-slate-300 bg-slate-50"}`}>
      <div className="flex items-start justify-between gap-2">
        <span className="text-sm font-semibold text-slate-800 leading-snug">{idea.title}</span>
        <button
          onClick={onAdd}
          className={`shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-sm font-bold transition-colors ${variant === "saved" ? "bg-slate-200 text-slate-600 hover:bg-slate-300" : "bg-indigo-600 text-white hover:bg-indigo-700"}`}
        >
          {addLabel}
        </button>
      </div>
      <div className="flex flex-wrap gap-1">
        <span className={`px-2 py-0.5 rounded-full text-[11px] font-medium ${PLATFORM_COLORS[idea.platform] ?? "bg-slate-100 text-slate-700"}`}>{idea.platform}</span>
        <span className={`px-2 py-0.5 rounded-full text-[11px] font-medium ${CONTENT_TYPE_COLORS[idea.contentType] ?? "bg-slate-100 text-slate-700"}`}>{idea.contentType}</span>
        {idea.pillar && <span className="px-2 py-0.5 rounded-full text-[11px] bg-indigo-50 text-indigo-700">{idea.pillar}</span>}
      </div>
      {idea.hook && <p className="text-xs text-slate-600 italic">"{idea.hook}"</p>}
      <p className="text-xs text-slate-500 leading-relaxed">{idea.caption}</p>
    </div>
  );
}
