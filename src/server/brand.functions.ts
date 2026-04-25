import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const LOVABLE_AI_URL = "https://ai.gateway.lovable.dev/v1/chat/completions";

async function callGemini(systemPrompt: string, userPrompt: string): Promise<string> {
  const apiKey = process.env.LOVABLE_API_KEY;
  if (!apiKey) throw new Error("LOVABLE_API_KEY is not configured");

  const res = await fetch(LOVABLE_AI_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "google/gemini-2.5-flash",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
    }),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`AI gateway ${res.status}: ${text.slice(0, 200)}`);
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

    const pageText = await fetchPageText(url);

    const system =
      "You are a brand analyst. Given content scraped from a company's website or profile page, " +
      "extract the brand's name and write an engaging 2-3 sentence introduction describing what the brand does, " +
      "who it serves, and what makes it distinctive. Reply with strict JSON only.";

    const user = `URL: ${url}

Scraped content:
"""
${pageText || "(no content could be scraped — infer from the URL)"}
"""

Return JSON in this exact shape:
{"brandName": "string", "introduction": "string (2-3 engaging sentences)"}`;

    try {
      const raw = await callGemini(system, user);
      const parsed = extractJson<{ brandName: string; introduction: string }>(raw);
      if (!parsed?.brandName || !parsed?.introduction) {
        return {
          brandName: "",
          introduction: "",
          error: "Could not parse brand details from this URL.",
        };
      }
      return {
        brandName: parsed.brandName.slice(0, 120),
        introduction: parsed.introduction.slice(0, 600),
      };
    } catch (err) {
      console.error("analyzeBrandUrl failed:", err);
      return {
        brandName: "",
        introduction: "",
        error:
          err instanceof Error
            ? err.message
            : "Failed to analyze brand. Please try again.",
      };
    }
  });

type PeecPrompt = {
  prompt: string;
  rank: number; // 1-based
  volume: string; // e.g. "12.4k/mo"
};

type PeecInsights = {
  prompts: PeecPrompt[];
  strategy: {
    name: string;
    rationale: string;
    suggestedTemplates: string[];
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
  .handler(async ({ data }): Promise<PeecInsights> => {
    const system =
      "You are Peec AI, a content strategy engine that simulates how often AI assistants are asked about a brand. " +
      "Given a brand and its introduction, generate realistic high-volume prompts people ask AI tools about this brand " +
      "and recommend a content strategy. Reply with strict JSON only.";

    const user = `Brand: ${data.brandName}
Introduction: ${data.introduction}

Generate the following JSON:
{
  "prompts": [
    { "prompt": "Short natural prompt people ask AI", "rank": 1, "volume": "e.g. 12.4k/mo" }
    // 5 items, ranked 1 (highest volume) to 5
  ],
  "strategy": {
    "name": "Either 'Education-First', 'Product-Heavy', 'Authority-Building', 'Community-Led', or 'Comparison-Focused'",
    "rationale": "1-2 sentences explaining why, based on current AI visibility signals",
    "suggestedTemplates": ["3 short content template names"]
  }
}`;

    try {
      const raw = await callGemini(system, user);
      const parsed = extractJson<PeecInsights>(raw);
      if (!parsed?.prompts || !parsed?.strategy) {
        return {
          prompts: [],
          strategy: { name: "", rationale: "", suggestedTemplates: [] },
          error: "Could not generate insights.",
        };
      }
      return {
        prompts: parsed.prompts.slice(0, 5).map((p, i) => ({
          prompt: String(p.prompt ?? "").slice(0, 200),
          rank: typeof p.rank === "number" ? p.rank : i + 1,
          volume: String(p.volume ?? ""),
        })),
        strategy: {
          name: String(parsed.strategy.name ?? "").slice(0, 60),
          rationale: String(parsed.strategy.rationale ?? "").slice(0, 400),
          suggestedTemplates: (parsed.strategy.suggestedTemplates ?? [])
            .slice(0, 5)
            .map((t) => String(t).slice(0, 80)),
        },
      };
    } catch (err) {
      console.error("fetchPeecInsights failed:", err);
      return {
        prompts: [],
        strategy: { name: "", rationale: "", suggestedTemplates: [] },
        error:
          err instanceof Error ? err.message : "Failed to fetch insights.",
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
      const raw = await callGemini(system, user);
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
