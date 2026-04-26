import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

async function callOpenAI(systemPrompt: string, userPrompt: string): Promise<string> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error("OPENAI_API_KEY is not configured");

  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: "gpt-4.1-mini",
      temperature: 0.3,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      response_format: { type: "json_object" },
    }),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`OpenAI API ${res.status}: ${text.slice(0, 200)}`);
  }
  const json = await res.json();
  return json?.choices?.[0]?.message?.content ?? "";
}

function extractJson<T>(text: string): T | null {
  try {
    return JSON.parse(text) as T;
  } catch {
    const match = text.match(/\{[\s\S]*\}/);
    if (!match) return null;
    try {
      return JSON.parse(match[0]) as T;
    } catch {
      return null;
    }
  }
}

async function fetchPageText(url: string): Promise<string> {
  try {
    const res = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (compatible; SocialFlowBot/1.0; +https://socialflow.app)",
        Accept: "text/html,application/xhtml+xml",
      },
      redirect: "follow",
    });
    if (!res.ok) return "";
    const html = await res.text();
    // Strip scripts/styles, then tags, collapse whitespace
    const cleaned = html
      .replace(/<script[\s\S]*?<\/script>/gi, " ")
      .replace(/<style[\s\S]*?<\/style>/gi, " ")
      .replace(/<noscript[\s\S]*?<\/noscript>/gi, " ")
      .replace(/<[^>]+>/g, " ")
      .replace(/\s+/g, " ")
      .trim();
    return cleaned.slice(0, 8000);
  } catch {
    return "";
  }
}

type AnalyzeResult = {
  brandName: string;
  introduction: string;
  error?: string;
};

export const analyzeBrandUrl = createServerFn({ method: "POST" })
  .inputValidator(
    z.object({
      url: z.string().min(3).max(500),
    }),
  )
  .handler(async ({ data }): Promise<AnalyzeResult> => {
    let url = data.url.trim();
    if (!/^https?:\/\//i.test(url)) url = `https://${url}`;

    const supabaseUrl = process.env.SUPABASE_URL ?? process.env.VITE_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_PUBLISHABLE_KEY ?? process.env.VITE_SUPABASE_PUBLISHABLE_KEY;

    if (!supabaseUrl || !supabaseKey) {
      throw new Error("Supabase environment variables are not configured");
    }

    try {
      // Use apify-universal to scrape + OpenAI summarise
      const res = await fetch(`${supabaseUrl}/functions/v1/apify-universal`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${supabaseKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action: "scrapeWebsiteText",
          websiteUrl: url,
          options: { maxPagesPerCrawl: 1 },
        }),
      });

      if (!res.ok) {
        const text = await res.text().catch(() => "");
        throw new Error(`Scraper error ${res.status}: ${text.slice(0, 200)}`);
      }

      const result = await res.json();

      if (!result.success || !result.data?.data?.[0]) {
        return { brandName: "", introduction: "", error: "Could not scrape the URL." };
      }

      const scraped = result.data.data[0];
      const brandName = String(scraped.extracted_brand_name ?? "").slice(0, 120);
      const introduction = String(scraped.openai_processed_summary ?? scraped.textContent ?? "").slice(0, 600);

      if (!brandName && !introduction) {
        return { brandName: "", introduction: "", error: "Could not extract brand details from this URL." };
      }

      return { brandName, introduction };
    } catch (err) {
      console.error("analyzeBrandUrl failed:", err);
      return {
        brandName: "",
        introduction: "",
        error: err instanceof Error ? err.message : "Failed to analyze brand. Please try again.",
      };
    }
  });


type PeecCompetitor = {
  name: string;
  shareOfVoice: number;
  sentiment: number;
};

type PeecContentRec = {
  percentage: number;
  reason: string;
};

export type PeecInsightsFull = {
  visibility: { shareOfVoice: number };
  sentiment: number;
  position: number;
  competitors: PeecCompetitor[];
  contentRecommendations: {
    educational: PeecContentRec;
    ugc: PeecContentRec;
  };
  postIdeation: {
    volumeRankedPrompts: Array<{ prompt: string; rank: number; volume: string }>;
    chatGaps: string[];
    ugcBrief: string;
  };
  error?: string;
};

export const fetchPeecInsights = createServerFn({ method: "POST" })
  .inputValidator(
    z.object({
      brandName: z.string().min(1).max(120),
      introduction: z.string().min(1).max(600),
    }),
  )
  .handler(async ({ data }): Promise<PeecInsightsFull> => {
    const supabaseUrl = process.env.SUPABASE_URL ?? process.env.VITE_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_PUBLISHABLE_KEY ?? process.env.VITE_SUPABASE_PUBLISHABLE_KEY;

    if (!supabaseUrl || !supabaseKey) {
      throw new Error("Supabase environment variables are not configured");
    }

    const callEdge = async () => {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 25000);
      try {
        return await fetch(`${supabaseUrl}/functions/v1/fetch-peec-insights`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${supabaseKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            brandName: data.brandName,
            brandDescription: data.introduction,
          }),
          signal: controller.signal,
        });
      } finally {
        clearTimeout(timeout);
      }
    };

    try {
      let res = await callEdge();

      // Retry once on 503 (cold start)
      if (res.status === 503) {
        await new Promise((r) => setTimeout(r, 1500));
        res = await callEdge();
      }

      if (!res.ok) {
        const text = await res.text().catch(() => "");
        throw new Error(`Peec edge function error ${res.status}: ${text.slice(0, 200)}`);
      }

      const result = await res.json();

      // Edge function may return { success, data } or data directly
      const d = result.data ?? result;
      const sovRaw = d.visibility?.shareOfVoice ?? 0;
      // shareOfVoice comes as a decimal (0.177) — convert to %
      const shareOfVoice = sovRaw > 1 ? Math.round(sovRaw) : Math.round(sovRaw * 100);

      const eduRec = d.contentRecommendations?.educational;
      const ugcRec = d.contentRecommendations?.ugc;

      return {
        visibility: { shareOfVoice },
        sentiment: d.sentiment ?? 0,
        position: d.position ?? 0,
        competitors: (d.competitors ?? [])
          .filter((c: PeecCompetitor) => c.name?.trim())
          .slice(0, 6)
          .map((c: PeecCompetitor) => ({
            name: String(c.name ?? "").trim(),
            shareOfVoice: Math.round((c.shareOfVoice > 1 ? c.shareOfVoice : c.shareOfVoice * 100) * 10) / 10,
            sentiment: Number(c.sentiment ?? 0),
          })),
        contentRecommendations: {
          educational: {
            percentage: eduRec?.suggestedPercentage ?? (eduRec?.recommended ? 60 : 0),
            reason: String(eduRec?.reason ?? ""),
          },
          ugc: {
            percentage: ugcRec?.suggestedPercentage ?? (ugcRec?.recommended ? 40 : 0),
            reason: String(ugcRec?.reason ?? ""),
          },
        },
        postIdeation: {
          volumeRankedPrompts: (d.postIdeation?.volumeRankedPrompts ?? []).slice(0, 20).map(
            (p: { prompt?: string; text?: string; rank?: number; volume?: number | string }, i: number) => ({
              prompt: String(p.prompt ?? p.text ?? "").slice(0, 200),
              rank: typeof p.rank === "number" ? p.rank : i + 1,
              volume: String(p.volume ?? ""),
            }),
          ),
          chatGaps: (d.postIdeation?.chatGaps ?? []).slice(0, 10).map((g: { prompt?: string } | string) =>
            String(typeof g === "object" ? (g.prompt ?? "") : g).slice(0, 200)
          ),
          ugcBrief: Array.isArray(d.postIdeation?.ugcBrief)
            ? (d.postIdeation.ugcBrief as string[]).slice(0, 15).map((s: string) => String(s).slice(0, 200)).join("|||")
            : String(d.postIdeation?.ugcBrief ?? "").slice(0, 1500),
        },
      };
    } catch (err) {
      console.error("fetchPeecInsights failed:", err);
      return {
        visibility: { shareOfVoice: 0 },
        sentiment: 0,
        position: 0,
        competitors: [],
        contentRecommendations: { educational: { percentage: 0, reason: "" }, ugc: { percentage: 0, reason: "" } },
        postIdeation: { volumeRankedPrompts: [], chatGaps: [], ugcBrief: "" },
        error: err instanceof Error ? err.message : "Failed to fetch insights.",
      };
    }
  });

type SuggestedAudience = {
  name: string;
  roleAndIndustry: string;
  challenge: string;
};

type SuggestAudiencesResult = {
  audiences: SuggestedAudience[];
  error?: string;
};

export const suggestAudiences = createServerFn({ method: "POST" })
  .inputValidator(
    z.object({
      brandName: z.string().min(1).max(120),
      introduction: z.string().min(1).max(600),
    }),
  )
  .handler(async ({ data }): Promise<SuggestAudiencesResult> => {
    const system =
      "You are a B2B audience strategist. Given a brand and its introduction, generate 3 distinct, realistic " +
      "target audience profiles this brand should market to. Reply with strict JSON only.";

    const user = `Brand: ${data.brandName}
Introduction: ${data.introduction}

Return JSON in this exact shape:
{
  "audiences": [
    {
      "name": "Short audience label, e.g. 'Marketing Managers'",
      "roleAndIndustry": "Role and industry context, e.g. 'Operations in Tech'",
      "challenge": "1-2 sentence description of the primary pain point this audience faces"
    }
    // exactly 3 distinct audiences
  ]
}`;

    try {
      const raw = await callOpenAI(system, user);
      const parsed = extractJson<SuggestAudiencesResult>(raw);
      if (!parsed?.audiences?.length) {
        return { audiences: [], error: "Could not generate audiences." };
      }
      return {
        audiences: parsed.audiences.slice(0, 3).map((a) => ({
          name: String(a.name ?? "").slice(0, 120),
          roleAndIndustry: String(a.roleAndIndustry ?? "").slice(0, 200),
          challenge: String(a.challenge ?? "").slice(0, 400),
        })),
      };
    } catch (err) {
      console.error("suggestAudiences failed:", err);
      return {
        audiences: [],
        error:
          err instanceof Error ? err.message : "Failed to suggest audiences.",
      };
    }
  });

type FetchEventsResult = {
  events: { date: string; event: string; focus: string; category: string }[];
  error?: string;
};

export const fetchLocationEvents = createServerFn({ method: "POST" })
  .inputValidator(
    z.object({
      location: z.string().min(1).max(120),
      startDate: z.string(),
      endDate: z.string(),
    }),
  )
  .handler(async ({ data }): Promise<FetchEventsResult> => {
    const system =
      "You are a marketing calendar expert. Given a location and date range, return relevant local holidays, cultural events, and awareness days that a brand could leverage for content. Reply with strict JSON only.";

    const user = `Location: ${data.location}
Date range: ${data.startDate} to ${data.endDate}

Return 8–10 relevant events as JSON. Include holidays, awareness days, cultural moments, and commerce opportunities:
{
  "events": [
    {
      "date": "YYYY-MM-DD",
      "event": "Event name",
      "focus": "How a brand could use this for content",
      "category": "Holiday | Cultural | Awareness | Commerce | Historical"
    }
  ]
}`;

    try {
      const raw = await callOpenAI(system, user);
      const parsed = extractJson<FetchEventsResult>(raw);
      if (!parsed?.events?.length) return { events: [] };
      return {
        events: parsed.events.slice(0, 10).map((e) => ({
          date: String(e.date ?? ""),
          event: String(e.event ?? "").slice(0, 100),
          focus: String(e.focus ?? "").slice(0, 200),
          category: String(e.category ?? "Cultural"),
        })),
      };
    } catch (err) {
      return { events: [], error: err instanceof Error ? err.message : "Failed to fetch events." };
    }
  });

type AutoAnalyzePillarsResult = {
  topics: string[];
  error?: string;
};

export const autoAnalyzePillars = createServerFn({ method: "POST" })
  .inputValidator(
    z.object({
      brandName: z.string().min(1).max(120),
      introduction: z.string().min(1).max(600),
      campaignName: z.string().max(120).optional().default(""),
    }),
  )
  .handler(async ({ data }): Promise<AutoAnalyzePillarsResult> => {
    const system =
      "You are a content strategist. Given a brand and optional campaign name, generate exactly 4 concise content pillar topics (2-5 words each) that this brand should focus on for their campaign. Reply with strict JSON only.";

    const user = `Brand: ${data.brandName}
Introduction: ${data.introduction}
${data.campaignName ? `Campaign: ${data.campaignName}` : ""}

Return JSON in this exact shape:
{"topics": ["Topic 1", "Topic 2", "Topic 3", "Topic 4"]}`;

    try {
      const raw = await callOpenAI(system, user);
      const parsed = extractJson<{ topics: string[] }>(raw);
      if (!parsed?.topics?.length) {
        return { topics: [], error: "Could not generate pillars." };
      }
      return { topics: parsed.topics.slice(0, 4).map((t) => String(t).slice(0, 40)) };
    } catch (err) {
      return { topics: [], error: err instanceof Error ? err.message : "Failed to analyze." };
    }
  });

type DraftDescriptionResult = {
  description: string;
  error?: string;
};

export const draftProductDescription = createServerFn({ method: "POST" })
  .inputValidator(
    z.object({
      productName: z.string().min(1).max(120),
      brandName: z.string().max(120).optional().default(""),
      introduction: z.string().max(600).optional().default(""),
      currentDescription: z.string().max(600).optional().default(""),
    }),
  )
  .handler(async ({ data }): Promise<DraftDescriptionResult> => {
    const system =
      "You are a senior product copywriter. Write a compelling 2-3 sentence product or service description " +
      "that matches the brand's tone of voice. Be specific, benefit-led, and concise. " +
      "Reply with strict JSON only.";

    const user = `Brand: ${data.brandName || "(unspecified)"}
Brand introduction: ${data.introduction || "(none)"}
Product/service name: ${data.productName}
${data.currentDescription ? `Current draft to expand: ${data.currentDescription}` : ""}

Return JSON in this exact shape:
{"description": "2-3 sentence description"}`;

    try {
      const raw = await callOpenAI(system, user);
      const parsed = extractJson<{ description: string }>(raw);
      if (!parsed?.description) {
        return { description: "", error: "Could not draft a description." };
      }
      return { description: parsed.description.slice(0, 600) };
    } catch (err) {
      console.error("draftProductDescription failed:", err);
      return {
        description: "",
        error:
          err instanceof Error ? err.message : "Failed to draft description.",
      };
    }
  });

// ── Tavily Trend Search ──────────────────────────────────────────────────────

type TavilyResult = {
  id?: string;
  title: string;
  url: string;
  content: string;
  score: number;
  publishedDate?: string;
};

type TavilySearchResult = {
  results: TavilyResult[];
  error?: string;
};

export const searchTavily = createServerFn({ method: "POST" })
  .inputValidator(
    z.object({
      query: z.string().min(1).max(300),
    }),
  )
  .handler(async ({ data }): Promise<TavilySearchResult> => {
    const apiKey = process.env.TAVILY_API_KEY;
    if (!apiKey) throw new Error("TAVILY_API_KEY is not configured");

    try {
      const res = await fetch("https://api.tavily.com/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          api_key: apiKey,
          query: data.query,
          search_depth: "basic",
          max_results: 10,
          include_answer: false,
        }),
      });

      if (!res.ok) {
        const text = await res.text().catch(() => "");
        throw new Error(`Tavily API ${res.status}: ${text.slice(0, 200)}`);
      }

      const json = await res.json();
      const results: TavilyResult[] = (json.results ?? []).slice(0, 10).map(
        (r: { title?: string; url?: string; content?: string; score?: number; published_date?: string }) => ({
          title: String(r.title ?? "").slice(0, 150),
          url: String(r.url ?? ""),
          content: String(r.content ?? "").slice(0, 300),
          score: Number(r.score ?? 0),
          publishedDate: r.published_date ? String(r.published_date) : undefined,
        }),
      );

      return { results };
    } catch (err) {
      console.error("searchTavily failed:", err);
      return {
        results: [],
        error: err instanceof Error ? err.message : "Tavily search failed.",
      };
    }
  });

// Search Tavily for a specific pillar/topic — routed through Supabase Edge Function
export const searchTavilyByPillar = createServerFn({ method: "POST" })
  .inputValidator(
    z.object({
      brandName: z.string().min(1).max(120),
      pillars: z.array(z.string()).min(1),
    }),
  )
  .handler(async ({ data }): Promise<{ resultsByPillar: Record<string, TavilyResult[]>; error?: string }> => {
    const supabaseUrl = process.env.SUPABASE_URL ?? process.env.VITE_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_PUBLISHABLE_KEY ?? process.env.VITE_SUPABASE_PUBLISHABLE_KEY;

    if (!supabaseUrl || !supabaseKey) {
      throw new Error("Supabase environment variables are not configured");
    }

    try {
      const res = await fetch(`${supabaseUrl}/functions/v1/fetch-tavily-trends`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${supabaseKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ brandName: data.brandName, pillars: data.pillars }),
      });

      if (!res.ok) {
        const text = await res.text().catch(() => "");
        throw new Error(`fetch-tavily-trends error ${res.status}: ${text.slice(0, 200)}`);
      }

      const json = await res.json();
      if (!json.success) {
        return { resultsByPillar: {}, error: json.error ?? "Edge function returned an error." };
      }

      return { resultsByPillar: json.resultsByPillar ?? {} };
    } catch (err) {
      console.error("searchTavilyByPillar failed:", err);
      return {
        resultsByPillar: {},
        error: err instanceof Error ? err.message : "Tavily search failed.",
      };
    }
  });

// ── Generate Post Ideas ──────────────────────────────────────────────────────

export type GeneratedPost = {
  id: string;
  ideaId: string;
  title: string;
  platform: string;
  contentType: string;
  pillar: string;
  peecSource?: "ai_visibility" | "reputation_fix" | null;
  peecSignal?: string;
  content: string;
  approved: boolean;
};

export const generatePostContent = createServerFn({ method: "POST" })
  .inputValidator(
    z.object({
      brandName: z.string().min(1).max(120),
      introduction: z.string().max(600).optional().default(""),
      idea: z.object({
        id: z.string(),
        title: z.string(),
        caption: z.string(),
        platform: z.string(),
        contentType: z.string(),
        pillar: z.string(),
        hook: z.string(),
        peecSource: z.enum(["ai_visibility", "reputation_fix"]).nullable().optional(),
        peecSignal: z.string().optional(),
      }),
    }),
  )
  .handler(async ({ data }): Promise<{ content: string; error?: string; success?: boolean }> => {
    const supabaseUrl = process.env.SUPABASE_URL ?? process.env.VITE_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_PUBLISHABLE_KEY ?? process.env.VITE_SUPABASE_PUBLISHABLE_KEY;

    if (!supabaseUrl || !supabaseKey) {
      return { content: "", error: "Supabase environment variables are not configured." };
    }

    try {
      const res = await fetch(`${supabaseUrl}/functions/v1/generate-content-gemini`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${supabaseKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          brandName: data.brandName,
          introduction: data.introduction,
          idea: data.idea,
          contentFormat: "Text Post",
          length: "Medium",
        }),
      });

      if (!res.ok) {
        const text = await res.text().catch(() => "");
        return { content: "", error: `Generation failed (${res.status}): ${text.slice(0, 200)}` };
      }

      const json = await res.json();
      if (json.error) return { content: "", error: json.error };
      return { content: String(json.content ?? "") };
    } catch (err) {
      return { content: "", error: err instanceof Error ? err.message : "Failed to generate content." };
    }
  });

export type PostIdea = {
  id: string;
  title: string;
  caption: string;
  platform: string;
  contentType: string;
  pillar: string;
  hook: string;
  peecSource?: "ai_visibility" | "reputation_fix" | null;
  peecSignal?: string; // the specific question/negative point this idea addresses
};

type GeneratePostIdeasResult = {
  ideas: PostIdea[];
  error?: string;
};

export const generatePostIdeas = createServerFn({ method: "POST" })
  .inputValidator(
    z.object({
      brandName: z.string().min(1).max(120),
      introduction: z.string().max(600).optional().default(""),
      platforms: z.array(z.string()).optional().default([]),
      contentPillars: z.array(z.string()).optional().default([]),
      trendingContext: z.string().max(4000).optional().default(""),
      count: z.number().min(1).max(30).optional().default(6),
    }),
  )
  .handler(async ({ data }): Promise<GeneratePostIdeasResult> => {
    const supabaseUrl = process.env.SUPABASE_URL ?? process.env.VITE_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_PUBLISHABLE_KEY ?? process.env.VITE_SUPABASE_PUBLISHABLE_KEY;

    if (!supabaseUrl || !supabaseKey) {
      return { ideas: [], error: "Supabase environment variables are not configured." };
    }

    try {
      const res = await fetch(`${supabaseUrl}/functions/v1/generate-post-ideas-gemma`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${supabaseKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          brandName: data.brandName,
          introduction: data.introduction,
          platforms: data.platforms,
          contentPillars: data.contentPillars,
          trendingContext: data.trendingContext,
          count: data.count,
          model: "gemini-3-flash-preview",
        }),
      });

      if (!res.ok) {
        const text = await res.text().catch(() => "");
        return { ideas: [], error: `Generation failed (${res.status}): ${text.slice(0, 200)}` };
      }

      const json = await res.json();
      if (json.error) return { ideas: [], error: json.error };

      const raw: unknown[] = Array.isArray(json.ideas) ? json.ideas : [];
      return {
        ideas: raw.slice(0, data.count).map((idea: any, i) => ({
          id: String(idea.id ?? `idea-${i + 1}`),
          title: String(idea.title ?? "").slice(0, 80),
          caption: String(idea.caption ?? "").replace(/#\w+/g, "").replace(/\s{2,}/g, " ").trim().slice(0, 300),
          platform: String(idea.platform ?? "LinkedIn"),
          contentType: String(idea.contentType ?? "Educational"),
          pillar: String(idea.pillar ?? ""),
          hook: String(idea.hook ?? "").replace(/#\w+/g, "").replace(/\s{2,}/g, " ").trim().slice(0, 150),
          peecSource: idea.peecSource ?? null,
          peecSignal: idea.peecSignal ? String(idea.peecSignal).slice(0, 200) : undefined,
        })),
      };
    } catch (err) {
      console.error("generatePostIdeas failed:", err);
      return { ideas: [], error: err instanceof Error ? err.message : "Failed to generate ideas." };
    }
  });
