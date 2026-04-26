import { useState, useEffect } from "react";
import {
  Sparkles, Copy, Check, Edit2, Save, X, RefreshCw, ChevronRight,
  Loader2, CheckCircle, FileText, Trash2
} from "lucide-react";
import { generatePostContent } from "@/server/brand.functions";
import type { PostIdea, GeneratedPost } from "@/server/brand.functions";
import { loadBrandProfile, loadPostIdeationState } from "@/hooks/use-brand-store";
import { getPlatformIcon } from "@/utils/platformIcons";

// Highlight key phrases from a PEEC signal within text
function HighlightedText({ text, peecSignal }: { text: string; peecSignal?: string }) {
  if (!peecSignal || !text) return <span className="whitespace-pre-wrap">{text}</span>;

  // Extract 2-4 word phrases from the peec signal to highlight
  const words = peecSignal
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length > 4);

  // Build 2-word phrases
  const phrases: string[] = [];
  for (let i = 0; i < words.length - 1; i++) {
    phrases.push(words[i] + " " + words[i + 1]);
  }
  // Also add individual long words (>6 chars)
  words.filter((w) => w.length > 6).forEach((w) => phrases.push(w));

  if (phrases.length === 0) return <span className="whitespace-pre-wrap">{text}</span>;

  // Build regex from top phrases (limit to 6)
  const escaped = phrases.slice(0, 6).map((p) => p.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"));
  const regex = new RegExp(`(${escaped.join("|")})`, "gi");
  const parts = text.split(regex);

  return (
    <span className="whitespace-pre-wrap">
      {parts.map((part, i) =>
        regex.test(part)
          ? <mark key={i} className="bg-yellow-100 text-yellow-900 rounded px-0.5 not-italic font-medium">{part}</mark>
          : <span key={i}>{part}</span>
      )}
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
      // Restore previously generated posts
      try {
        const stored = localStorage.getItem("socialflow.generated_posts");
        if (stored) setPosts(JSON.parse(stored));
      } catch { /* ignore */ }
    })();
  }, []);

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
        setPosts((prev) => {
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
          const existing = prev.find((p) => p.ideaId === idea.id);
          if (existing) {
            return prev.map((p) => p.ideaId === idea.id ? { ...p, ...newPost } : p);
          }
          return [...prev, newPost];
        });
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
    setPosts((prev) => prev.map((p) => p.ideaId === ideaId ? { ...p, approved: !p.approved } : p));
  }

  function deletePost(ideaId: string) {
    setPosts((prev) => prev.filter((p) => p.ideaId !== ideaId));
  }

  function updateContent(ideaId: string, content: string) {
    setPosts((prev) => prev.map((p) => p.ideaId === ideaId ? { ...p, content } : p));
  }

  function handleSave() {
    setIsSaving(true);
    try {
      localStorage.setItem("socialflow.generated_posts", JSON.stringify(posts));
    } catch { /* ignore */ }
    setIsSaving(false);
    setSavedToast(true);
    setTimeout(() => setSavedToast(false), 3500);
  }

  const approvedCount = posts.filter((p) => p.approved).length;

  return (
    <div className="space-y-4 pb-16">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Post Generation</h1>
        <p className="mt-1 text-sm text-slate-500">
          Generate full post content from your selected ideas using Gemini.
        </p>
      </div>

      {savedIdeas.length > 0 && (
        <div className="flex flex-col items-center gap-4 mt-40">
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
          {approvedCount > 0 && (
            <p className="text-xs text-emerald-600 font-medium px-1">{approvedCount} of {posts.length} approved</p>
          )}
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
        <div className="flex justify-end">
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold px-5 py-2.5 rounded-full shadow-sm transition-all disabled:opacity-70"
          >
            {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
            {isSaving ? "Saving…" : "Save"}
            {!isSaving && <ChevronRight className="w-4 h-4" />}
          </button>
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
}: {
  label: string;
  content: string;
  borderColor: string;
  peecSignal?: string;
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
              ? <><p className="font-semibold text-gray-900 mb-1">{headline}</p><HighlightedText text={body} peecSignal={peecSignal} /></>
              : <HighlightedText text={body} peecSignal={peecSignal} />
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
}: {
  post: GeneratedPost;
  idea: PostIdea | undefined;
  index: number;
  isRegenerating: boolean;
  onRegenerate: () => void;
  onApprove: () => void;
  onDelete: () => void;
  onContentChange: (c: string) => void;
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
      ${post.approved ? "border-emerald-300 ring-1 ring-emerald-200" : "border-gray-100 hover:border-gray-200 hover:shadow-md"}`}>

      {/* ── Compact header (matches SocialFlow card top) ── */}
      <div className="p-5">
        {/* Row 1: Post badge + approve checkbox + delete */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="bg-blue-50 text-blue-700 text-xs font-semibold px-2.5 py-0.5 rounded-full">
              Post {index}
            </span>
            {post.peecSource === "ai_visibility" && (
              <span className="bg-purple-100 text-purple-700 text-[11px] font-semibold px-2 py-0.5 rounded-full">⚡ AI Visibility</span>
            )}
            {post.peecSource === "reputation_fix" && (
              <span className="bg-red-100 text-red-700 text-[11px] font-semibold px-2 py-0.5 rounded-full">⚡ Reputation Fix</span>
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
        {/* Slide boxes — Slide 1, Slide 2 ... */}
        {hasSlides && post.slides!.map((slide, i) => (
          <ContentBox
            key={i}
            label={`Slide ${i + 1}`}
            content={slide.content}
            borderColor="border-l-blue-500"
            peecSignal={post.peecSignal}
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
                  ? <HighlightedText text={post.content} peecSignal={post.peecSignal} />
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
