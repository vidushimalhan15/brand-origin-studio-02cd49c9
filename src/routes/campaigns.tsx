import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import {
  Calendar,
  Globe,
  Tag,
  ChevronRight,
  Calendar as CalendarIcon,
  RefreshCw,
  Linkedin,
  Instagram,
  Twitter,
  Youtube,
  Plus,
  X,
  Check,
  Users,
  Package,
  ArrowRight,
} from "lucide-react";
import AppLayout from "@/components/AppLayout";
import { useAudiences, useProducts } from "@/hooks/use-brand-store";


export const Route = createFileRoute("/campaigns")({
  head: () => ({
    meta: [
      { title: "Campaign Setup — SocialFlow" },
      {
        name: "description",
        content: "Define the boundaries and goals of your next campaign push.",
      },
    ],
  }),
  component: CampaignsPage,
});

const PLATFORMS = [
  { id: "linkedin", name: "LinkedIn", icon: Linkedin, color: "text-[#0A66C2]" },
  { id: "instagram", name: "Instagram", icon: Instagram, color: "text-pink-500" },
  { id: "twitter", name: "X / Twitter", icon: Twitter, color: "text-slate-900" },
  { id: "youtube", name: "YouTube", icon: Youtube, color: "text-red-600" },
] as const;

type PlatformId = (typeof PLATFORMS)[number]["id"];

const LOCATIONS = ["Germany", "United States", "United Kingdom", "France", "Spain", "Global"];

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
};

const DEFAULT_PILLARS = ["Case Studies", "Product Updates", "Industry Trends"];

function CampaignsPage() {
  const [name, setName] = useState("");
  const [pillars, setPillars] = useState<string[]>(DEFAULT_PILLARS);
  const [pillarDraft, setPillarDraft] = useState("");
  const [startDate, setStartDate] = useState("2024-10-01");
  const [endDate, setEndDate] = useState("2024-11-30");
  const [location, setLocation] = useState("Germany");
  const [platforms, setPlatforms] = useState<Record<PlatformId, boolean>>({
    linkedin: true,
    instagram: true,
    twitter: false,
    youtube: false,
  });
  const [events, setEvents] = useState(EVENTS_BY_LOCATION["Germany"]);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedAudienceId, setSelectedAudienceId] = useState<string | null>(null);
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null);
  const [savedCampaign, setSavedCampaign] = useState<null | { name: string }>(null);

  const [audiences] = useAudiences();
  const [products] = useProducts();

  const handleGenerate = () => {
    const campaign = {
      name: name || "Untitled Campaign",
      pillars,
      startDate,
      endDate,
      location,
      platforms: Object.entries(platforms).filter(([, v]) => v).map(([k]) => k),
      selectedAudienceId,
      selectedProductId,
    };
    try {
      window.localStorage.setItem("socialflow.lastCampaign", JSON.stringify(campaign));
    } catch {
      void 0;
    }
    setSavedCampaign({ name: campaign.name });
    setTimeout(() => setSavedCampaign(null), 3500);
  };


  const togglePlatform = (id: PlatformId) =>
    setPlatforms((p) => ({ ...p, [id]: !p[id] }));

  const handleLocationChange = (value: string) => {
    setLocation(value);
    setEvents(EVENTS_BY_LOCATION[value] ?? []);
  };

  const refreshEvents = () => {
    setRefreshing(true);
    setTimeout(() => {
      setEvents([...(EVENTS_BY_LOCATION[location] ?? [])]);
      setRefreshing(false);
    }, 600);
  };

  const addPillar = () => {
    const v = pillarDraft.trim();
    if (!v || pillars.includes(v)) return;
    setPillars([...pillars, v]);
    setPillarDraft("");
  };

  const removePillar = (p: string) => setPillars(pillars.filter((x) => x !== p));

  const fmtDate = (iso: string) =>
    new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });

  const selectedCount = Object.values(platforms).filter(Boolean).length;

  const cardClass = "bg-white border border-slate-200 rounded-xl shadow-sm p-6";

  const EmptyLink = ({ message, cta }: { message: string; cta: string }) => (
    <div className="rounded-xl border-2 border-dashed border-slate-200 p-6 flex flex-col items-center text-center gap-3">
      <p className="text-sm text-slate-500">{message}</p>
      <Link
        to="/"
        className="inline-flex items-center gap-1.5 text-sm font-semibold text-indigo-600 hover:text-indigo-700"
      >
        {cta}
        <ArrowRight className="w-3.5 h-3.5" />
      </Link>
    </div>
  );
  const badgeClass =
    "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-slate-200 bg-white text-xs font-semibold text-slate-700";

  return (
    <AppLayout>
      <div className="bg-white -m-8 p-8 min-h-[calc(100vh-0px)]">
        <div className="space-y-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Campaign Setup</h1>
            <p className="text-slate-500 mt-1">
              Define the boundaries and goals of your next push.
            </p>
          </div>

          {/* Basics & Timing */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Basics */}
            <div className={`${cardClass} space-y-4`}>
              <div className="flex items-center gap-2 text-indigo-600">
                <Tag className="w-4 h-4" />
                <span className="text-xs font-bold uppercase tracking-wider">The Basics</span>
              </div>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full text-lg font-medium border-b border-slate-100 focus:border-indigo-600 outline-none pb-2 transition-colors placeholder:text-slate-300"
                placeholder="Campaign Name..."
              />
              <div className="space-y-2 pt-2">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  Content Pillars
                </label>
                <div className="flex flex-wrap gap-2">
                  {pillars.map((p) => (
                    <span key={p} className={badgeClass}>
                      {p}
                      <button
                        onClick={() => removePillar(p)}
                        className="text-slate-300 hover:text-rose-500 transition-colors -mr-1"
                        aria-label={`Remove ${p}`}
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
                <div className="flex items-center gap-2 pt-1">
                  <input
                    value={pillarDraft}
                    onChange={(e) => setPillarDraft(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addPillar())}
                    placeholder="Add a pillar"
                    className="flex-1 text-xs border border-slate-200 rounded-lg px-2.5 py-1.5 outline-none focus:border-indigo-500"
                  />
                  <button
                    onClick={addPillar}
                    className="text-xs font-medium text-indigo-600 hover:text-indigo-700 flex items-center gap-1 px-2 py-1.5"
                  >
                    <Plus className="w-3 h-3" /> Add
                  </button>
                </div>
              </div>
            </div>

            {/* Timing & Location */}
            <div className={`${cardClass} space-y-4`}>
              <div className="flex items-center gap-2 text-indigo-600">
                <Calendar className="w-4 h-4" />
                <span className="text-xs font-bold uppercase tracking-wider">
                  Timing & Location
                </span>
              </div>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <CalendarIcon className="w-4 h-4 text-slate-300" />
                  <div className="flex-1 grid grid-cols-2 gap-2">
                    <input
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="text-xs border border-slate-200 rounded-lg px-2 py-1.5 outline-none focus:border-indigo-500"
                    />
                    <input
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      className="text-xs border border-slate-200 rounded-lg px-2 py-1.5 outline-none focus:border-indigo-500"
                    />
                  </div>
                </div>
                <p className="text-[11px] text-slate-400 pl-7">
                  {fmtDate(startDate)} — {fmtDate(endDate)}
                </p>
                <div className="flex items-center gap-3">
                  <Globe className="w-4 h-4 text-slate-300" />
                  <select
                    value={location}
                    onChange={(e) => handleLocationChange(e.target.value)}
                    className="flex-1 text-sm border border-slate-200 rounded-lg px-2.5 py-1.5 outline-none focus:border-indigo-500 bg-white"
                  >
                    {LOCATIONS.map((l) => (
                      <option key={l} value={l}>
                        {l}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Events */}
          <div className={cardClass}>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h4 className="font-semibold text-slate-900">Local Events & Holidays</h4>
                <p className="text-xs text-slate-500 mt-0.5">Auto-fetched for {location}</p>
              </div>
              <button
                onClick={refreshEvents}
                disabled={refreshing}
                className="text-xs text-indigo-600 font-medium hover:text-indigo-700 flex items-center gap-1.5 disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? "animate-spin" : ""}`} />
                Refresh Events
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {events.map((event) => {
                const [m, d] = event.date.split(" ");
                return (
                  <div
                    key={event.name}
                    className="p-3 bg-white rounded-xl border border-slate-200 flex items-center gap-3"
                  >
                    <div className="bg-slate-100 text-slate-600 rounded p-1.5 flex flex-col items-center justify-center min-w-[40px]">
                      <span className="text-[10px] font-bold leading-none">{m}</span>
                      <span className="text-sm font-bold leading-tight">{d}</span>
                    </div>
                    <div className="min-w-0">
                      <p className="font-medium text-slate-700 text-sm truncate">
                        {event.name}
                      </p>
                      <p className="text-[10px] text-slate-400">{event.category}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Platforms */}
          <div className={cardClass}>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h4 className="font-semibold text-slate-900">Platforms</h4>
                <p className="text-xs text-slate-500 mt-0.5">{selectedCount} selected</p>
              </div>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {PLATFORMS.map((p) => {
                const active = platforms[p.id];
                return (
                  <button
                    key={p.id}
                    onClick={() => togglePlatform(p.id)}
                    className={`aspect-square rounded-xl border-2 transition-all flex flex-col items-center justify-center gap-3 ${
                      active
                        ? "border-indigo-600 bg-indigo-50/50"
                        : "border-slate-200 bg-white hover:border-slate-300"
                    }`}
                  >
                    <p.icon className={`w-8 h-8 ${active ? p.color : "text-slate-400"}`} />
                    <span className="text-sm font-semibold text-slate-900">{p.name}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Target Audience */}
          <div className={cardClass}>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-indigo-600" />
                <div>
                  <h4 className="font-semibold text-slate-900">Target Audience</h4>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Pick one audience this campaign will speak to.
                  </p>
                </div>
              </div>
              {selectedAudienceId && (
                <button
                  onClick={() => setSelectedAudienceId(null)}
                  className="text-xs text-slate-500 hover:text-slate-700"
                >
                  Clear
                </button>
              )}
            </div>
            {audiences.length === 0 ? (
              <EmptyLink
                message="You haven't added any audiences yet."
                cta="Go to Brand Setup"
              />
            ) : (
              <div className="flex gap-3 overflow-x-auto pb-1 -mx-1 px-1 md:grid md:grid-cols-3 md:gap-3 md:overflow-visible">
                {audiences.map((a) => {
                  const isSelected = selectedAudienceId === a.id;
                  return (
                    <div
                      key={a.id}
                      onClick={() => setSelectedAudienceId(isSelected ? null : a.id)}
                      className={`relative p-4 rounded-xl border-2 transition-all cursor-pointer min-w-[200px] ${
                        isSelected
                          ? "border-indigo-600 bg-indigo-50/50 shadow-md"
                          : "border-slate-100 bg-white hover:border-slate-200"
                      }`}
                    >
                      {isSelected && (
                        <div className="absolute -top-2 -right-2 bg-indigo-600 text-white rounded-full p-1 shadow-lg">
                          <Check className="w-3 h-3" />
                        </div>
                      )}
                      <p
                        className={`text-sm font-bold ${
                          isSelected ? "text-indigo-900" : "text-slate-700"
                        }`}
                      >
                        {a.name}
                      </p>
                      <p className="text-[10px] text-slate-500 line-clamp-1 mt-0.5">
                        {a.roleAndIndustry}
                      </p>
                      <p className="text-[10px] text-slate-400 line-clamp-2 mt-1">
                        {a.challenge}
                      </p>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Product / Service */}
          <div className={cardClass}>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Package className="w-4 h-4 text-indigo-600" />
                <div>
                  <h4 className="font-semibold text-slate-900">Product / Service</h4>
                  <p className="text-xs text-slate-500 mt-0.5">
                    What are you promoting in this campaign?
                  </p>
                </div>
              </div>
              {selectedProductId && (
                <button
                  onClick={() => setSelectedProductId(null)}
                  className="text-xs text-slate-500 hover:text-slate-700"
                >
                  Clear
                </button>
              )}
            </div>
            {products.length === 0 ? (
              <EmptyLink
                message="You haven't added any products or services yet."
                cta="Go to Brand Setup"
              />
            ) : (
              <div className="flex gap-3 overflow-x-auto pb-1 -mx-1 px-1 md:grid md:grid-cols-3 md:gap-3 md:overflow-visible">
                {products.map((p) => {
                  const isSelected = selectedProductId === p.id;
                  return (
                    <div
                      key={p.id}
                      onClick={() => setSelectedProductId(isSelected ? null : p.id)}
                      className={`relative p-4 rounded-xl border-2 transition-all cursor-pointer min-w-[200px] ${
                        isSelected
                          ? "border-indigo-600 bg-indigo-50/50 shadow-md"
                          : "border-slate-100 bg-white hover:border-slate-200"
                      }`}
                    >
                      {isSelected && (
                        <div className="absolute -top-2 -right-2 bg-indigo-600 text-white rounded-full p-1 shadow-lg">
                          <Check className="w-3 h-3" />
                        </div>
                      )}
                      <p
                        className={`text-sm font-bold ${
                          isSelected ? "text-indigo-900" : "text-slate-700"
                        }`}
                      >
                        {p.name}
                      </p>
                      <p className="text-[10px] text-slate-500 line-clamp-2 mt-1">
                        {p.description}
                      </p>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {savedCampaign && (
            <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 flex items-center gap-2 text-sm text-emerald-800">
              <Check className="w-4 h-4" />
              Saved <span className="font-semibold">{savedCampaign.name}</span> — ready to
              generate.
            </div>
          )}

          {/* CTA */}
          <button
            onClick={handleGenerate}
            className="w-full bg-indigo-600 p-8 rounded-3xl text-white flex items-center justify-between group hover:bg-indigo-700 hover:-translate-y-0.5 hover:shadow-lg transition-all text-left shadow-sm"
          >
            <div>
              <h4 className="text-lg font-bold">Ready to Generate Strategy?</h4>
              <p className="text-indigo-100 text-sm mt-1">
                We'll use your brand data, audiences, and regional events.
              </p>
            </div>
            <div className="w-12 h-12 bg-white/10 rounded-full flex items-center justify-center group-hover:translate-x-2 transition-transform shrink-0">
              <ChevronRight className="w-6 h-6" />
            </div>
          </button>
        </div>
      </div>
    </AppLayout>
  );
}

