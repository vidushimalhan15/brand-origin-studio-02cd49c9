import { useState, useEffect } from "react";
import {
  Sparkles, Copy, Check, Edit2, Save, X, RefreshCw, ChevronRight,
  Loader2, CheckCircle, FileText, Trash2
} from "lucide-react";
import { generatePostContent } from "@/server/brand.functions";
import type { PostIdea, GeneratedPost } from "@/server/brand.functions";
import { loadBrandProfile, loadPostIdeationState } from "@/hooks/use-brand-store";
import { getPlatformIcon } from "@/utils/platformIcons";

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
          },
        },
      });
      if (res.error) {
        setGenError(res.error);
        return;
      }
      if (res.content) {
        setPosts((prev) => {
          const existing = prev.find((p) => p.ideaId === idea.id);
          if (existing) {
            return prev.map((p) => p.ideaId === idea.id ? { ...p, content: res.content } : p);
          }
          return [
            ...prev,
            {
              id: `post-${idea.id}`,
              ideaId: idea.id,
              title: idea.title,
              platform: idea.platform,
              contentType: idea.contentType,
              pillar: idea.pillar,
              peecSource: idea.peecSource ?? null,
              peecSignal: idea.peecSignal,
              content: res.content,
              approved: false,
            },
          ];
        });
      }
    } catch (err) {
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
          {posts.map((post) => {
            const idea = savedIdeas.find((i) => i.id === post.ideaId);
            return (
              <PostCard
                key={post.id}
                post={post}
                idea={idea}
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

function PostCard({
  post,
  idea,
  isRegenerating,
  onRegenerate,
  onApprove,
  onDelete,
  onContentChange,
}: {
  post: GeneratedPost;
  idea: PostIdea | undefined;
  isRegenerating: boolean;
  onRegenerate: () => void;
  onApprove: () => void;
  onDelete: () => void;
  onContentChange: (c: string) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(post.content);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!editing) setDraft(post.content);
  }, [post.content]);

  function saveEdit() {
    onContentChange(draft);
    setEditing(false);
  }

  function copyContent() {
    navigator.clipboard.writeText(post.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  const platformKey = post.platform.toLowerCase().replace("/twitter", "").replace("x/", "x").trim();
  const PlatformIcon = getPlatformIcon(platformKey, "h-3.5 w-3.5");

  return (
    <div className={`rounded-2xl border shadow-sm overflow-hidden transition-colors ${post.approved ? "border-emerald-200 bg-emerald-50/40" : "border-gray-100 bg-white"}`}>
      <div className="p-4">
        {/* Top row: badges + actions */}
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="flex items-center gap-1 bg-slate-100 text-slate-700 text-xs font-medium px-2.5 py-0.5 rounded-full">
              {PlatformIcon}
              {post.platform}
            </span>
            <span className={`text-xs font-medium px-2.5 py-0.5 rounded-full ${CONTENT_TYPE_COLORS[post.contentType] ?? "bg-gray-100 text-gray-700"}`}>
              {post.contentType}
            </span>
            {post.peecSource === "ai_visibility" && (
              <span className="bg-purple-100 text-purple-700 text-xs font-semibold px-2.5 py-0.5 rounded-full" title={post.peecSignal}>
                ⚡ AI Visibility
              </span>
            )}
            {post.peecSource === "reputation_fix" && (
              <span className="bg-red-100 text-red-700 text-xs font-semibold px-2.5 py-0.5 rounded-full" title={post.peecSignal}>
                ⚡ Reputation Fix
              </span>
            )}
            {post.approved && (
              <span className="flex items-center gap-1 bg-emerald-100 text-emerald-700 text-xs font-semibold px-2.5 py-0.5 rounded-full">
                <CheckCircle className="h-3 w-3" /> Approved
              </span>
            )}
          </div>

          <div className="flex items-center gap-1 shrink-0">
            <button onClick={onRegenerate} disabled={isRegenerating} title="Regenerate" className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors disabled:opacity-40">
              {isRegenerating ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />}
            </button>
            <button onClick={copyContent} title="Copy" className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-50 transition-colors">
              {copied ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
            </button>
            {editing ? (
              <>
                <button onClick={saveEdit} title="Save" className="p-1.5 rounded-lg text-emerald-600 hover:bg-emerald-50 transition-colors">
                  <Save className="h-3.5 w-3.5" />
                </button>
                <button onClick={() => { setEditing(false); setDraft(post.content); }} title="Cancel" className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors">
                  <X className="h-3.5 w-3.5" />
                </button>
              </>
            ) : (
              <button onClick={() => setEditing(true)} title="Edit" className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-50 transition-colors">
                <Edit2 className="h-3.5 w-3.5" />
              </button>
            )}
            <button
              onClick={onApprove}
              title={post.approved ? "Unapprove" : "Approve"}
              className={`p-1.5 rounded-lg transition-colors ${post.approved ? "text-emerald-600 bg-emerald-50 hover:bg-emerald-100" : "text-slate-400 hover:text-emerald-600 hover:bg-emerald-50"}`}
            >
              <CheckCircle className="h-3.5 w-3.5" />
            </button>
            <button onClick={onDelete} title="Delete" className="p-1.5 rounded-lg text-slate-300 hover:text-red-500 hover:bg-red-50 transition-colors">
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>

        {/* Title */}
        <p className="text-sm font-semibold text-gray-900 mb-2">{post.title}</p>

        {/* Content */}
        {editing ? (
          <textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            rows={6}
            className="w-full text-sm text-gray-700 bg-white border border-indigo-300 rounded-xl px-3 py-2.5 outline-none focus:ring-2 focus:ring-indigo-100 resize-none leading-relaxed"
          />
        ) : (
          <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">{post.content}</p>
        )}
      </div>
    </div>
  );
}
