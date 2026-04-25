import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import {
  Sparkles,
  Loader2,
  Globe,
  RefreshCw,
  Zap,
  BarChart3,
  TrendingUp,
  Lightbulb,
  AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import {
  analyzeBrandUrl,
  fetchPeecInsights,
} from "@/server/brand.functions";
import AudienceProfiles from "@/components/AudienceProfiles";

type PeecPrompt = {
  prompt: string;
  rank: number;
  volume: string;
};

type PeecData = {
  prompts: PeecPrompt[];
  strategy: {
    name: string;
    rationale: string;
    suggestedTemplates: string[];
  };
};

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

export default function BrandIdentityStep() {
  const analyze = useServerFn(analyzeBrandUrl);
  const fetchPeec = useServerFn(fetchPeecInsights);

  const [url, setUrl] = useState("");
  const [analyzing, setAnalyzing] = useState(false);
  const [analyzeError, setAnalyzeError] = useState<string | null>(null);

  const [brandName, setBrandName] = useState("");
  const [intro, setIntro] = useState("");

  const [peec, setPeec] = useState<PeecData | null>(null);
  const [peecLoading, setPeecLoading] = useState(false);
  const [peecError, setPeecError] = useState<string | null>(null);

  const loadPeec = async (name: string, introduction: string) => {
    if (!name.trim() || !introduction.trim()) return;
    setPeecLoading(true);
    setPeecError(null);
    try {
      const result = await fetchPeec({
        data: { brandName: name, introduction },
      });
      if (result.error) {
        setPeecError(result.error);
      } else {
        setPeec({ prompts: result.prompts, strategy: result.strategy });
      }
    } catch (err) {
      setPeecError(
        err instanceof Error ? err.message : "Failed to fetch insights.",
      );
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
        // kick off peec insights in parallel-ish
        void loadPeec(result.brandName, result.introduction);
      }
    } catch (err) {
      setAnalyzeError(
        err instanceof Error ? err.message : "Something went wrong.",
      );
    } finally {
      setAnalyzing(false);
    }
  };

  const refreshPeec = () => loadPeec(brandName, intro);

  return (
    <div className="min-h-screen bg-background py-12 px-4 sm:py-16">
      <div className="mx-auto max-w-2xl">
        {/* Progress */}
        <div className="mb-8">
          <div className="mb-3 flex items-center justify-between text-sm">
            <span className="font-medium text-foreground">
              Step 1 of 4 · Brand Identity
            </span>
            <span className="text-muted-foreground">25%</span>
          </div>
          <Progress value={25} className="h-1.5" />
        </div>

        {/* Card */}
        <div className="rounded-2xl border border-border bg-card p-8 shadow-elegant sm:p-10">
          <div className="mb-8">
            <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
              <Sparkles className="h-3.5 w-3.5" />
              SocialFlow Setup
            </div>
            <h1 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
              Tell us about your brand
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Paste a URL and we&apos;ll analyze your brand with AI in seconds.
            </p>
          </div>

          {/* URL Scraper Bar */}
          <div className="mb-8">
            <Label htmlFor="brand-url" className="mb-2 block text-sm font-medium">
              Website, LinkedIn profile, or company URL
            </Label>
            <div className="flex flex-col gap-2 sm:flex-row">
              <div className="relative flex-1">
                <Globe className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="brand-url"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="https://yourbrand.com"
                  disabled={analyzing}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleAnalyze();
                  }}
                  className="h-11 rounded-xl pl-9"
                />
              </div>
              <Button
                onClick={handleAnalyze}
                disabled={!url.trim() || analyzing}
                className="h-11 gap-2 rounded-xl px-5 shadow-sm transition-all hover:shadow-md"
              >
                {analyzing ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Sparkles className="h-4 w-4" />
                )}
                {analyzing ? "Analyzing…" : "Analyze Brand"}
              </Button>
            </div>
            {analyzeError && (
              <div className="mt-3 flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
                <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0" />
                <span>{analyzeError}</span>
              </div>
            )}
          </div>

          <div className="space-y-6">
            {/* Brand Name */}
            <div className="space-y-2">
              <Label htmlFor="brand-name" className="text-sm font-medium">
                Brand name
              </Label>
              <Input
                id="brand-name"
                placeholder="Your brand name"
                value={brandName}
                onChange={(e) => setBrandName(e.target.value)}
                className="h-11 rounded-xl"
              />
            </div>

            {/* Brand Introduction */}
            <div className="space-y-2">
              <Label htmlFor="brand-intro" className="text-sm font-medium">
                Brand introduction
              </Label>
              <Textarea
                id="brand-intro"
                placeholder="A short, engaging description of what your brand does…"
                value={intro}
                onChange={(e) => setIntro(e.target.value)}
                rows={4}
                className="resize-none rounded-xl"
              />
            </div>
          </div>

          {/* Peec AI Insights */}
          {(peec || peecLoading || peecError) && (
            <div className="mt-8 rounded-2xl border border-indigo-200 bg-gradient-to-br from-purple-50 to-fuchsia-50 p-6 shadow-sm">
              <div className="mb-5 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500 to-fuchsia-500 shadow-sm">
                    <Zap className="h-4 w-4 text-white" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-indigo-950">
                      Peec AI — Content Strategy Signals
                    </h3>
                    <p className="text-xs text-indigo-700/70">
                      How AI assistants see your brand
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={refreshPeec}
                  disabled={peecLoading || !brandName || !intro}
                  className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-indigo-200 bg-white/60 text-indigo-700 transition-all hover:bg-white hover:shadow-sm disabled:cursor-not-allowed disabled:opacity-50"
                  aria-label="Refresh insights"
                >
                  <RefreshCw
                    className={cn(
                      "h-3.5 w-3.5",
                      peecLoading && "animate-spin",
                    )}
                  />
                </button>
              </div>

              {peecError && (
                <div className="flex items-start gap-2 rounded-lg border border-destructive/30 bg-white/70 p-3 text-sm text-destructive">
                  <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0" />
                  <span>{peecError}</span>
                </div>
              )}

              {peecLoading && !peec && (
                <div className="space-y-3">
                  {[0, 1, 2, 3, 4].map((i) => (
                    <div
                      key={i}
                      className="h-10 animate-pulse rounded-lg bg-white/60"
                    />
                  ))}
                </div>
              )}

              {peec && !peecLoading && (
                <div className="space-y-6">
                  {/* High Volume Prompts */}
                  <div>
                    <div className="mb-3 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-indigo-900">
                      <BarChart3 className="h-3.5 w-3.5" />
                      What people ask AI about your brand
                    </div>
                    <ul className="space-y-2">
                      {peec.prompts.map((p) => (
                        <li
                          key={p.rank}
                          className="group flex items-center gap-3 rounded-xl border border-indigo-100 bg-white/70 p-3 backdrop-blur-sm transition-all hover:border-indigo-200 hover:bg-white hover:shadow-sm"
                        >
                          <span className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-md bg-indigo-50 text-xs font-bold text-indigo-900">
                            #{p.rank}
                          </span>
                          <span className="flex-1 text-sm text-slate-800">
                            &ldquo;{p.prompt}&rdquo;
                          </span>
                          <div className="flex flex-shrink-0 items-center gap-2">
                            <span className="text-xs tabular-nums text-slate-500">
                              {p.volume}
                            </span>
                            <span
                              className={cn(
                                "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white",
                                rankColor(p.rank),
                              )}
                            >
                              <span
                                className="h-1.5 w-1.5 rounded-full bg-white/90"
                                aria-hidden
                              />
                              {rankLabel(p.rank)}
                            </span>
                          </div>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Recommended Strategy */}
                  <div>
                    <div className="mb-3 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-indigo-900">
                      <TrendingUp className="h-3.5 w-3.5" />
                      Recommended strategy
                    </div>
                    <div className="rounded-xl border border-indigo-100 bg-white/70 p-4 backdrop-blur-sm">
                      <div className="mb-2 flex items-center gap-2">
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-indigo-500 to-fuchsia-500 px-3 py-1 text-xs font-semibold text-white shadow-sm">
                          <Lightbulb className="h-3 w-3" />
                          {peec.strategy.name}
                        </span>
                      </div>
                      <p className="text-sm leading-relaxed text-slate-700">
                        {peec.strategy.rationale}
                      </p>
                      {peec.strategy.suggestedTemplates.length > 0 && (
                        <div className="mt-3 border-t border-indigo-100 pt-3">
                          <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-indigo-700/80">
                            Suggested templates
                          </p>
                          <div className="flex flex-wrap gap-1.5">
                            {peec.strategy.suggestedTemplates.map((t) => (
                              <span
                                key={t}
                                className="rounded-md border border-indigo-200 bg-white px-2 py-1 text-xs font-medium text-indigo-800"
                              >
                                {t}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Footer */}
          <div className="mt-10 flex items-center justify-between border-t border-border pt-6">
            <Button variant="ghost" disabled className="rounded-xl">
              Back
            </Button>
            <Button
              className="h-11 rounded-xl px-6 shadow-sm transition-all hover:shadow-md"
              disabled={!brandName.trim() || !intro.trim()}
            >
              Continue
            </Button>
          </div>
        </div>

        <p className="mt-6 text-center text-xs text-muted-foreground">
          Your brand details stay private and are only used to personalize your
          content.
        </p>
      </div>
    </div>
  );
}
