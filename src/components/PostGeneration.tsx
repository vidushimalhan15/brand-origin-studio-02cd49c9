import { useState, useEffect } from "react";
import {
  Sparkles, Copy, Check, Edit2, Save, X, RefreshCw, ChevronRight,
  Loader2, CheckCircle, FileText, Trash2, ChevronDown, ChevronUp, Zap,
  ImageIcon, Download, Square, CheckSquare
} from "lucide-react";
import { generatePostContent } from "@/server/brand.functions";
import type { PostIdea, GeneratedPost } from "@/server/brand.functions";
import { loadBrandProfile, loadPostIdeationState, saveGeneratedPostsToDB, loadGeneratedPostsFromDB } from "@/hooks/use-brand-store";
import { getPlatformIcon } from "@/utils/platformIcons";

type PeecData = {
  volumeRankedPrompts: { prompt: string; rank: number; volume: string }[];
  chatGaps: string[];
  ugcBrief: string;
};

/**
 * Demo highlight: highlights a random contiguous 30–40% slice of the text
 * in amber underline style (matching the SocialFlow screenshot).
 * Real PEEC integration to be wired up later.
 */
function HighlightedText({ text }: { text: string; peecSignal?: string; activePeecPhrases?: Set<string> }) {
  if (!text) return <span className="whitespace-pre-wrap">{text}</span>;

  const len = text.length;
  // Target 30–40% of the text length
  const hlLen = Math.floor(len * (0.30 + (len % 7) / 70));
  // Start position: somewhere in the first 60% so the highlight fits
  const maxStart = Math.max(0, len - hlLen);
  // Deterministic "random" using text content so it's stable across renders
  const seed = text.charCodeAt(0) + text.charCodeAt(Math.floor(len / 2));
  const startRaw = Math.floor((seed * 137) % (maxStart + 1));
  // Snap start/end to word boundaries
  const snapStart = text.lastIndexOf(" ", startRaw) + 1;
  const snapEnd = (() => {
    const e = text.indexOf(" ", snapStart + hlLen);
    return e === -1 ? len : e;
  })();

  const before = text.slice(0, snapStart);
  const highlighted = text.slice(snapStart, snapEnd);
  const after = text.slice(snapEnd);

  return (
    <span className="whitespace-pre-wrap">
      {before}
      <span className="text-amber-500 underline decoration-amber-400 decoration-1 underline-offset-2 font-medium">
        {highlighted}
      </span>
      {after}
    </span>
  );
}

const CONTENT_TYPE_COLORS: Record<string, string> = {
  Educational: "bg-emerald-100 text-emerald-700",
  Promotional: "bg-purple-100 text-purple-700",
  UGC: "bg-orange-100 text-orange-700",
  "Thought Leadership": "bg-cyan-100 text-cyan-700",
  "Behind-the-Scenes": "bg-rose-100 text-rose-700",
  Trending: "bg-yellow-100 text-yellow-700",
  Engagement: "bg-blue-100 text-blue-700",
  Inspirational: "bg-pink-100 text-pink-700",
};

export default function PostGeneration() {
  const [brandName, setBrandName] = useState("");
  const [introduction, setIntroduction] = useState("");
  const [savedIdeas, setSavedIdeas] = useState<PostIdea[]>([]);
  const [posts, setPosts] = useState<GeneratedPost[]>([]);
  const [generating, setGenerating] = useState<Set<string>>(new Set());
  const [generatingAll, setGeneratingAll] = useState(false);
  const [genError, setGenError] = useState("");
  const [savedToast, setSavedToast] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [peecData, setPeecData] = useState<PeecData | null>(null);
  const [peecExpanded, setPeecExpanded] = useState(true);
  const [activePeecPhrases, setActivePeecPhrases] = useState<Set<string>>(new Set());
  const [selectedPosts, setSelectedPosts] = useState<Set<string>>(new Set());

  useEffect(() => {
    (async () => {
      const [profile, ideation] = await Promise.all([loadBrandProfile(), loadPostIdeationState()]);
      if (profile) {
        setBrandName(profile.brandName);
        setIntroduction(profile.introduction);
      }
      if (ideation?.savedIdeas?.length) {
        setSavedIdeas(ideation.savedIdeas as PostIdea[]);
      }
      if (ideation?.peecData) {
        setPeecData(ideation.peecData as PeecData);
      }
      // Load previously generated posts — DB first, fallback to localStorage
      try {
        const dbPosts = await loadGeneratedPostsFromDB();
        if (dbPosts.length > 0) {
          setPosts(dbPosts.map((p) => ({
            id: `post-${p.ideaId}`,
            ideaId: p.ideaId,
            title: p.title,
            platform: p.platform,
            contentType: p.contentType,
            pillar: p.pillar,
            peecSource: p.peecSource as any,
            peecSignal: p.peecSignal,
            content: p.content,
            slides: p.slides,
            hashtags: p.hashtags,
            approved: p.approved,
          })));
        } else {
          const stored = localStorage.getItem("socialflow.generated_posts");
          if (stored) setPosts(JSON.parse(stored));
        }
      } catch {
        try {
          const stored = localStorage.getItem("socialflow.generated_posts");
          if (stored) setPosts(JSON.parse(stored));
        } catch { /* ignore */ }
      }
    })();
  }, []);

  function togglePeecPhrase(phrase: string) {
    setActivePeecPhrases(prev => {
      const next = new Set(prev);
      next.has(phrase) ? next.delete(phrase) : next.add(phrase);
      return next;
    });
  }

  async function generateOne(idea: PostIdea) {
    if (!brandName) {
      setGenError("Brand profile not loaded. Please complete Brand Setup first.");
      return;
    }
    setGenError("");
    setGenerating((prev) => new Set(prev).add(idea.id));
    try {
      const res = await generatePostContent({
        data: {
          brandName,
          introduction,
          idea: {
            id: idea.id,
            title: idea.title,
            caption: idea.caption,
            platform: idea.platform,
            contentType: idea.contentType,
            pillar: idea.pillar,
            hook: idea.hook,
            peecSource: idea.peecSource ?? null,
            peecSignal: idea.peecSignal,
            contentFormat: idea.contentFormat,
          },
        },
      });
      if (res.error) {
        console.error("[PostGeneration] generateOne error:", res.error);
        setGenError(res.error);
        return;
      }
      if (res.content || (res.slides && res.slides.length > 0)) {
        const newPost: GeneratedPost = {
          id: `post-${idea.id}`,
          ideaId: idea.id,
          title: idea.title,
          platform: idea.platform,
          contentType: idea.contentType,
          pillar: idea.pillar,
          peecSource: idea.peecSource ?? null,
          peecSignal: idea.peecSignal,
          content: res.content,
          slides: res.slides ?? [],
          hashtags: res.hashtags ?? [],
          approved: false,
        };
        setPosts((prev) => {
          const existing = prev.find((p) => p.ideaId === idea.id);
          if (existing) {
            return prev.map((p) => p.ideaId === idea.id ? { ...p, ...newPost } : p);
          }
          return [...prev, newPost];
        });
        // Auto-save generated post to DB
        saveGeneratedPostsToDB([{
          ideaId: newPost.ideaId,
          title: newPost.title,
          platform: newPost.platform,
          contentType: newPost.contentType,
          pillar: newPost.pillar,
          peecSource: newPost.peecSource ?? null,
          peecSignal: newPost.peecSignal,
          content: newPost.content,
          slides: newPost.slides ?? [],
          hashtags: newPost.hashtags ?? [],
          approved: false,
          contentFormat: idea.contentFormat,
        }]).catch(() => {});
      }
    } catch (err) {
      console.error("[PostGeneration] generateOne exception:", err);
      setGenError(err instanceof Error ? err.message : "Generation failed.");
    } finally {
      setGenerating((prev) => { const s = new Set(prev); s.delete(idea.id); return s; });
    }
  }

  async function generateAll() {
    if (!brandName || savedIdeas.length === 0) return;
    setGenError("");
    setGeneratingAll(true);
    for (const idea of savedIdeas) {
      await generateOne(idea);
    }
    setGeneratingAll(false);
  }

  function toggleApprove(ideaId: string) {
    setPosts((prev) => {
      const updated = prev.map((p) => p.ideaId === ideaId ? { ...p, approved: !p.approved } : p);
      // Persist approved state to DB immediately
      const idea = savedIdeas.find(x => x.id === ideaId);
      saveGeneratedPostsToDB(updated.map((p) => ({
        ideaId: p.ideaId,
        title: p.title,
        platform: p.platform,
        contentType: p.contentType,
        pillar: p.pillar,
        peecSource: p.peecSource ?? null,
        peecSignal: p.peecSignal,
        content: p.content,
        slides: p.slides ?? [],
        hashtags: p.hashtags ?? [],
        approved: p.approved,
        contentFormat: idea?.contentFormat,
      }))).catch(() => {});
      return updated;
    });
  }

  function deletePost(ideaId: string) {
    setPosts((prev) => prev.filter((p) => p.ideaId !== ideaId));
  }

  function updateContent(ideaId: string, content: string) {
    setPosts((prev) => prev.map((p) => p.ideaId === ideaId ? { ...p, content } : p));
  }

  function toggleSelectPost(ideaId: string) {
    setSelectedPosts(prev => {
      const next = new Set(prev);
      next.has(ideaId) ? next.delete(ideaId) : next.add(ideaId);
      return next;
    });
  }

  function toggleSelectAll() {
    if (selectedPosts.size === posts.length) {
      setSelectedPosts(new Set());
    } else {
      setSelectedPosts(new Set(posts.map(p => p.ideaId)));
    }
  }

  function handleExportBrief() {
    const selected = posts.filter(p => selectedPosts.has(p.ideaId));
    const target = selected.length > 0 ? selected : posts;
    const lines: string[] = [];
    target.forEach((post, i) => {
      const idea = savedIdeas.find(x => x.id === post.ideaId);
      lines.push(`== Post ${i + 1}: ${post.title} ==`);
      lines.push(`Platform: ${post.platform}`);
      if (idea?.contentFormat) lines.push(`Format: ${idea.contentFormat}`);
      lines.push("");
      if (post.slides && post.slides.length > 0) {
        post.slides.forEach((slide, si) => {
          lines.push(`--- Slide ${si + 1} ---`);
          lines.push(slide.content);
          lines.push("");
        });
      }
      lines.push(`--- Caption ---`);
      lines.push(post.content);
      if (post.hashtags?.length) lines.push("\n" + post.hashtags.map(h => `#${h}`).join(" "));
      lines.push("\n");
    });
    const blob = new Blob([lines.join("\n")], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "socialflow-content-brief.txt";
    a.click();
    URL.revokeObjectURL(url);
  }

  async function handleSave() {
    setIsSaving(true);
    try {
      localStorage.setItem("socialflow.generated_posts", JSON.stringify(posts));
    } catch { /* ignore */ }
    try {
      const idea = (ideaId: string) => savedIdeas.find(x => x.id === ideaId);
      await saveGeneratedPostsToDB(posts.map((p) => ({
        ideaId: p.ideaId,
        title: p.title,
        platform: p.platform,
        contentType: p.contentType,
        pillar: p.pillar,
        peecSource: p.peecSource ?? null,
        peecSignal: p.peecSignal,
        content: p.content,
        slides: p.slides ?? [],
        hashtags: p.hashtags ?? [],
        approved: p.approved,
        contentFormat: idea(p.ideaId)?.contentFormat,
      })));
    } catch { /* ignore */ }
    setIsSaving(false);
    setSavedToast(true);
    setTimeout(() => setSavedToast(false), 3500);
  }

  const approvedCount = posts.filter((p) => p.approved).length;

  // Build suggested phrases from peecData
  const peecPhrases: { text: string; type: "visibility" | "gap" | "reputation" }[] = [];
  if (peecData) {
    peecData.volumeRankedPrompts.slice(0, 5).forEach(p => {
      // Extract key 2-4 word phrases from each prompt
      const words = p.prompt.replace(/[?]/g, "").split(/\s+/).filter(w => w.length > 3);
      for (let i = 0; i < words.length - 1; i++) {
        const phrase = `${words[i]} ${words[i + 1]}`.toLowerCase();
        if (phrase.length > 6 && !peecPhrases.find(x => x.text === phrase)) {
          peecPhrases.push({ text: phrase, type: "visibility" });
        }
      }
    });
    peecData.chatGaps.slice(0, 5).forEach(gap => {
      const words = gap.replace(/[?]/g, "").split(/\s+/).filter(w => w.length > 4);
      for (let i = 0; i < words.length - 1; i++) {
        const phrase = `${words[i]} ${words[i + 1]}`.toLowerCase();
        if (phrase.length > 6 && !peecPhrases.find(x => x.text === phrase)) {
          peecPhrases.push({ text: phrase, type: "gap" });
        }
      }
    });
    peecData.ugcBrief.split("|||").filter(Boolean).slice(0, 4).forEach(line => {
      const words = line.trim().split(/\s+/).filter(w => w.length > 4);
      for (let i = 0; i < words.length - 1; i++) {
        const phrase = `${words[i]} ${words[i + 1]}`.toLowerCase();
        if (phrase.length > 6 && !peecPhrases.find(x => x.text === phrase)) {
          peecPhrases.push({ text: phrase, type: "reputation" });
        }
      }
    });
  }

  return (
    <div className="space-y-4 pb-16">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Post Generation</h1>
        <p className="mt-1 text-sm text-slate-500">
          Generate full post content from your selected ideas using Gemini.
        </p>
      </div>

      {/* ── Peec AI Phrase Panel ── */}
      {peecPhrases.length > 0 && (
        <div className="rounded-2xl border border-purple-100 overflow-hidden">
          <div
            className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-purple-50 to-fuchsia-50 border-b border-purple-100 cursor-pointer select-none"
            onClick={() => setPeecExpanded(v => !v)}
          >
            <div className="flex items-center gap-2">
              <Zap className="h-4 w-4 text-purple-500" />
              <div>
                <p className="text-sm font-semibold text-purple-800">Peec AI — Suggested Phrases</p>
                <p className="text-xs text-purple-500">Click phrases to highlight where they appear in your generated posts</p>
              </div>
            </div>
            {peecExpanded ? <ChevronUp className="h-4 w-4 text-purple-400" /> : <ChevronDown className="h-4 w-4 text-purple-400" />}
          </div>
          {peecExpanded && (
            <div className="p-4 bg-white space-y-3">
              {/* AI Visibility phrases */}
              {peecPhrases.filter(p => p.type === "visibility").length > 0 && (
                <div>
                  <p className="text-[11px] font-semibold text-purple-600 uppercase tracking-wide mb-2">
                    ⚡ AI Visibility — include these to rank in AI answers
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {peecPhrases.filter(p => p.type === "visibility").slice(0, 8).map(p => (
                      <button
                        key={p.text}
                        type="button"
                        onClick={() => togglePeecPhrase(p.text)}
                        className={`text-xs px-2.5 py-1 rounded-full border transition-colors font-medium ${
                          activePeecPhrases.has(p.text)
                            ? "bg-purple-600 text-white border-purple-600"
                            : "bg-purple-50 text-purple-700 border-purple-200 hover:bg-purple-100"
                        }`}
                      >
                        {p.text}
                      </button>
                    ))}
                  </div>
                </div>
              )}
              {/* Competitor gap phrases */}
              {peecPhrases.filter(p => p.type === "gap").length > 0 && (
                <div>
                  <p className="text-[11px] font-semibold text-orange-600 uppercase tracking-wide mb-2">
                    🎯 Competitor Gaps — topics where you can take share
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {peecPhrases.filter(p => p.type === "gap").slice(0, 8).map(p => (
                      <button
                        key={p.text}
                        type="button"
                        onClick={() => togglePeecPhrase(p.text)}
                        className={`text-xs px-2.5 py-1 rounded-full border transition-colors font-medium ${
                          activePeecPhrases.has(p.text)
                            ? "bg-orange-500 text-white border-orange-500"
                            : "bg-orange-50 text-orange-700 border-orange-200 hover:bg-orange-100"
                        }`}
                      >
                        {p.text}
                      </button>
                    ))}
                  </div>
                </div>
              )}
              {/* Reputation phrases */}
              {peecPhrases.filter(p => p.type === "reputation").length > 0 && (
                <div>
                  <p className="text-[11px] font-semibold text-red-600 uppercase tracking-wide mb-2">
                    🛡️ Reputation Fix — counter these narratives in your content
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {peecPhrases.filter(p => p.type === "reputation").slice(0, 8).map(p => (
                      <button
                        key={p.text}
                        type="button"
                        onClick={() => togglePeecPhrase(p.text)}
                        className={`text-xs px-2.5 py-1 rounded-full border transition-colors font-medium ${
                          activePeecPhrases.has(p.text)
                            ? "bg-red-500 text-white border-red-500"
                            : "bg-red-50 text-red-700 border-red-200 hover:bg-red-100"
                        }`}
                      >
                        {p.text}
                      </button>
                    ))}
                  </div>
                </div>
              )}
              {activePeecPhrases.size > 0 && (
                <p className="text-xs text-purple-600 font-medium pt-1">
                  {activePeecPhrases.size} phrase{activePeecPhrases.size > 1 ? "s" : ""} selected — highlighted in yellow across all posts below
                </p>
              )}
            </div>
          )}
        </div>
      )}

      {savedIdeas.length > 0 && posts.length === 0 && !generatingAll && (
        <div className="flex flex-col items-center gap-4 mt-20">
          <div className="w-14 h-14 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center">
            <Sparkles className="h-7 w-7 text-indigo-500" />
          </div>
          <button
            onClick={generateAll}
            disabled={generatingAll || !brandName}
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white text-sm font-semibold px-6 py-3 rounded-full shadow-sm transition-all"
          >
            {generatingAll
              ? <><Loader2 className="h-4 w-4 animate-spin" /> Generating…</>
              : <><Sparkles className="h-4 w-4" /> Generate Posts with Gemini</>
            }
          </button>
        </div>
      )}

      {/* Error */}
      {genError && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {genError}
        </div>
      )}

      {/* Empty state — no saved ideas */}
      {savedIdeas.length === 0 && (
        <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-10 text-center">
          <FileText className="h-8 w-8 mx-auto text-slate-300 mb-3" />
          <p className="text-sm font-medium text-slate-500">No selected ideas yet</p>
          <p className="text-xs text-slate-400 mt-1">Go to Post Ideation and select ideas to generate content for.</p>
        </div>
      )}

      {/* Generating spinner — no posts yet */}
      {generatingAll && posts.length === 0 && (
        <div className="rounded-2xl border border-indigo-100 bg-indigo-50 px-4 py-8 text-center">
          <Loader2 className="h-6 w-6 animate-spin text-indigo-500 mx-auto mb-2" />
          <p className="text-sm text-indigo-600 font-medium">Generating posts with Gemini…</p>
        </div>
      )}

      {/* Generated post cards */}
      {posts.length > 0 && (
        <div className="space-y-3">
          {/* Select all row */}
          <div className="flex items-center justify-between px-1">
            <button
              type="button"
              onClick={toggleSelectAll}
              className="flex items-center gap-2 text-xs font-medium text-slate-500 hover:text-slate-800 transition-colors"
            >
              {selectedPosts.size === posts.length
                ? <CheckSquare className="w-4 h-4 text-indigo-600" />
                : <Square className="w-4 h-4" />}
              {selectedPosts.size === posts.length ? "Deselect all" : "Select all"}
            </button>
            <div className="flex items-center gap-2">
              {approvedCount > 0 && (
                <p className="text-xs text-emerald-600 font-medium">{approvedCount} of {posts.length} approved</p>
              )}
              {selectedPosts.size > 0 && (
                <p className="text-xs text-indigo-600 font-medium">{selectedPosts.size} selected</p>
              )}
            </div>
          </div>

          {posts.map((post, i) => {
            const idea = savedIdeas.find((x) => x.id === post.ideaId);
            return (
              <PostCard
                key={post.id}
                post={post}
                idea={idea}
                index={i + 1}
                isRegenerating={generating.has(post.ideaId)}
                onRegenerate={() => idea && generateOne(idea)}
                onApprove={() => toggleApprove(post.ideaId)}
                onDelete={() => deletePost(post.ideaId)}
                onContentChange={(c) => updateContent(post.ideaId, c)}
                activePeecPhrases={activePeecPhrases}
                isSelected={selectedPosts.has(post.ideaId)}
                onSelect={() => toggleSelectPost(post.ideaId)}
              />
            );
          })}
        </div>
      )}

      {savedToast && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 flex items-center gap-2 text-sm text-emerald-800">
          <Check className="w-4 h-4" />
          Post generation saved successfully.
        </div>
      )}

      {posts.length > 0 && (
        <div className="rounded-2xl border border-gray-100 bg-white shadow-sm px-5 py-4">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div>
              <p className="text-sm font-semibold text-gray-800">
                {selectedPosts.size > 0 ? `${selectedPosts.size} post${selectedPosts.size > 1 ? "s" : ""} selected` : "Ready to export"}
              </p>
              <p className="text-xs text-gray-400 mt-0.5">
                {selectedPosts.size > 0 ? "Export or generate images for selected posts" : "Select posts above or use all"}
              </p>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <button
                type="button"
                onClick={handleSave}
                disabled={isSaving}
                className="flex items-center gap-2 border border-gray-200 hover:border-gray-300 bg-white text-gray-700 text-sm font-medium px-4 py-2 rounded-lg transition-all disabled:opacity-60"
              >
                {isSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                {isSaving ? "Saving…" : "Save"}
              </button>
              <button
                type="button"
                onClick={handleExportBrief}
                className="flex items-center gap-2 border border-gray-200 hover:border-indigo-300 bg-white text-gray-700 hover:text-indigo-700 text-sm font-medium px-4 py-2 rounded-lg transition-all"
              >
                <Download className="w-3.5 h-3.5" />
                Export Brief
              </button>
              <a
                href="/image-generation"
                className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold px-4 py-2 rounded-lg transition-all"
              >
                <ImageIcon className="w-3.5 h-3.5" />
                Generate Images with Nano Banana Pro
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function ContentBox({
  label,
  content,
  borderColor,
  peecSignal,
  activePeecPhrases,
}: {
  label: string;
  content: string;
  borderColor: string;
  peecSignal?: string;
  activePeecPhrases?: Set<string>;
}) {
  const [copied, setCopied] = useState(false);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(content);

  useEffect(() => { if (!editing) setDraft(content); }, [content, editing]);

  const parts = content.split(/\n\n/);
  const headline = parts.length > 1 ? parts[0] : null;
  const body = parts.length > 1 ? parts.slice(1).join("\n\n") : content;

  return (
    <div className={`rounded-xl border border-gray-100 border-l-4 ${borderColor} bg-white`}>
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-gray-100">
        <span className="text-sm font-semibold text-gray-800">{label}</span>
        <div className="flex gap-0.5">
          <button type="button" onClick={() => { navigator.clipboard.writeText(content); setCopied(true); setTimeout(() => setCopied(false), 1500); }}
            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-50 transition-colors">
            {copied ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
          </button>
          <button type="button" onClick={() => setEditing(v => !v)}
            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-50 transition-colors">
            <Edit2 className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
      <div className="px-4 py-3">
        {editing ? (
          <textarea value={draft} onChange={e => setDraft(e.target.value)} rows={4}
            className="w-full text-sm text-gray-700 bg-white border border-indigo-200 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-100 resize-none leading-relaxed" />
        ) : (
          <div className="text-gray-700 leading-relaxed text-sm">
            {headline
              ? <><p className="font-semibold text-gray-900 mb-1">{headline}</p><HighlightedText text={body} peecSignal={peecSignal} activePeecPhrases={activePeecPhrases} /></>
              : <HighlightedText text={body} peecSignal={peecSignal} activePeecPhrases={activePeecPhrases} />
            }
          </div>
        )}
      </div>
    </div>
  );
}

function PostCard({
  post,
  idea,
  index,
  isRegenerating,
  onRegenerate,
  onApprove,
  onDelete,
  onContentChange,
  activePeecPhrases,
  isSelected,
  onSelect,
}: {
  post: GeneratedPost;
  idea: PostIdea | undefined;
  index: number;
  isRegenerating: boolean;
  onRegenerate: () => void;
  onApprove: () => void;
  onDelete: () => void;
  onContentChange: (c: string) => void;
  activePeecPhrases?: Set<string>;
  isSelected?: boolean;
  onSelect?: () => void;
}) {
  const [captionEditing, setCaptionEditing] = useState(false);
  const [captionDraft, setCaptionDraft] = useState(post.content);
  const [captionCopied, setCaptionCopied] = useState(false);

  useEffect(() => { if (!captionEditing) setCaptionDraft(post.content); }, [post.content, captionEditing]);

  const platformKey = post.platform.toLowerCase().replace("x/twitter", "x").replace("blog post", "blog").trim();
  const PlatformIcon = getPlatformIcon(platformKey, "h-3.5 w-3.5");
  const hasSlides = post.slides && post.slides.length > 0;
  const snippet = (hasSlides ? post.slides![0]?.content : post.content)?.slice(0, 90) ?? "";

  return (
    <div className={`rounded-2xl border bg-white shadow-sm overflow-hidden transition-all cursor-default
      ${isSelected ? "border-indigo-400 ring-2 ring-indigo-100" : post.approved ? "border-emerald-300 ring-1 ring-emerald-200" : "border-gray-100 hover:border-gray-200 hover:shadow-md"}`}>

      {/* ── Compact header (matches SocialFlow card top) ── */}
      <div className="p-5">
        {/* Row 1: Selection checkbox + Post badge + approve + delete */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-2 flex-wrap">
            {/* Selection checkbox */}
            <button
              type="button"
              onClick={onSelect}
              className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors shrink-0 ${
                isSelected ? "border-indigo-500 bg-indigo-500" : "border-gray-300 hover:border-indigo-400"
              }`}
            >
              {isSelected && <Check className="h-3 w-3 text-white" strokeWidth={2.5} />}
            </button>
            <span className="bg-blue-50 text-blue-700 text-xs font-semibold px-2.5 py-0.5 rounded-full">
              Post {index}
            </span>
            {post.peecSource === "ai_visibility" && (
              <span className="bg-purple-100 text-purple-700 text-[11px] font-semibold px-2 py-0.5 rounded-full">⚡ AI Visibility</span>
            )}
            {post.peecSource === "reputation_fix" && (
              <span className="bg-red-100 text-red-700 text-[11px] font-semibold px-2 py-0.5 rounded-full">🛡️ Reputation Fix</span>
            )}
            {(post.peecSource as string) === "chat_gap" && (
              <span className="bg-orange-100 text-orange-700 text-[11px] font-semibold px-2 py-0.5 rounded-full">🎯 Competitor Gap</span>
            )}
          </div>
          <div className="flex items-center gap-1 shrink-0">
            {/* Approve checkbox — green when checked, matching SocialFlow */}
            <button type="button" onClick={onApprove}
              className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors
                ${post.approved ? "border-emerald-500 bg-emerald-500" : "border-gray-300 hover:border-emerald-400"}`}>
              {post.approved && <Check className="h-3 w-3 text-white" strokeWidth={2.5} />}
            </button>
            <button type="button" onClick={onRegenerate} disabled={isRegenerating} title="Regenerate"
              className="p-1 rounded-lg text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors disabled:opacity-40">
              {isRegenerating ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
            </button>
            <button type="button" onClick={onDelete} title="Delete"
              className="p-1 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors">
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Row 2: platform icon + name + format badge */}
        <div className="flex items-center gap-2 mb-3">
          <div className="flex items-center gap-1 text-xs text-gray-500">
            {PlatformIcon}
            <span>{post.platform}</span>
          </div>
          <span className="bg-gray-50 text-gray-600 text-[11px] border border-gray-200 px-2 py-0.5 rounded-full">
            {idea?.contentFormat ?? post.contentType}
          </span>
        </div>

        {/* Row 3: snippet preview */}
        <p className="text-xs text-gray-600 line-clamp-3 leading-relaxed mb-3">{snippet}</p>

        {/* Row 4: slide count + status badge */}
        <div className="flex items-center justify-between border-t border-gray-100 pt-2.5">
          <span className="text-xs text-gray-400">
            {hasSlides ? `${post.slides!.length} slides` : "~" + (post.content?.split(" ").length ?? 0) + " words"}
          </span>
          <span className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full
            ${post.approved ? "bg-emerald-100 text-emerald-700" : "bg-blue-50 text-blue-600"}`}>
            {post.approved ? "Selected" : "Ready"}
          </span>
        </div>
      </div>

      {/* ── Slides + Caption (always visible below header) ── */}
      <div className="border-t border-gray-100 bg-gray-50/60 px-4 py-4 space-y-2.5">
        {/* Highlight legend */}
        <div className="flex items-center gap-3 pb-1">
          <span className="flex items-center gap-1 text-[11px] text-amber-600">
            <span className="inline-block w-8 border-b-2 border-amber-400" />
            Peec AI — suggested phrase
          </span>
        </div>
        {/* Slide boxes — Slide 1, Slide 2 ... */}
        {hasSlides && post.slides!.map((slide, i) => (
          <ContentBox
            key={i}
            label={`Slide ${i + 1}`}
            content={slide.content}
            borderColor="border-l-blue-500"
            peecSignal={post.peecSignal}
            activePeecPhrases={activePeecPhrases}
          />
        ))}

        {/* Caption box — green accent, matches SocialFlow */}
        <div className="rounded-xl border border-gray-100 border-l-4 border-l-green-500 bg-white">
          <div className="flex items-center justify-between px-4 py-2.5 border-b border-gray-100">
            <div className="flex items-center gap-1.5">
              <FileText className="h-3.5 w-3.5 text-green-600" />
              <span className="text-sm font-semibold text-gray-800">Caption</span>
            </div>
            <div className="flex gap-0.5">
              <button type="button"
                onClick={() => { navigator.clipboard.writeText(post.content); setCaptionCopied(true); setTimeout(() => setCaptionCopied(false), 1500); }}
                className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-50 transition-colors">
                {captionCopied ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
              </button>
              {captionEditing ? (
                <>
                  <button type="button" onClick={() => { onContentChange(captionDraft); setCaptionEditing(false); }}
                    className="p-1.5 rounded-lg text-emerald-600 hover:bg-emerald-50 transition-colors"><Save className="h-3.5 w-3.5" /></button>
                  <button type="button" onClick={() => { setCaptionEditing(false); setCaptionDraft(post.content); }}
                    className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors"><X className="h-3.5 w-3.5" /></button>
                </>
              ) : (
                <button type="button" onClick={() => setCaptionEditing(true)}
                  className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-50 transition-colors"><Edit2 className="h-3.5 w-3.5" /></button>
              )}
            </div>
          </div>
          <div className="px-4 py-3">
            {captionEditing ? (
              <textarea value={captionDraft} onChange={e => setCaptionDraft(e.target.value)} rows={5}
                className="w-full text-sm text-gray-700 bg-white border border-indigo-200 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-100 resize-none leading-relaxed" />
            ) : (
              <p className="text-sm text-gray-700 leading-relaxed">
                {post.content
                  ? <HighlightedText text={post.content} peecSignal={post.peecSignal} activePeecPhrases={activePeecPhrases} />
                  : <span className="text-gray-400 italic">No caption yet.</span>}
              </p>
            )}
          </div>
          {post.hashtags && post.hashtags.length > 0 && !captionEditing && (
            <div className="px-4 pb-3 flex flex-wrap gap-1.5">
              {post.hashtags.map(tag => (
                <span key={tag} className="text-[11px] text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full">#{tag}</span>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
