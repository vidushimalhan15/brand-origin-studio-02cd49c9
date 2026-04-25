import { useMemo, useState } from "react";
import { Sparkles, X, Check, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

const INDUSTRIES = [
  "SaaS",
  "E-commerce",
  "Fintech",
  "Healthcare",
  "Education",
  "Fashion",
  "Travel",
  "Food & Beverage",
  "Real Estate",
  "Fitness",
  "Gaming",
  "Media",
  "B2B Services",
  "Sustainability",
];

const TONES = [
  "Professional",
  "Friendly",
  "Bold",
  "Inspirational",
  "Playful",
  "Authoritative",
  "Witty",
  "Empathetic",
];

const MAX_INTRO = 500;
const MAX_INDUSTRIES = 5;
const MAX_TONES = 3;

export default function BrandIdentityStep() {
  const [brandName, setBrandName] = useState("");
  const [intro, setIntro] = useState("");
  const [industries, setIndustries] = useState<string[]>([]);
  const [industryQuery, setIndustryQuery] = useState("");
  const [tones, setTones] = useState<string[]>([]);
  const [enhancing, setEnhancing] = useState(false);

  const filteredIndustries = useMemo(() => {
    const q = industryQuery.trim().toLowerCase();
    return INDUSTRIES.filter(
      (i) => !industries.includes(i) && (q === "" || i.toLowerCase().includes(q)),
    ).slice(0, 6);
  }, [industries, industryQuery]);

  const toggleIndustry = (item: string) => {
    setIndustries((prev) =>
      prev.includes(item)
        ? prev.filter((i) => i !== item)
        : prev.length < MAX_INDUSTRIES
          ? [...prev, item]
          : prev,
    );
    setIndustryQuery("");
  };

  const toggleTone = (tone: string) => {
    setTones((prev) =>
      prev.includes(tone)
        ? prev.filter((t) => t !== tone)
        : prev.length < MAX_TONES
          ? [...prev, tone]
          : prev,
    );
  };

  const enhanceIntro = async () => {
    if (!intro.trim() || enhancing) return;
    setEnhancing(true);
    await new Promise((r) => setTimeout(r, 1100));
    const base = intro.trim().replace(/\.$/, "");
    const enhanced = `${brandName || "Our brand"} helps modern teams ${base
      .toLowerCase()
      .replace(/^we\s+/, "")
      .replace(/^our\s+/, "")} — delivering measurable impact through thoughtful design, intelligent automation, and a relentless focus on customer outcomes.`;
    setIntro(enhanced.slice(0, MAX_INTRO));
    setEnhancing(false);
  };

  const introCount = intro.length;
  const overLimit = introCount > MAX_INTRO;

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
              We&apos;ll use this to craft on-brand content tailored to your
              audience.
            </p>
          </div>

          <div className="space-y-7">
            {/* Brand Name */}
            <div className="space-y-2">
              <Label htmlFor="brand-name" className="text-sm font-medium">
                Brand name
              </Label>
              <Input
                id="brand-name"
                placeholder="e.g. SocialFlow"
                value={brandName}
                onChange={(e) => setBrandName(e.target.value)}
                className="h-11 rounded-xl"
              />
            </div>

            {/* Brand Introduction */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="brand-intro" className="text-sm font-medium">
                  Brand introduction
                </Label>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={enhanceIntro}
                  disabled={enhancing || !intro.trim()}
                  className="h-8 gap-1.5 rounded-lg text-primary hover:bg-primary/10 hover:text-primary"
                >
                  {enhancing ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Sparkles className="h-3.5 w-3.5" />
                  )}
                  {enhancing ? "Enhancing…" : "Help me write this"}
                </Button>
              </div>
              <Textarea
                id="brand-intro"
                placeholder="Describe what your brand does, who you serve, and what makes you different…"
                value={intro}
                onChange={(e) => setIntro(e.target.value.slice(0, MAX_INTRO))}
                rows={5}
                className={cn(
                  "resize-none rounded-xl",
                  enhancing && "opacity-60",
                )}
                disabled={enhancing}
              />
              <div className="flex justify-end">
                <span
                  className={cn(
                    "text-xs tabular-nums",
                    overLimit
                      ? "text-destructive"
                      : introCount > MAX_INTRO * 0.85
                        ? "text-foreground"
                        : "text-muted-foreground",
                  )}
                >
                  {introCount} / {MAX_INTRO}
                </span>
              </div>
            </div>

            {/* Industry / Niche */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-medium">Industry / Niche</Label>
                <span className="text-xs text-muted-foreground">
                  {industries.length}/{MAX_INDUSTRIES}
                </span>
              </div>

              <div
                className={cn(
                  "flex min-h-11 flex-wrap items-center gap-2 rounded-xl border border-input bg-background px-3 py-2 transition-colors focus-within:border-ring focus-within:ring-2 focus-within:ring-ring/20",
                )}
              >
                {industries.map((item) => (
                  <span
                    key={item}
                    className="inline-flex items-center gap-1 rounded-lg bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary"
                  >
                    {item}
                    <button
                      type="button"
                      onClick={() => toggleIndustry(item)}
                      className="rounded-sm transition-colors hover:text-primary/70"
                      aria-label={`Remove ${item}`}
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                ))}
                <input
                  value={industryQuery}
                  onChange={(e) => setIndustryQuery(e.target.value)}
                  placeholder={
                    industries.length === 0
                      ? "Search and add up to 5 niches…"
                      : industries.length < MAX_INDUSTRIES
                        ? "Add another…"
                        : ""
                  }
                  disabled={industries.length >= MAX_INDUSTRIES}
                  className="flex-1 min-w-[140px] bg-transparent text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed"
                />
              </div>

              {industryQuery && filteredIndustries.length > 0 && (
                <div className="flex flex-wrap gap-2 pt-1">
                  {filteredIndustries.map((item) => (
                    <button
                      key={item}
                      type="button"
                      onClick={() => toggleIndustry(item)}
                      className="rounded-lg border border-border bg-background px-2.5 py-1 text-xs text-foreground transition-all hover:border-primary/40 hover:bg-primary/5 hover:text-primary"
                    >
                      + {item}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Tone & Voice */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-medium">Tone &amp; voice</Label>
                <span className="text-xs text-muted-foreground">
                  Pick up to {MAX_TONES} · {tones.length}/{MAX_TONES}
                </span>
              </div>
              <div className="flex flex-wrap gap-2">
                {TONES.map((tone) => {
                  const selected = tones.includes(tone);
                  const disabled = !selected && tones.length >= MAX_TONES;
                  return (
                    <button
                      key={tone}
                      type="button"
                      onClick={() => toggleTone(tone)}
                      disabled={disabled}
                      className={cn(
                        "group inline-flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-sm font-medium transition-all duration-200",
                        selected
                          ? "border-primary bg-primary text-primary-foreground shadow-sm"
                          : "border-border bg-background text-foreground hover:-translate-y-0.5 hover:border-primary/40 hover:bg-primary/5 hover:text-primary hover:shadow-sm",
                        disabled && "cursor-not-allowed opacity-40 hover:translate-y-0 hover:shadow-none",
                      )}
                    >
                      {selected && <Check className="h-3.5 w-3.5" />}
                      {tone}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="mt-10 flex items-center justify-between border-t border-border pt-6">
            <Button variant="ghost" disabled className="rounded-xl">
              Back
            </Button>
            <Button
              className="h-11 rounded-xl px-6 shadow-sm transition-all hover:shadow-md"
              disabled={
                !brandName.trim() ||
                !intro.trim() ||
                industries.length === 0 ||
                tones.length === 0
              }
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
