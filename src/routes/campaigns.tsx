import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { useServerFn } from "@tanstack/react-start";
import {
  Globe,
  ChevronRight,
  Plus,
  X,
  Linkedin,
  Instagram,
  Twitter,
  Youtube,
  Facebook,
  BookOpen,
  Check,
  Users,
  Package,
  ArrowRight,
  Sparkles,
  Loader2,
  ChevronDown,
  ChevronUp,
  ExternalLink,
} from "lucide-react";
import AppLayout from "@/components/AppLayout";
import { useAudiences, useProducts, getSessionId, saveCampaignToDB, loadLatestCampaignFromDB } from "@/hooks/use-brand-store";
import { autoAnalyzePillars, fetchLocationEvents, searchTavilyByPillar } from "@/server/brand.functions";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/campaigns")({
  head: () => ({
    meta: [
      { title: "Campaign Setup — SocialFlow" },
      { name: "description", content: "Define the boundaries and goals of your next campaign push." },
    ],
  }),
  component: CampaignsPage,
});

const PLATFORMS = [
  { id: "linkedin", name: "LinkedIn", icon: Linkedin },
  { id: "instagram", name: "Instagram", icon: Instagram },
  { id: "twitter", name: "X / Twitter", icon: Twitter },
  { id: "youtube", name: "YouTube", icon: Youtube },
  { id: "facebook", name: "Facebook", icon: Facebook },
  { id: "blog", name: "Blog Post", icon: BookOpen },
] as const;

type PlatformId = (typeof PLATFORMS)[number]["id"];

const LOCATIONS = [
  "Global",
  "Germany",
  "United States",
  "United Kingdom",
  "France",
  "Spain",
  "Italy",
  "Netherlands",
  "Switzerland",
  "Austria",
  "Canada",
  "Australia",
  "India",
  "Brazil",
  "Japan",
  "Singapore",
  "UAE",
];

const EVENTS_BY_LOCATION: Record<string, { date: string; name: string; category: string }[]> = {
  Germany: [
    { date: "Oct 3", name: "German Unity Day", category: "Holiday" },
    { date: "Oct 31", name: "Reformation Day", category: "Holiday" },
    { date: "Nov 9", name: "Berlin Wall Anniversary", category: "Historical" },
  ],
  "United States": [
    { date: "Oct 14", name: "Columbus Day", category: "Holiday" },
    { date: "Oct 31", name: "Halloween", category: "Cultural" },
    { date: "Nov 28", name: "Thanksgiving", category: "Holiday" },
  ],
  "United Kingdom": [
    { date: "Oct 31", name: "Halloween", category: "Cultural" },
    { date: "Nov 5", name: "Bonfire Night", category: "Cultural" },
    { date: "Nov 11", name: "Remembrance Day", category: "Historical" },
  ],
  France: [
    { date: "Nov 1", name: "All Saints' Day", category: "Holiday" },
    { date: "Nov 11", name: "Armistice Day", category: "Historical" },
    { date: "Nov 21", name: "Beaujolais Nouveau", category: "Cultural" },
  ],
  Spain: [
    { date: "Oct 12", name: "Día de la Hispanidad", category: "Holiday" },
    { date: "Nov 1", name: "All Saints' Day", category: "Holiday" },
    { date: "Dec 6", name: "Constitution Day", category: "Holiday" },
  ],
  Global: [
    { date: "Oct 10", name: "World Mental Health Day", category: "Awareness" },
    { date: "Nov 13", name: "World Kindness Day", category: "Awareness" },
    { date: "Nov 29", name: "Black Friday", category: "Commerce" },
  ],
  Italy: [
    { date: "Nov 1", name: "All Saints' Day", category: "Holiday" },
    { date: "Nov 4", name: "National Unity Day", category: "Historical" },
    { date: "Dec 8", name: "Immaculate Conception", category: "Holiday" },
  ],
  Netherlands: [
    { date: "Oct 3", name: "Leiden Relief Day", category: "Historical" },
    { date: "Nov 11", name: "St. Martin's Day", category: "Cultural" },
    { date: "Nov 29", name: "Black Friday", category: "Commerce" },
  ],
  Switzerland: [
    { date: "Oct 31", name: "Halloween", category: "Cultural" },
    { date: "Nov 1", name: "All Saints' Day", category: "Holiday" },
    { date: "Dec 6", name: "St. Nicholas Day", category: "Cultural" },
  ],
  Austria: [
    { date: "Oct 26", name: "National Day", category: "Holiday" },
    { date: "Nov 1", name: "All Saints' Day", category: "Holiday" },
    { date: "Dec 6", name: "St. Nicholas Day", category: "Cultural" },
  ],
  Canada: [
    { date: "Oct 14", name: "Thanksgiving", category: "Holiday" },
    { date: "Oct 31", name: "Halloween", category: "Cultural" },
    { date: "Nov 11", name: "Remembrance Day", category: "Historical" },
  ],
  Australia: [
    { date: "Oct 31", name: "Halloween", category: "Cultural" },
    { date: "Nov 5", name: "Melbourne Cup", category: "Cultural" },
    { date: "Nov 29", name: "Black Friday", category: "Commerce" },
  ],
  India: [
    { date: "Oct 2", name: "Gandhi Jayanti", category: "Holiday" },
    { date: "Oct 24", name: "Dussehra", category: "Cultural" },
    { date: "Nov 1", name: "Diwali", category: "Cultural" },
  ],
  Brazil: [
    { date: "Oct 12", name: "Our Lady of Aparecida", category: "Holiday" },
    { date: "Nov 2", name: "Day of the Dead", category: "Cultural" },
    { date: "Nov 15", name: "Republic Day", category: "Holiday" },
  ],
  Japan: [
    { date: "Oct 14", name: "Sports Day", category: "Holiday" },
    { date: "Nov 3", name: "Culture Day", category: "Holiday" },
    { date: "Nov 23", name: "Labour Thanksgiving Day", category: "Holiday" },
  ],
  Singapore: [
    { date: "Oct 31", name: "Halloween", category: "Cultural" },
    { date: "Nov 11", name: "Remembrance Day", category: "Historical" },
    { date: "Nov 29", name: "Black Friday", category: "Commerce" },
  ],
  UAE: [
    { date: "Nov 2", name: "UAE National Day Prep", category: "Holiday" },
    { date: "Nov 29", name: "Black Friday", category: "Commerce" },
    { date: "Dec 2", name: "UAE National Day", category: "Holiday" },
  ],
};


const DEFAULT_PILLARS_EMPTY = ["", "", "", ""];

function CampaignsPage() {
  const analyzePillars = useServerFn(autoAnalyzePillars);
  const fetchEvents = useServerFn(fetchLocationEvents);
  const searchTavily = useServerFn(searchTavilyByPillar);
  const [name, setName] = useState("");
  const [pillars, setPillars] = useState<string[]>(DEFAULT_PILLARS_EMPTY);
  const [startDate, setStartDate] = useState("2024-10-01");
  const [endDate, setEndDate] = useState("2024-11-30");
  const [location, setLocation] = useState("Germany");
  const [platforms, setPlatforms] = useState<Record<PlatformId, boolean>>({
    linkedin: true,
    instagram: true,
    twitter: false,
    youtube: false,
    facebook: false,
    blog: false,
  });
  const [selectedAudienceIds, setSelectedAudienceIds] = useState<string[]>([]);
  const [selectedProductIds, setSelectedProductIds] = useState<string[]>([]);
  const [savedCampaign, setSavedCampaign] = useState<null | { name: string }>(null);
  const [campaignId, setCampaignId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [brandName, setBrandName] = useState("");
  const [brandIntro, setBrandIntro] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [autoFetchEvents, setAutoFetchEvents] = useState(false);
  const [aiEvents, setAiEvents] = useState<{ date: string; event: string; focus: string; category: string }[]>([]);
  const [addedEvents, setAddedEvents] = useState<{ date: string; event: string; focus: string; category: string }[]>([]);
  const [loadingEvents, setLoadingEvents] = useState(false);
  const [showAllEvents, setShowAllEvents] = useState(false);

  // Trending News (Tavily)
  type TavilyArticle = { id: string; title: string; url: string; content: string; publishedDate?: string };
  const [trendsByPillar, setTrendsByPillar] = useState<Record<string, TavilyArticle[]>>(() => {
    try { return JSON.parse(localStorage.getItem("camp_tavily_by_pillar") || "{}"); } catch { return {}; }
  });
  const [activeTrendPillar, setActiveTrendPillar] = useState<string | null>(() =>
    localStorage.getItem("camp_tavily_active_pillar"),
  );
  const [selectedTrendIds, setSelectedTrendIds] = useState<string[]>(() => {
    try { return JSON.parse(localStorage.getItem("camp_tavily_selected") || "[]"); } catch { return []; }
  });
  const [isNewsExpanded, setIsNewsExpanded] = useState(false);
  const [isLoadingTrends, setIsLoadingTrends] = useState(false);
  const [trendsError, setTrendsError] = useState("");

  const [audiences] = useAudiences();
  const [products] = useProducts();

  const [loaded, setLoaded] = useState(false);

  // Load brand profile + last campaign on mount
  useEffect(() => {
    supabase
      .from("brand_profiles")
      .select("brand_name, introduction")
      .eq("session_id", getSessionId())
      .single()
      .then(({ data }) => {
        if (data) {
          setBrandName(data.brand_name ?? "");
          setBrandIntro(data.introduction ?? "");
        }
      });

    loadLatestCampaignFromDB().then((saved) => {
      if (!saved) { setLoaded(true); return; }
      setCampaignId(saved.id ?? null);
      if (saved.name) setName(saved.name);
      if (saved.contentPillars.length) setPillars([...saved.contentPillars, ...Array(4).fill("")].slice(0, 4));
      if (saved.startDate) setStartDate(saved.startDate);
      if (saved.endDate) setEndDate(saved.endDate);
      if (saved.location) setLocation(saved.location);
      if (saved.selectedAudienceIds.length) setSelectedAudienceIds(saved.selectedAudienceIds);
      if (saved.selectedProductIds.length) setSelectedProductIds(saved.selectedProductIds);
      if (saved.selectedPlatforms.length) {
        setPlatforms((prev) => {
          const next = { ...prev };
          (Object.keys(next) as PlatformId[]).forEach((k) => { next[k] = saved.selectedPlatforms.includes(k); });
          return next;
        });
      }
      if (Array.isArray(saved.aiEvents) && saved.aiEvents.length) {
        setAddedEvents(saved.aiEvents as { date: string; event: string; focus: string; category: string }[]);
      }
      setLoaded(true);
    });
  }, []);

  // Auto-save whenever any field changes (debounced 1.5s)
  useEffect(() => {
    if (!loaded) return;
    const timer = setTimeout(() => {
      void saveCampaignToDB({
        id: campaignId ?? undefined,
        name: name || "Untitled Campaign",
        contentPillars: pillars.filter(Boolean),
        startDate,
        endDate,
        location,
        selectedAudienceIds,
        selectedProductIds,
        selectedPlatforms: Object.entries(platforms).filter(([, v]) => v).map(([k]) => k),
        aiEvents: addedEvents,
      }).then((id) => { if (id && !campaignId) setCampaignId(id); });
    }, 1500);
    return () => clearTimeout(timer);
  }, [loaded, name, pillars, startDate, endDate, location, selectedAudienceIds, selectedProductIds, platforms, addedEvents]);

  const handleGenerate = async () => {
    setIsSaving(true);
    const campaignData = {
      id: campaignId ?? undefined,
      name: name || "Untitled Campaign",
      contentPillars: pillars.filter(Boolean),
      startDate,
      endDate,
      location,
      selectedAudienceIds,
      selectedProductIds,
      selectedPlatforms: Object.entries(platforms).filter(([, v]) => v).map(([k]) => k),
      aiEvents: addedEvents,
    };
    try {
      const id = await saveCampaignToDB(campaignData);
      if (id) setCampaignId(id);
      window.localStorage.setItem("socialflow.lastCampaign", JSON.stringify(campaignData));
    } catch { void 0; }
    setIsSaving(false);
    setSavedCampaign({ name: campaignData.name });
    setTimeout(() => setSavedCampaign(null), 3500);
  };

  const togglePlatform = (id: PlatformId) =>
    setPlatforms((p) => ({ ...p, [id]: !p[id] }));

  const handleLocationChange = (value: string) => {
    setLocation(value);
  };

  const doFetchEvents = async () => {
    if (!location) return;
    setLoadingEvents(true);
    setAiEvents([]);
    try {
      const result = await fetchEvents({ data: { location, startDate, endDate } });
      setAiEvents(result.events);
    } finally {
      setLoadingEvents(false);
    }
  };

  useEffect(() => {
    if (autoFetchEvents && location) void doFetchEvents();
    else if (!autoFetchEvents) setAiEvents([]);
  }, [autoFetchEvents, location, startDate, endDate]);

  // Persist Tavily state
  useEffect(() => { localStorage.setItem("camp_tavily_by_pillar", JSON.stringify(trendsByPillar)); }, [trendsByPillar]);
  useEffect(() => { localStorage.setItem("camp_tavily_selected", JSON.stringify(selectedTrendIds)); }, [selectedTrendIds]);
  useEffect(() => { if (activeTrendPillar) localStorage.setItem("camp_tavily_active_pillar", activeTrendPillar); }, [activeTrendPillar]);

  async function fetchTrendingNews() {
    const activePillars = pillars.filter(Boolean);
    if (!activePillars.length && !brandName) return;
    setIsLoadingTrends(true);
    setTrendsError("");
    try {
      const res = await searchTavily({ data: { brandName: brandName || "brand", pillars: activePillars.length ? activePillars : [brandName] } });
      if (res.error) { setTrendsError(res.error); return; }
      const pillarNames = Object.keys(res.resultsByPillar);
      setTrendsByPillar(res.resultsByPillar as Record<string, TavilyArticle[]>);
      if (pillarNames.length > 0) { setActiveTrendPillar(pillarNames[0]); setIsNewsExpanded(true); }
    } catch (err) {
      setTrendsError(err instanceof Error ? err.message : "Failed to fetch trends.");
    } finally {
      setIsLoadingTrends(false);
    }
  }

  function toggleTrendId(id: string) {
    setSelectedTrendIds((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]);
  }

  function trendRelativeTime(dateStr: string) {
    const diffMs = Date.now() - new Date(dateStr).getTime();
    const h = Math.floor(diffMs / 3600000);
    const d = Math.floor(h / 24);
    if (h < 1) return "Just now";
    if (h < 24) return `${h}h ago`;
    if (d === 1) return "1 day ago";
    return `${d} days ago`;
  }

  const hasTrends = Object.keys(trendsByPillar).length > 0;
  const activeTrendArticles: TavilyArticle[] = activeTrendPillar ? (trendsByPillar[activeTrendPillar] ?? []) : [];

  const handleAutoAnalyze = async () => {
    if (!brandIntro.trim() || isAnalyzing) return;
    setIsAnalyzing(true);
    try {
      const result = await analyzePillars({ data: { brandName, introduction: brandIntro, campaignName: name } });
      if (result.topics.length > 0) {
        setPillars([...result.topics, ...Array(4).fill("")].slice(0, 4));
      }
    } finally {
      setIsAnalyzing(false);
    }
  };

  const updatePillar = (idx: number, value: string) => {
    const next = [...pillars];
    next[idx] = value.slice(0, 40);
    setPillars(next);
  };

  const fmtDate = (iso: string) =>
    new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });

  const selectedCount = Object.values(platforms).filter(Boolean).length;

  const EmptyState = ({ message }: { message: string }) => (
    <div className="text-center py-6 bg-gray-50 rounded-lg border-2 border-dashed border-gray-200">
      <p className="text-gray-500 text-sm mb-3">{message}</p>
      <Link
        to="/"
        className="inline-flex items-center gap-1.5 text-sm font-medium text-indigo-600 hover:text-indigo-700 border border-indigo-200 rounded-lg px-3 py-1.5"
      >
        Go to Brand Setup <ArrowRight className="w-3.5 h-3.5" />
      </Link>
    </div>
  );

  return (
    <AppLayout>
      <div className="space-y-4 pb-16 pt-2">
        {/* Header */}
        <div className="mb-16">
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Campaign Setup</h1>
          <p className="text-slate-500 text-sm mt-1">Define the boundaries and goals of your next push.</p>
        </div>

        {/* Campaign Name */}
        <div className="rounded-2xl border border-gray-200 bg-white p-5 space-y-3">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl text-sm font-bold shadow-sm bg-indigo-100 text-indigo-700">5</div>
            <div>
              <p className="text-sm font-semibold text-gray-900">Campaign Name</p>
              <p className="text-xs text-gray-400 mt-0.5">Give your campaign a clear, memorable name</p>
            </div>
          </div>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full text-base border border-gray-200 rounded-lg px-3 py-2.5 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 placeholder:text-gray-400"
            placeholder="e.g. Q4 Brand Awareness Push"
          />
        </div>

        {/* Content Pillars + Trending News */}
        <div className="rounded-2xl border border-gray-200 bg-white p-5 space-y-4">
          {/* Header row */}
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl text-sm font-bold shadow-sm bg-indigo-100 text-indigo-700">6</div>
            <div className="flex-1 flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-gray-900">Content Pillars</p>
                <p className="text-xs text-gray-400 mt-0.5">The main themes your content will focus on</p>
              </div>
              <button
                type="button"
                onClick={handleAutoAnalyze}
                disabled={!brandIntro.trim() || isAnalyzing}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-purple-300 text-purple-700 bg-white hover:bg-purple-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                {isAnalyzing ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
                {isAnalyzing ? "Analyzing…" : "Auto Analyze"}
              </button>
            </div>
          </div>

          {/* Pillar inputs */}
          <div className="grid grid-cols-2 gap-3">
            {pillars.map((p, idx) => (
              <input
                key={idx}
                value={p}
                onChange={(e) => updatePillar(idx, e.target.value)}
                placeholder={`Pillar ${idx + 1}${idx < 2 ? " *" : ""}`}
                maxLength={40}
                className="text-sm border border-gray-200 rounded-lg px-3 py-2 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 placeholder:text-gray-400"
              />
            ))}
          </div>

          {/* Divider */}
          <div className="border-t border-gray-100" />

          {/* Trending News sub-section */}
          <div className="space-y-3">
            {/* Trending News header row */}
            <div
              className="flex items-center justify-between cursor-pointer select-none"
              onClick={() => setIsNewsExpanded((v) => !v)}
            >
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-pink-400" />
                <span className="text-sm font-medium text-gray-800">Trending News</span>
                <span className="text-xs font-medium bg-gradient-to-r from-pink-400 to-rose-400 bg-clip-text text-transparent">— Powered by Tavily</span>
                {isNewsExpanded ? <ChevronUp className="h-3.5 w-3.5 text-gray-400" /> : <ChevronDown className="h-3.5 w-3.5 text-gray-400" />}
              </div>
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); fetchTrendingNews(); }}
                disabled={isLoadingTrends}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-blue-200 text-blue-700 bg-blue-50 hover:bg-blue-100 disabled:opacity-50 transition-colors"
              >
                {isLoadingTrends
                  ? <><div className="h-3 w-3 animate-spin rounded-full border-b-2 border-blue-600" />Fetching…</>
                  : <><Globe className="h-3 w-3" />{hasTrends ? "Refresh" : "Get Latest News"}</>
                }
              </button>
            </div>

            {isNewsExpanded && (
              <div className="space-y-3">
                {trendsError && <p className="text-xs text-red-500">{trendsError}</p>}

                {!hasTrends && !isLoadingTrends && (
                  <p className="text-xs text-gray-400 pl-1">Click "Get Latest News" to fetch trending articles for your content pillars.</p>
                )}

                {hasTrends && (
                  <div className="space-y-2">
                    {/* Pillar tabs */}
                    <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-hide">
                      {Object.entries(trendsByPillar)
                        .filter(([p, t]) => p && t && t.length > 0)
                        .map(([pillar, trends]) => {
                          const isActive = activeTrendPillar === pillar;
                          const selCount = trends.filter((t) => selectedTrendIds.includes(t.id)).length;
                          return (
                            <button
                              key={pillar}
                              type="button"
                              onClick={() => setActiveTrendPillar(pillar)}
                              className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${isActive ? "bg-blue-600 text-white shadow-sm" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}
                            >
                              {pillar}
                              {selCount > 0 && (
                                <span className={`ml-1.5 px-1.5 py-0.5 rounded-full text-[10px] font-bold ${isActive ? "bg-white/25 text-white" : "bg-blue-100 text-blue-600"}`}>{selCount}</span>
                              )}
                            </button>
                          );
                        })}
                    </div>

                    {/* Articles list */}
                    {activeTrendArticles.length > 0 && (
                      <div className="space-y-1.5 max-h-[280px] overflow-y-auto pr-0.5">
                        {activeTrendArticles.map((trend) => {
                          const isSelected = selectedTrendIds.includes(trend.id);
                          return (
                            <div
                              key={trend.id}
                              onClick={() => toggleTrendId(trend.id)}
                              className={`group p-2.5 rounded-xl border cursor-pointer transition-all ${isSelected ? "border-blue-300 bg-blue-50" : "border-gray-200 bg-gray-50/60 hover:border-blue-200 hover:bg-blue-50/40"}`}
                            >
                              <div className="flex items-start gap-2.5">
                                {/* Checkbox */}
                                <div className={`mt-0.5 h-4 w-4 shrink-0 rounded border-2 flex items-center justify-center transition-colors ${isSelected ? "border-blue-500 bg-blue-500" : "border-gray-300 bg-white group-hover:border-blue-400"}`}>
                                  {isSelected && (
                                    <svg className="h-2.5 w-2.5 text-white" viewBox="0 0 10 10" fill="none">
                                      <path d="M2 5l2.5 2.5L8 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                                    </svg>
                                  )}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="text-xs font-semibold text-gray-900 line-clamp-1 leading-snug">{trend.title}</p>
                                  {trend.content && <p className="text-[11px] text-gray-500 mt-0.5 line-clamp-2 leading-relaxed">{trend.content}</p>}
                                  <div className="flex items-center gap-3 mt-1.5">
                                    {trend.publishedDate && (
                                      <span className="text-[10px] text-gray-400 font-medium">{trendRelativeTime(trend.publishedDate)}</span>
                                    )}
                                    {trend.url && (
                                      <a href={trend.url} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()} className="text-[10px] text-blue-500 hover:text-blue-700 flex items-center gap-0.5 font-medium">
                                        <ExternalLink className="h-2.5 w-2.5" />Source
                                      </a>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}
                {selectedTrendIds.length > 0 && (
                  <p className="text-[11px] text-blue-600 font-medium">{selectedTrendIds.length} article{selectedTrendIds.length !== 1 ? "s" : ""} selected</p>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Important Days — Duration + Location + AI Events */}
        <div className="rounded-2xl border border-gray-200 bg-white p-5 space-y-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl text-sm font-bold shadow-sm bg-indigo-100 text-indigo-700">7</div>
            <div>
              <p className="text-sm font-semibold text-gray-900">Important Days</p>
              <p className="text-xs text-gray-400 mt-0.5">Set your campaign window, location, and surface key dates</p>
            </div>
          </div>

          {/* Date range */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-gray-600">Start Date</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 outline-none focus:border-indigo-500"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-gray-600">End Date</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 outline-none focus:border-indigo-500"
              />
            </div>
          </div>
          <p className="text-xs text-gray-400">{fmtDate(startDate)} — {fmtDate(endDate)}</p>

          {/* Location */}
          <div className="flex items-center gap-3">
            <Globe className="w-4 h-4 text-gray-400 shrink-0" />
            <select
              value={location}
              onChange={(e) => handleLocationChange(e.target.value)}
              className="flex-1 text-sm border border-gray-200 rounded-lg px-3 py-2 outline-none focus:border-indigo-500 bg-white"
            >
              {LOCATIONS.map((l) => <option key={l} value={l}>{l}</option>)}
            </select>
          </div>

          {/* AI auto-fetch events */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-blue-500" />
                <p className="text-sm font-medium text-blue-700">AI-Generated Events for Your Campaign</p>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-600">Auto-fetch events</span>
                <button
                  type="button"
                  role="switch"
                  aria-checked={autoFetchEvents}
                  onClick={() => setAutoFetchEvents((v) => !v)}
                  className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus:outline-none ${autoFetchEvents ? "bg-blue-500" : "bg-gray-200"}`}
                >
                  <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform ${autoFetchEvents ? "translate-x-4" : "translate-x-1"}`} />
                </button>
              </div>
            </div>

            {loadingEvents && (
              <div className="flex items-center justify-center gap-2 py-4 text-sm text-gray-500">
                <Loader2 className="h-4 w-4 animate-spin text-blue-500" />
                Generating events for {location}…
              </div>
            )}

            {/* Added events */}
            {addedEvents.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Added to Campaign</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {addedEvents.map((event, i) => {
                    const d = new Date(event.date);
                    const mon = isNaN(d.getTime()) ? "" : d.toLocaleString("en-US", { month: "short" });
                    const day = isNaN(d.getTime()) ? "" : d.getDate();
                    return (
                      <div key={i} className="flex items-center gap-3 p-3 rounded-lg border bg-green-50 border-green-200">
                        <div className="text-center min-w-[28px]">
                          <div className="text-[10px] font-semibold text-green-600 uppercase">{mon}</div>
                          <div className="text-base font-bold text-green-800 leading-tight">{day}</div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">{event.event}</p>
                          <span className="inline-block text-[10px] font-medium text-green-600 bg-green-100 px-1.5 py-0.5 rounded">{event.category}</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            setAddedEvents((prev) => prev.filter((_, idx) => idx !== i));
                            setAiEvents((prev) => [...prev, event]);
                          }}
                          className="w-6 h-6 flex items-center justify-center rounded-full text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors shrink-0"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Suggestions */}
            {!loadingEvents && aiEvents.length > 0 && (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {(showAllEvents ? aiEvents : aiEvents.slice(0, 4)).map((event, i) => {
                    const d = new Date(event.date);
                    const mon = isNaN(d.getTime()) ? "" : d.toLocaleString("en-US", { month: "short" });
                    const day = isNaN(d.getTime()) ? "" : d.getDate();
                    return (
                      <div key={i} className="flex items-center justify-between p-4 rounded-lg border bg-blue-50 border-blue-200">
                        <div className="flex items-start gap-3 flex-1 min-w-0">
                          <div className="text-center min-w-[32px]">
                            <div className="text-[10px] font-semibold text-blue-600 uppercase">{mon}</div>
                            <div className="text-lg font-bold text-blue-800 leading-tight">{day}</div>
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900">{event.event}</p>
                            <p className="text-xs text-gray-600 mt-0.5">→ {event.focus}</p>
                            <span className="inline-block mt-1 text-[10px] font-medium text-blue-600 bg-blue-100 px-1.5 py-0.5 rounded">{event.category}</span>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            setAddedEvents((prev) => [...prev, event]);
                            setAiEvents((prev) => prev.filter((_, idx) => idx !== i));
                            setShowAllEvents(false);
                          }}
                          className="ml-3 w-8 h-8 flex items-center justify-center rounded-full border border-green-300 text-green-600 hover:bg-green-100 transition-colors shrink-0"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    );
                  })}
                </div>
                {aiEvents.length > 4 && !showAllEvents && (
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <span>And {aiEvents.length - 4} more events available</span>
                    <button type="button" onClick={() => setShowAllEvents(true)} className="text-blue-600 hover:text-blue-700 font-medium">
                      Show all
                    </button>
                  </div>
                )}
                {addedEvents.length > 0 && aiEvents.length === 0 && (
                  <p className="text-sm text-gray-400 text-center py-2">All generated events have been added to your campaign!</p>
                )}
              </>
            )}

            {!loadingEvents && autoFetchEvents && aiEvents.length === 0 && addedEvents.length === 0 && (
              <p className="text-sm text-gray-400 text-center py-2">No events found for this location and date range.</p>
            )}
          </div>
        </div>

        {/* Target Audience */}
        <div className="rounded-2xl border border-gray-200 bg-white p-5 space-y-3">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl text-sm font-bold shadow-sm bg-indigo-100 text-indigo-700">8</div>
            <div className="flex-1 flex items-start justify-between">
              <div>
                <p className="text-sm font-semibold text-gray-900">Target Audience</p>
                <p className="text-xs text-gray-400 mt-0.5">Who is this campaign speaking to?</p>
              </div>
              {selectedAudienceIds.length > 0 && (
                <button onClick={() => setSelectedAudienceIds([])} className="text-xs text-gray-400 hover:text-gray-600 mt-0.5">
                  Clear all
                </button>
              )}
            </div>
          </div>

          {audiences.length === 0 ? (
            <EmptyState message="You haven't added any audiences yet." />
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {audiences.map((a) => {
                  const isSelected = selectedAudienceIds.includes(a.id);
                  return (
                    <div
                      key={a.id}
                      onClick={() => setSelectedAudienceIds((prev) => isSelected ? prev.filter((id) => id !== a.id) : [...prev, a.id])}
                      className={`group flex items-start gap-3 rounded-xl p-3 border transition-all cursor-pointer ${
                        isSelected
                          ? "bg-green-50 border-green-200 hover:border-green-300"
                          : "bg-white border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                      }`}
                    >
                      <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 border shadow-sm ${isSelected ? "bg-white border-green-100" : "bg-gray-50 border-gray-100"}`}>
                        <Users className={`w-4 h-4 ${isSelected ? "text-green-700" : "text-gray-400"}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <h4 className={`text-sm font-semibold leading-tight ${isSelected ? "text-gray-900" : "text-gray-700"}`}>{a.name}</h4>
                          {isSelected && <Check className="w-3.5 h-3.5 text-green-600 shrink-0" />}
                        </div>
                        <p className={`text-xs mt-0.5 line-clamp-1 ${isSelected ? "text-green-800" : "text-gray-500"}`}>{a.roleAndIndustry}</p>
                        <p className={`text-xs mt-1 line-clamp-2 leading-relaxed ${isSelected ? "text-green-700" : "text-gray-400"}`}>{a.challenge}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
              <p className="text-sm text-gray-500">{selectedAudienceIds.length} of {audiences.length} audience{audiences.length !== 1 ? "s" : ""} selected</p>
            </>
          )}
        </div>

        {/* Product / Service */}
        <div className="rounded-2xl border border-gray-200 bg-white p-5 space-y-3">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl text-sm font-bold shadow-sm bg-indigo-100 text-indigo-700">9</div>
            <div className="flex-1 flex items-start justify-between">
              <div>
                <p className="text-sm font-semibold text-gray-900">Product / Service</p>
                <p className="text-xs text-gray-400 mt-0.5">What are you promoting in this campaign?</p>
              </div>
              {selectedProductIds.length > 0 && (
                <button onClick={() => setSelectedProductIds([])} className="text-xs text-gray-400 hover:text-gray-600 mt-0.5">
                  Clear all
                </button>
              )}
            </div>
          </div>

          {products.length === 0 ? (
            <EmptyState message="You haven't added any products or services yet." />
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {products.map((p) => {
                  const isSelected = selectedProductIds.includes(p.id);
                  return (
                    <div
                      key={p.id}
                      onClick={() => setSelectedProductIds((prev) => isSelected ? prev.filter((id) => id !== p.id) : [...prev, p.id])}
                      className={`group flex items-start gap-3 rounded-xl p-3 border transition-all cursor-pointer ${
                        isSelected
                          ? "bg-green-50 border-green-200 hover:border-green-300"
                          : "bg-white border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                      }`}
                    >
                      <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 border shadow-sm ${isSelected ? "bg-white border-green-100" : "bg-gray-50 border-gray-100"}`}>
                        <Package className={`w-4 h-4 ${isSelected ? "text-green-700" : "text-gray-400"}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <h4 className={`text-sm font-semibold leading-tight ${isSelected ? "text-gray-900" : "text-gray-700"}`}>{p.name}</h4>
                          {isSelected && <Check className="w-3.5 h-3.5 text-green-600 shrink-0" />}
                        </div>
                        <p className={`text-xs mt-1 line-clamp-2 leading-relaxed ${isSelected ? "text-green-800" : "text-gray-400"}`}>{p.description}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
              <p className="text-sm text-gray-500">{selectedProductIds.length} of {products.length} product{products.length !== 1 ? "s" : ""} selected</p>
            </>
          )}
        </div>

        {/* Platforms */}
        <div className="rounded-2xl border border-gray-200 bg-white p-5 space-y-3">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl text-sm font-bold shadow-sm bg-indigo-100 text-indigo-700">10</div>
            <div>
              <p className="text-sm font-semibold text-gray-900">Platforms</p>
              <p className="text-xs text-gray-400 mt-0.5">{selectedCount} platform{selectedCount !== 1 ? "s" : ""} selected</p>
            </div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {PLATFORMS.map((p) => {
              const active = platforms[p.id];
              const Icon = p.icon;
              return (
                <div
                  key={p.id}
                  onClick={() => togglePlatform(p.id)}
                  className={`p-3 border rounded-lg cursor-pointer transition-all text-center hover:border-indigo-300 ${
                    active ? "border-indigo-500 bg-indigo-50 text-indigo-700" : "border-gray-200 hover:bg-gray-50 text-gray-700"
                  }`}
                >
                  <Icon className={`w-5 h-5 mx-auto mb-1 ${active ? "text-indigo-600" : "text-gray-400"}`} />
                  <div className="text-xs font-medium">{p.name}</div>
                </div>
              );
            })}
          </div>
        </div>

        {savedCampaign && (
          <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 flex items-center gap-2 text-sm text-emerald-800">
            <Check className="w-4 h-4" />
            Saved <span className="font-semibold">{savedCampaign.name}</span> — ready to generate.
          </div>
        )}

        {/* CTA */}
        <div className="flex justify-end">
          <button
            onClick={handleGenerate}
            disabled={isSaving}
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold px-5 py-2.5 rounded-full shadow-sm transition-all disabled:opacity-70"
          >
            {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
            {isSaving ? "Saving…" : "Save"}
            {!isSaving && <ChevronRight className="w-4 h-4" />}
          </button>
        </div>
      </div>
    </AppLayout>
  );
}
