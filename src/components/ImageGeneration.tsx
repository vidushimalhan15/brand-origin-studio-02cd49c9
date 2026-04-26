import { useState, useEffect, useRef } from "react";
import {
  ImageIcon, Upload, Palette, Wand2, Download, RefreshCw,
  Loader2, Check, ChevronRight, X, Plus, Layers, Sparkles,
} from "lucide-react";
import { generateImageBannerbear } from "@/server/brand.functions";
import type { GeneratedPost } from "@/server/brand.functions";

// ── Types ────────────────────────────────────────────────────────────────────

type BrandStyle = {
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  fontStyle: "modern" | "classic" | "bold" | "minimal";
  logoUrl: string | null;
};

type GeneratedImage = {
  postId: string;
  slideIndex: number | null; // null = caption/single image
  label: string;
  text: string;
  imageUrl: string | null;
  status: "idle" | "generating" | "done" | "error";
  error?: string;
};

// ── Bannerbear template IDs — swap with real ones from your Bannerbear account ──
// These are placeholder IDs; the UI will show the real images once keys are set.
const DEMO_TEMPLATE_ID = "YOUR_BANNERBEAR_TEMPLATE_ID";

const FONT_OPTIONS = [
  { value: "modern", label: "Modern" },
  { value: "classic", label: "Classic" },
  { value: "bold", label: "Bold" },
  { value: "minimal", label: "Minimal" },
] as const;

// ── Brand Style Panel ────────────────────────────────────────────────────────

function ColorSwatch({ color, onChange, label }: { color: string; onChange: (c: string) => void; label: string }) {
  const ref = useRef<HTMLInputElement>(null);
  return (
    <div className="flex flex-col gap-1">
      <span className="text-[11px] text-gray-500 font-medium">{label}</span>
      <button
        type="button"
        onClick={() => ref.current?.click()}
        className="w-10 h-10 rounded-xl border-2 border-white shadow-md ring-1 ring-gray-200 transition-transform hover:scale-105"
        style={{ backgroundColor: color }}
        title={color}
      />
      <input
        ref={ref}
        type="color"
        value={color}
        onChange={e => onChange(e.target.value)}
        className="sr-only"
      />
      <span className="text-[10px] text-gray-400 font-mono">{color.toUpperCase()}</span>
    </div>
  );
}

function BrandStylePanel({
  style,
  onChange,
}: {
  style: BrandStyle;
  onChange: (s: BrandStyle) => void;
}) {
  const [logoPreview, setLogoPreview] = useState<string | null>(style.logoUrl);

  function handleLogoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    setLogoPreview(url);
    onChange({ ...style, logoUrl: url });
  }

  return (
    <div className="rounded-2xl border border-gray-100 bg-white shadow-sm overflow-hidden">
      <div className="flex items-center gap-2 px-5 py-4 border-b border-gray-100 bg-gradient-to-r from-indigo-50 to-purple-50">
        <Palette className="h-4 w-4 text-indigo-500" />
        <p className="text-sm font-semibold text-gray-800">Brand Style</p>
        <span className="ml-auto text-[11px] bg-indigo-100 text-indigo-600 px-2 py-0.5 rounded-full font-medium">Mock upload</span>
      </div>

      <div className="p-5 space-y-5">
        {/* Colors */}
        <div>
          <p className="text-xs font-semibold text-gray-600 mb-3">Brand Colours</p>
          <div className="flex gap-5">
            <ColorSwatch label="Primary" color={style.primaryColor} onChange={c => onChange({ ...style, primaryColor: c })} />
            <ColorSwatch label="Secondary" color={style.secondaryColor} onChange={c => onChange({ ...style, secondaryColor: c })} />
            <ColorSwatch label="Accent" color={style.accentColor} onChange={c => onChange({ ...style, accentColor: c })} />
          </div>
        </div>

        {/* Font */}
        <div>
          <p className="text-xs font-semibold text-gray-600 mb-2">Font Style</p>
          <div className="flex flex-wrap gap-2">
            {FONT_OPTIONS.map(f => (
              <button
                key={f.value}
                type="button"
                onClick={() => onChange({ ...style, fontStyle: f.value })}
                className={`text-xs px-3 py-1.5 rounded-lg border transition-colors font-medium ${
                  style.fontStyle === f.value
                    ? "bg-indigo-600 text-white border-indigo-600"
                    : "bg-white text-gray-600 border-gray-200 hover:border-indigo-300"
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {/* Logo upload */}
        <div>
          <p className="text-xs font-semibold text-gray-600 mb-2">Logo</p>
          <label className="flex items-center gap-3 cursor-pointer group">
            <div className="w-16 h-16 rounded-xl border-2 border-dashed border-gray-200 group-hover:border-indigo-300 flex items-center justify-center transition-colors overflow-hidden bg-gray-50">
              {logoPreview
                ? <img src={logoPreview} alt="Logo" className="w-full h-full object-contain p-1" />
                : <Upload className="h-5 w-5 text-gray-300 group-hover:text-indigo-400 transition-colors" />
              }
            </div>
            <div>
              <p className="text-xs text-gray-600 font-medium group-hover:text-indigo-600 transition-colors">
                {logoPreview ? "Change logo" : "Upload logo"}
              </p>
              <p className="text-[11px] text-gray-400">PNG or SVG recommended</p>
            </div>
            <input type="file" accept="image/*" className="sr-only" onChange={handleLogoUpload} />
          </label>
        </div>

        {/* Color preview strip */}
        <div className="flex gap-0 rounded-lg overflow-hidden h-3">
          <div className="flex-1" style={{ backgroundColor: style.primaryColor }} />
          <div className="flex-1" style={{ backgroundColor: style.secondaryColor }} />
          <div className="flex-1" style={{ backgroundColor: style.accentColor }} />
        </div>
      </div>
    </div>
  );
}

// ── Image Card ───────────────────────────────────────────────────────────────

function ImageCard({
  item,
  brandStyle,
  onGenerate,
}: {
  item: GeneratedImage;
  brandStyle: BrandStyle;
  onGenerate: (updated: GeneratedImage) => void;
}) {
  async function generate() {
    onGenerate({ ...item, status: "generating", error: undefined });

    const headline = item.text.split("\n")[0].slice(0, 80);
    const body = item.text.split("\n").slice(1).join(" ").slice(0, 200);
    const prompt = [
      `Create a professional social media post image.`,
      `Headline: ${headline}`,
      body ? `Body: ${body}` : "",
      `Brand primary color: ${brandStyle.primaryColor}, accent color: ${brandStyle.accentColor}.`,
      `Font style: ${brandStyle.fontStyle}. Clean, modern, on-brand design.`,
    ].filter(Boolean).join(" ");

    const res = await generateImageBannerbear({
      data: { prompt, aspectRatio: "1:1" },
    });

    if (res.error) {
      onGenerate({ ...item, status: "error", error: res.error });
    } else {
      onGenerate({ ...item, status: "done", imageUrl: res.imageUrl ?? null });
    }
  }

  return (
    <div className="rounded-xl border border-gray-100 bg-white overflow-hidden shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
        <div className="flex items-center gap-2">
          <Layers className="h-3.5 w-3.5 text-blue-500" />
          <span className="text-sm font-semibold text-gray-800">{item.label}</span>
        </div>
        <div className="flex items-center gap-1">
          {item.status === "done" && item.imageUrl && (
            <a
              href={item.imageUrl}
              download={`${item.label}.png`}
              target="_blank"
              rel="noreferrer"
              className="p-1.5 rounded-lg text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
              title="Download"
            >
              <Download className="h-3.5 w-3.5" />
            </a>
          )}
          <button
            type="button"
            onClick={generate}
            disabled={item.status === "generating"}
            className="p-1.5 rounded-lg text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors disabled:opacity-40"
            title="Generate image"
          >
            {item.status === "generating"
              ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
              : <RefreshCw className="h-3.5 w-3.5" />}
          </button>
        </div>
      </div>

      {/* Image area */}
      <div className="aspect-square bg-gray-50 flex items-center justify-center relative overflow-hidden">
        {item.status === "done" && item.imageUrl ? (
          <img src={item.imageUrl} alt={item.label} className="w-full h-full object-cover" />
        ) : item.status === "generating" ? (
          <div className="flex flex-col items-center gap-2">
            <Loader2 className="h-6 w-6 animate-spin text-indigo-400" />
            <p className="text-xs text-gray-400">Generating with Bannerbear…</p>
          </div>
        ) : item.status === "error" ? (
          <div className="flex flex-col items-center gap-2 px-4 text-center">
            <X className="h-6 w-6 text-red-400" />
            <p className="text-xs text-red-500">{item.error}</p>
            <button
              type="button"
              onClick={generate}
              className="text-xs text-indigo-600 underline mt-1"
            >
              Retry
            </button>
          </div>
        ) : (
          /* Idle — show mock preview using brand colours */
          <div
            className="w-full h-full flex flex-col items-center justify-center gap-3 p-6"
            style={{ backgroundColor: brandStyle.primaryColor + "22" }}
          >
            <div className="w-full rounded-lg p-4 text-center" style={{ backgroundColor: brandStyle.primaryColor }}>
              <p className="text-white text-xs font-bold leading-snug line-clamp-3">
                {item.text.split("\n")[0].slice(0, 60)}
              </p>
            </div>
            <p className="text-[11px] text-gray-500 line-clamp-2 text-center">
              {item.text.split("\n").slice(1).join(" ").slice(0, 80)}
            </p>
            <div className="flex gap-1 mt-1">
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: brandStyle.primaryColor }} />
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: brandStyle.secondaryColor }} />
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: brandStyle.accentColor }} />
            </div>
            <button
              type="button"
              onClick={generate}
              className="mt-1 flex items-center gap-1.5 text-xs bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1.5 rounded-full font-medium transition-colors"
            >
              <Wand2 className="h-3 w-3" />
              Generate
            </button>
          </div>
        )}
      </div>

      {/* Text snippet */}
      <div className="px-4 py-3 border-t border-gray-100">
        <p className="text-[11px] text-gray-500 line-clamp-2 leading-relaxed">{item.text.slice(0, 120)}</p>
      </div>
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────

const DEFAULT_BRAND_STYLE: BrandStyle = {
  primaryColor: "#4f46e5",
  secondaryColor: "#7c3aed",
  accentColor: "#06b6d4",
  fontStyle: "modern",
  logoUrl: null,
};

export default function ImageGeneration() {
  const [posts, setPosts] = useState<GeneratedPost[]>([]);
  const [brandStyle, setBrandStyle] = useState<BrandStyle>(() => {
    try {
      const s = localStorage.getItem("socialflow.brand_style");
      return s ? JSON.parse(s) : DEFAULT_BRAND_STYLE;
    } catch { return DEFAULT_BRAND_STYLE; }
  });
  const [images, setImages] = useState<GeneratedImage[]>([]);
  const [generatingAll, setGeneratingAll] = useState(false);

  // Load approved posts from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem("socialflow.generated_posts");
      if (stored) {
        const all: GeneratedPost[] = JSON.parse(stored);
        // Show approved posts first; if none approved show all
        const approved = all.filter(p => p.approved);
        setPosts(approved.length > 0 ? approved : all);
      }
    } catch { /* ignore */ }
  }, []);

  // Persist brand style
  useEffect(() => {
    try { localStorage.setItem("socialflow.brand_style", JSON.stringify(brandStyle)); } catch { /* ignore */ }
  }, [brandStyle]);

  // Build image items from posts
  useEffect(() => {
    const items: GeneratedImage[] = [];
    for (const post of posts) {
      if (post.slides && post.slides.length > 0) {
        post.slides.forEach((slide, i) => {
          items.push({
            postId: post.id,
            slideIndex: i,
            label: `${post.platform} — Slide ${i + 1}`,
            text: slide.content,
            imageUrl: null,
            status: "idle",
          });
        });
      } else {
        items.push({
          postId: post.id,
          slideIndex: null,
          label: `${post.platform} — Image`,
          text: post.content,
          imageUrl: null,
          status: "idle",
        });
      }
    }
    setImages(prev => {
      // Preserve existing status/imageUrl for items already generated
      return items.map(item => {
        const existing = prev.find(p => p.postId === item.postId && p.slideIndex === item.slideIndex);
        return existing ?? item;
      });
    });
  }, [posts]);

  function updateImage(postId: string, slideIndex: number | null, updated: GeneratedImage) {
    setImages(prev => prev.map(img =>
      img.postId === postId && img.slideIndex === slideIndex ? updated : img
    ));
  }

  async function generateAll() {
    setGeneratingAll(true);
    for (const item of images) {
      if (item.status === "done") continue;
      // Trigger one at a time to avoid rate limits
      await new Promise<void>(resolve => {
        const headline = item.text.split("\n")[0].slice(0, 80);
        const body = item.text.split("\n").slice(1).join(" ").slice(0, 200);
        const prompt = [
          `Create a professional social media post image.`,
          `Headline: ${headline}`,
          body ? `Body: ${body}` : "",
          `Brand primary color: ${brandStyle.primaryColor}, accent color: ${brandStyle.accentColor}.`,
          `Font style: ${brandStyle.fontStyle}. Clean, modern, on-brand design.`,
        ].filter(Boolean).join(" ");

        setImages(prev => prev.map(img =>
          img.postId === item.postId && img.slideIndex === item.slideIndex
            ? { ...img, status: "generating" } : img
        ));

        generateImageBannerbear({ data: { prompt, aspectRatio: "1:1" } }).then(res => {
          setImages(prev => prev.map(img =>
            img.postId === item.postId && img.slideIndex === item.slideIndex
              ? res.error
                ? { ...img, status: "error", error: res.error }
                : { ...img, status: "done", imageUrl: res.imageUrl ?? null }
              : img
          ));
          resolve();
        });
      });
    }
    setGeneratingAll(false);
  }

  const doneCount = images.filter(i => i.status === "done").length;

  return (
    <div className="space-y-6 pb-16">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Image Generation</h1>
        <p className="mt-1 text-sm text-slate-500">
          Turn your approved posts into visual assets using Gemini Imagen AI.
        </p>
      </div>

      {/* Brand Style */}
      <BrandStylePanel style={brandStyle} onChange={setBrandStyle} />

      {/* Empty state */}
      {posts.length === 0 && (
        <div className="rounded-2xl border border-dashed border-gray-200 bg-white p-12 text-center">
          <div className="flex flex-col items-center gap-4">
            <span className="text-5xl" style={{ filter: "drop-shadow(0 0 12px rgba(236,72,153,0.4))" }}>✦</span>
            <div>
              <p className="text-sm font-medium text-gray-500 mb-1">No posts loaded yet</p>
              <p className="text-xs text-gray-400">Go to Post Generation and save your posts first.</p>
            </div>
            <a
              href="/post-generation"
              className="mt-2 inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-semibold text-white"
              style={{ background: "linear-gradient(90deg, #ec4899, #f59e0b, #8b5cf6)" }}
            >
              <span>✦</span>
              Generate Image with Nano Banana Pro 2
            </a>
          </div>
        </div>
      )}

      {/* Generate All button */}
      {images.length > 0 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-500">
            {doneCount > 0
              ? `${doneCount} of ${images.length} images generated`
              : `${images.length} images ready to generate`}
          </p>
          <button
            type="button"
            onClick={generateAll}
            disabled={generatingAll}
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-sm font-semibold px-5 py-2.5 rounded-full shadow-sm transition-all"
          >
            {generatingAll
              ? <><Loader2 className="h-4 w-4 animate-spin" />Generating…</>
              : <><Wand2 className="h-4 w-4" />Generate All Images</>}
          </button>
        </div>
      )}

      {/* Image grid */}
      {images.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {images.map((item) => (
            <ImageCard
              key={`${item.postId}-${item.slideIndex}`}
              item={item}
              brandStyle={brandStyle}
              onGenerate={(updated) => updateImage(item.postId, item.slideIndex, updated)}
            />
          ))}
        </div>
      )}

      {/* Done banner */}
      {doneCount > 0 && doneCount === images.length && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 flex items-center gap-2 text-sm text-emerald-800">
          <Check className="w-4 h-4 text-emerald-600" />
          All {doneCount} images generated successfully. Click the download icon on each to save.
        </div>
      )}
    </div>
  );
}
