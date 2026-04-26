import { useState, useEffect } from "react";
import { useServerFn } from "@tanstack/react-start";
import {
  Loader2,
  Globe,
  RefreshCw,
  Zap,
  TrendingUp,
  AlertCircle,
  ChevronDown,
  ChevronRight,
  Building2,
  CheckCircle2,
  Info,
  Smile,
  Users,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import {
  analyzeBrandUrl,
  fetchPeecInsights,
  type PeecInsightsFull,
} from "@/server/brand.functions";
import AudienceProfiles from "@/components/AudienceProfiles";
import ProductsServices from "@/components/ProductsServices";
import { Link } from "@tanstack/react-router";
import { saveBrandProfile, loadBrandProfile, loadAudiencesFromDB, loadProductsFromDB } from "@/hooks/use-brand-store";

function rankColor(rank: number) {
  if (rank <= 2) return "bg-emerald-500";
  if (rank <= 4) return "bg-amber-500";
  return "bg-rose-500";
}

function rankLabel(rank: number) {
  if (rank <= 2) return "High";
  if (rank <= 4) return "Medium";
  return "Low";
}

function sentimentColor(score: number) {
  if (score >= 70) return "text-emerald-600";
  if (score >= 40) return "text-amber-600";
  return "text-rose-600";
}

function sentimentLabel(score: number) {
  if (score >= 70) return "Positive";
  if (score >= 40) return "Neutral";
  return "Negative";
}

function getPeecInsightBullets(peec: PeecInsightsFull): string[] {
  const bullets: string[] = [];
  const sov = peec.visibility.shareOfVoice; // already a %
  const sentiment = peec.sentiment;
  const topCompetitor = peec.competitors[0];

  if (sov > 0) {
    if (sov >= 30) bullets.push(`Strong AI presence — your brand appears in ${sov.toFixed(1)}% of relevant AI-generated responses, putting you ahead of most competitors.`);
    else if (sov >= 15) bullets.push(`Moderate AI visibility at ${sov.toFixed(1)}% share of voice — there's clear room to grow your presence in AI-driven conversations.`);
    else bullets.push(`Low AI visibility at ${sov.toFixed(1)}% — your brand is underrepresented in AI responses. Content strategy can directly improve this.`);
  }

  if (sentiment > 0) {
    if (sentiment >= 70) bullets.push(`Positive brand perception (${sentiment}/100) — AI models associate your brand with quality. Double down on what's driving this.`);
    else if (sentiment >= 50) bullets.push(`Neutral sentiment (${sentiment}/100) — there's an opportunity to shift AI perception by publishing more authoritative, positive content.`);
    else bullets.push(`Below-average sentiment (${sentiment}/100) — consider content that addresses common concerns and builds trust signals.`);
  }

  if (topCompetitor) {
    const compSov = topCompetitor.shareOfVoice.toFixed(1);
    if (sov > topCompetitor.shareOfVoice) {
      bullets.push(`You outrank ${topCompetitor.name} (${compSov}%) in AI visibility — keep publishing consistent content to maintain this lead.`);
    } else {
      bullets.push(`${topCompetitor.name} leads with ${compSov}% share of voice — creating comparison or differentiation content could help close this gap.`);
    }
  }

  return bullets;
}

type SectionId = "brand" | "audience" | "products";

function SectionHeader({
  step,
  title,
  subtitle,
  isOpen,
  isComplete,
  onToggle,
  accentClass,
  stepBgClass,
}: {
  step: number;
  title: string;
  subtitle: string;
  isOpen: boolean;
  isComplete: boolean;
  onToggle: () => void;
  accentClass: string;
  stepBgClass: string;
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className="w-full flex items-center gap-4 text-left group"
    >
      <div
        className={cn(
          "flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl text-sm font-bold shadow-sm transition-all",
          isComplete
            ? "bg-emerald-500 text-white"
            : stepBgClass,
        )}
      >
        {isComplete ? (
          <CheckCircle2 className="h-4.5 w-4.5" />
        ) : (
          step
        )}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <h2 className="text-base font-semibold text-foreground">{title}</h2>
          {isComplete && (
            <span className="inline-flex items-center rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-emerald-700">
              Done
            </span>
          )}
        </div>
        <p className="text-xs text-muted-foreground mt-0.5">{subtitle}</p>
      </div>
      <div
        className={cn(
          "flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg border transition-all",
          isOpen
            ? `${accentClass} border-transparent`
            : "border-border bg-muted/40 text-muted-foreground group-hover:border-border/80",
        )}
      >
        {isOpen ? (
          <ChevronDown className="h-4 w-4" />
        ) : (
          <ChevronRight className="h-4 w-4" />
        )}
      </div>
    </button>
  );
}

export default function BrandIdentityStep() {
  const analyze = useServerFn(analyzeBrandUrl);
  const fetchPeec = useServerFn(fetchPeecInsights);

  const [url, setUrl] = useState("");
  const [analyzing, setAnalyzing] = useState(false);
  const [analyzeError, setAnalyzeError] = useState<string | null>(null);

  const [brandName, setBrandName] = useState("");
  const [intro, setIntro] = useState("");

  const [peec, setPeec] = useState<PeecInsightsFull | null>(null);
  const [peecLoading, setPeecLoading] = useState(false);
  const [peecError, setPeecError] = useState<string | null>(null);

  const [openSection, setOpenSection] = useState<SectionId>("brand");

  // Restore all data from Supabase on mount
  useEffect(() => {
    void (async () => {
      const [profile, audiences, products] = await Promise.all([
        loadBrandProfile(),
        loadAudiencesFromDB(),
        loadProductsFromDB(),
      ]);
      if (profile) {
        setBrandName(profile.brandName);
        setIntro(profile.introduction);
      }
      // Hydrate localStorage so child components pick it up
      if (audiences.length > 0) {
        window.localStorage.setItem("socialflow.audiences", JSON.stringify(audiences));
        window.dispatchEvent(new CustomEvent("brand-store-change", { detail: { key: "socialflow.audiences" } }));
      }
      if (products.length > 0) {
        window.localStorage.setItem("socialflow.products", JSON.stringify(products));
        window.dispatchEvent(new CustomEvent("brand-store-change", { detail: { key: "socialflow.products" } }));
      }
    })();
  }, []);

  const isBrandComplete = brandName.trim().length > 0 && intro.trim().length > 0;

  const toggleSection = (id: SectionId) => {
    setOpenSection((prev) => (prev === id ? "brand" : id));
  };

  const loadPeec = async (name: string, introduction: string) => {
    if (!name.trim() || !introduction.trim()) return;
    setPeecLoading(true);
    setPeecError(null);
    try {
      const result = await fetchPeec({ data: { brandName: name, introduction } });
      if (result.error) {
        setPeecError(result.error);
      } else {
        setPeec(result);
      }
    } catch (err) {
      setPeecError(err instanceof Error ? err.message : "Failed to fetch insights.");
    } finally {
      setPeecLoading(false);
    }
  };

  const handleAnalyze = async () => {
    if (!url.trim() || analyzing) return;
    setAnalyzing(true);
    setAnalyzeError(null);
    try {
      const result = await analyze({ data: { url } });
      if (result.error) {
        setAnalyzeError(result.error);
      } else {
        setBrandName(result.brandName);
        setIntro(result.introduction);
        void saveBrandProfile(result.brandName, result.introduction);
        void loadPeec(result.brandName, result.introduction);
      }
    } catch (err) {
      setAnalyzeError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setAnalyzing(false);
    }
  };

  const refreshPeec = () => loadPeec(brandName, intro);

  return (
    <div className="min-h-screen bg-background py-10 px-4">
      <div className="mx-auto max-w-2xl">

        {/* Page header */}
        <div className="mb-8">
          <p className="text-xs font-semibold uppercase tracking-widest text-primary mb-1">
            Step 1 of 4
          </p>
          <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            Brand Setup
          </h1>
          <p className="mt-1.5 text-sm text-muted-foreground">
            Set up your brand identity, audience, and products to power AI-driven content.
          </p>
        </div>
        <div className="mb-16" />

        <div className="space-y-4">

          {/* ── Section 1: Brand Identity ── */}
          <div
            className={cn(
              "rounded-2xl border bg-card shadow-sm transition-all duration-200",
              openSection === "brand"
                ? "border-primary/30 shadow-[0_0_0_3px_oklch(0.52_0.21_270_/_0.06)]"
                : "border-border hover:border-border/80",
            )}
          >
            <div className="p-5">
              <SectionHeader
                step={1}
                title="Brand Identity"
                subtitle="Your brand name, introduction, and AI-powered insights"
                isOpen={openSection === "brand"}
                isComplete={isBrandComplete}
                onToggle={() => toggleSection("brand")}
                accentClass="bg-primary/10 text-primary"
                stepBgClass="bg-primary/10 text-primary"
              />
            </div>

            {openSection === "brand" && (
              <div className="border-t border-border/60 px-5 pb-6 pt-5 space-y-6">

                {/* URL Analyzer */}
                <div className="rounded-xl bg-muted/40 border border-border/60 p-4">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">
                    Quick Import
                  </p>
                  <div className="flex flex-col gap-2 sm:flex-row">
                    <div className="relative flex-1">
                      <Globe className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        value={url}
                        onChange={(e) => setUrl(e.target.value)}
                        placeholder="https://yourbrand.com"
                        disabled={analyzing}
                        onKeyDown={(e) => { if (e.key === "Enter") handleAnalyze(); }}
                        className="h-10 rounded-lg pl-9 bg-background"
                      />
                    </div>
                    <Button
                      onClick={handleAnalyze}
                      disabled={!url.trim() || analyzing}
                      size="sm"
                      className="h-10 gap-2 rounded-lg px-4 shadow-sm"
                    >
                      {analyzing ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
                      {analyzing ? "Analyzing…" : "Analyze"}
                    </Button>
                  </div>
                  {analyzeError && (
                    <div className="mt-3 flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-xs text-destructive">
                      <AlertCircle className="mt-0.5 h-3.5 w-3.5 flex-shrink-0" />
                      {analyzeError}
                    </div>
                  )}
                </div>

                {/* Brand Name + Intro */}
                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="brand-name" className="text-sm font-medium">
                      Brand name
                    </Label>
                    <Input
                      id="brand-name"
                      placeholder="e.g. Nothing Phone"
                      value={brandName}
                      onChange={(e) => setBrandName(e.target.value)}
                      onBlur={() => { if (brandName.trim() && intro.trim()) void saveBrandProfile(brandName, intro); }}
                      className="h-11 rounded-xl"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="brand-intro" className="text-sm font-medium">
                      Brand introduction
                    </Label>
                    <Textarea
                      id="brand-intro"
                      placeholder="A short, engaging description of what your brand does…"
                      value={intro}
                      onChange={(e) => setIntro(e.target.value)}
                      onBlur={() => { if (brandName.trim() && intro.trim()) void saveBrandProfile(brandName, intro); }}
                      rows={4}
                      className="resize-none rounded-xl"
                    />
                  </div>
                </div>

                {/* Peec AI Insights */}
                {(peec || peecLoading || peecError) && (
                  <div className="rounded-xl border border-purple-100 bg-gradient-to-br from-purple-50 to-fuchsia-50 p-4 space-y-3">
                    {/* Header */}
                    <div className="flex items-center gap-2">
                      <TrendingUp className="h-4 w-4 text-purple-600" />
                      <span className="text-sm font-semibold text-purple-800">Peec AI — Brand Visibility</span>
                      <div className="ml-auto flex items-center gap-2">
                        <button
                          type="button"
                          onClick={refreshPeec}
                          disabled={peecLoading || !brandName || !intro}
                          className="text-xs text-purple-400 hover:text-purple-600 transition-colors disabled:opacity-40"
                          title="Refresh"
                        >
                          {peecLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />}
                        </button>
                      </div>
                    </div>

                    {peecError && (
                      <div className="flex items-start gap-2 rounded-lg border border-destructive/30 bg-white/70 p-3 text-xs text-destructive">
                        <AlertCircle className="mt-0.5 h-3.5 w-3.5 flex-shrink-0" />
                        {peecError}
                      </div>
                    )}

                    {peecLoading && !peec && (
                      <p className="text-xs text-purple-500 animate-pulse">Fetching live brand insights...</p>
                    )}

                    {peec && !peecLoading && (
                      <div className="grid grid-cols-2 gap-3">

                        {/* Share of Voice */}
                        <div className="bg-white rounded-lg p-3 border border-purple-100 space-y-1">
                          <div className="flex items-center gap-1.5 text-xs text-gray-500">
                            <TrendingUp className="h-3 w-3" />
                            Share of Voice
                            <Popover>
                              <PopoverTrigger asChild>
                                <button type="button" className="ml-0.5 text-purple-300 hover:text-purple-500 transition-colors">
                                  <Info className="h-3 w-3" />
                                </button>
                              </PopoverTrigger>
                              <PopoverContent className="w-64 text-xs text-gray-600 p-3" side="top">
                                <p className="font-semibold text-gray-800 mb-1">Share of Voice</p>
                                How often your brand appears in AI-generated responses compared to all tracked competitors. A higher % means AI models mention your brand more frequently — giving you an edge in AI-driven discovery.
                              </PopoverContent>
                            </Popover>
                          </div>
                          <div className="text-lg font-bold text-purple-700">
                            {peec.visibility.shareOfVoice > 0 ? `${peec.visibility.shareOfVoice.toFixed(1)}%` : "No data yet"}
                          </div>
                        </div>

                        {/* Sentiment */}
                        <div className="bg-white rounded-lg p-3 border border-purple-100 space-y-1">
                          <div className="flex items-center gap-1.5 text-xs text-gray-500">
                            <Smile className="h-3 w-3" />
                            Sentiment
                            <Popover>
                              <PopoverTrigger asChild>
                                <button type="button" className="ml-0.5 text-purple-300 hover:text-purple-500 transition-colors">
                                  <Info className="h-3 w-3" />
                                </button>
                              </PopoverTrigger>
                              <PopoverContent className="w-64 text-xs text-gray-600 p-3" side="top">
                                <p className="font-semibold text-gray-800 mb-1">Sentiment Score</p>
                                How positively AI models talk about your brand, scored out of 100.<br /><br />
                                <span className="text-green-600 font-medium">70+</span> — Strong positive association<br />
                                <span className="text-yellow-600 font-medium">50–69</span> — Neutral perception<br />
                                <span className="text-red-500 font-medium">Below 50</span> — Negative associations detected
                              </PopoverContent>
                            </Popover>
                          </div>
                          <div className={cn("text-lg font-bold", peec.sentiment >= 70 ? "text-green-600" : peec.sentiment >= 50 ? "text-yellow-600" : "text-red-500")}>
                            {peec.sentiment > 0 ? `${peec.sentiment}/100` : "No data yet"}
                          </div>
                        </div>

                        {/* Tracked Competitors */}
                        {peec.competitors.length > 0 && (
                          <div className="col-span-2 bg-white rounded-lg p-3 border border-purple-100 space-y-2">
                            <div className="flex items-center gap-1.5 text-xs text-gray-500">
                              <Users className="h-3 w-3" />
                              Tracked Competitors
                              <Popover>
                                <PopoverTrigger asChild>
                                  <button type="button" className="ml-0.5 text-purple-300 hover:text-purple-500 transition-colors">
                                    <Info className="h-3 w-3" />
                                  </button>
                                </PopoverTrigger>
                                <PopoverContent className="w-64 text-xs text-gray-600 p-3" side="top">
                                  <p className="font-semibold text-gray-800 mb-1">Tracked Competitors</p>
                                  Brands monitored alongside yours in AI responses. The % next to each name is their Share of Voice — how often AI mentions them in the same context. Use this to benchmark your position and spot content opportunities.
                                </PopoverContent>
                              </Popover>
                            </div>
                            <div className="flex flex-wrap gap-1.5">
                              {peec.competitors.slice(0, 6).map((c) => (
                                <span key={c.name} className="inline-flex items-center gap-1 text-xs bg-purple-50 border border-purple-100 text-purple-700 rounded-full px-2 py-0.5">
                                  {c.name}
                                  {c.shareOfVoice > 0 && (
                                    <span className="text-purple-400">{c.shareOfVoice.toFixed(0)}%</span>
                                  )}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* What this means */}
                        {getPeecInsightBullets(peec).length > 0 && (
                          <div className="col-span-2 bg-purple-50 rounded-lg p-3 border border-purple-100 space-y-2">
                            <div className="text-xs font-medium text-purple-700">What this means for your brand</div>
                            <ul className="space-y-1.5">
                              {getPeecInsightBullets(peec).map((bullet, i) => (
                                <li key={i} className="flex items-start gap-2 text-xs text-purple-800">
                                  <span className="mt-0.5 text-purple-400">•</span>
                                  {bullet}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}

                      </div>
                    )}
                  </div>
                )}

                {/* Trigger Peec manually if not yet loaded */}
                {!peec && !peecLoading && brandName && intro && (
                  <button
                    type="button"
                    onClick={refreshPeec}
                    className="flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-violet-300 bg-violet-50/50 py-3 text-sm font-medium text-violet-700 transition-all hover:bg-violet-50 hover:border-violet-400"
                  >
                    <Zap className="h-4 w-4" />
                    Load Peec AI Insights
                  </button>
                )}

                <div className="flex justify-end pt-1">
                  <Button
                    onClick={() => toggleSection("audience")}
                    disabled={!isBrandComplete}
                    className="h-10 gap-2 rounded-xl px-5 shadow-sm"
                  >
                    Continue to Audience
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </div>

          {/* ── Section 2: Audience Profiles ── */}
          <div
            className={cn(
              "rounded-2xl border bg-card shadow-sm transition-all duration-200",
              openSection === "audience"
                ? "border-emerald-300/60 shadow-[0_0_0_3px_oklch(0.74_0.15_160_/_0.08)]"
                : "border-border hover:border-border/80",
              !isBrandComplete && "opacity-60 pointer-events-none select-none",
            )}
          >
            <div className="p-5">
              <SectionHeader
                step={2}
                title="Audience Profiles"
                subtitle="Define who you're creating content for"
                isOpen={openSection === "audience"}
                isComplete={false}
                onToggle={() => isBrandComplete && toggleSection("audience")}
                accentClass="bg-emerald-100 text-emerald-700"
                stepBgClass="bg-emerald-50 text-emerald-700"
              />
            </div>
            {openSection === "audience" && (
              <div className="border-t border-border/60 px-5 pb-6 pt-1">
                <AudienceProfiles brandName={brandName} introduction={intro} />
                <div className="flex justify-end pt-4">
                  <Button
                    onClick={() => toggleSection("products")}
                    variant="outline"
                    className="h-10 gap-2 rounded-xl px-5"
                  >
                    Continue to Products
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </div>

          {/* ── Section 3: Products & Services ── */}
          <div
            className={cn(
              "rounded-2xl border bg-card shadow-sm transition-all duration-200",
              openSection === "products"
                ? "border-amber-300/60 shadow-[0_0_0_3px_oklch(0.83_0.17_80_/_0.08)]"
                : "border-border hover:border-border/80",
              !isBrandComplete && "opacity-60 pointer-events-none select-none",
            )}
          >
            <div className="p-5">
              <SectionHeader
                step={3}
                title="Products & Services"
                subtitle="What you offer — used to personalise content"
                isOpen={openSection === "products"}
                isComplete={false}
                onToggle={() => isBrandComplete && toggleSection("products")}
                accentClass="bg-amber-100 text-amber-700"
                stepBgClass="bg-amber-50 text-amber-700"
              />
            </div>
            {openSection === "products" && (
              <div className="border-t border-border/60 px-5 pb-6 pt-1">
                <ProductsServices brandName={brandName} introduction={intro} />
              </div>
            )}
          </div>

        </div>

        {/* Footer CTA */}
        <div className="mt-8 flex items-center justify-between">
          <p className="text-xs text-muted-foreground">
            Details stay private and are only used to personalise your content.
          </p>
          <Link to="/strategy">
            <Button
              disabled={!isBrandComplete}
              className="h-11 gap-2 rounded-xl px-6 shadow-sm transition-all hover:shadow-md"
            >
              <Building2 className="h-4 w-4" />
              Save & Continue
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
