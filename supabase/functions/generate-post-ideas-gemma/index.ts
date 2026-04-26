const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const geminiApiKey = Deno.env.get("GEMINI_API_KEY");
    if (!geminiApiKey) {
      return new Response(
        JSON.stringify({ error: "GEMINI_API_KEY is not configured" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const { brandName, introduction, platforms, contentPillars, trendingContext, count } = await req.json();

    if (!brandName) {
      return new Response(
        JSON.stringify({ error: "brandName is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const numberOfPosts = Math.min(30, Math.max(1, count ?? 6));
    const platformList = (platforms ?? []).length > 0 ? platforms.join(", ") : "LinkedIn, Instagram";
    const pillarList = (contentPillars ?? []).filter(Boolean).join(", ") || "Brand Awareness, Thought Leadership";
    const variationSeed = Math.floor(Date.now() / 1000);

    const systemPrompt = `You are a Senior Social Media Strategist generating platform-specific post ideas. Return ONLY a valid JSON array — no markdown, no explanation, no code blocks.`;

    const userPrompt = `Generation seed: ${variationSeed} — produce UNIQUE ideas every time.

BRAND:
Name: ${brandName}
${introduction ? `About: ${introduction}` : ""}

CAMPAIGN:
Platforms: ${platformList}
Content Pillars: ${pillarList}
${trendingContext ? `\nTRENDING SIGNALS (weave relevant ones into TREND posts only):\n${trendingContext}` : ""}

TASK: Generate exactly ${numberOfPosts} post ideas. Distribute them across these content types:
- Educational (how-to, tips, myth-busting — NO product selling)
- Engagement (polls, questions, community)
- Inspirational (brand values, behind-the-scenes)
- Trend (tie to trending signals above if provided)
- Product-Focused (features, benefits, conversion — only ~30% max)

RULES:
1. Educational/Engagement/Inspirational/Trend posts must NOT mention products or use sales language
2. Each idea needs a strong hook — make the first sentence impossible to scroll past
3. Vary formats: Single Image, Carousel, Reel, Poll, Article, Text Post
4. Platform-fit: LinkedIn = professional/thought leadership, Instagram = visual/lifestyle, X/Twitter = concise/punchy
5. Every idea must have a concrete angle (framework, checklist, myth-bust, story, statistic, hot take)
6. Generate COMPLETELY DIFFERENT ideas — use the seed above for variety

Return ONLY this JSON array (no wrapping object):
[
  {
    "id": "idea-1",
    "title": "Specific actionable title (max 8 words)",
    "caption": "Ready-to-post caption (120-200 chars, includes 2-3 hashtags)",
    "platform": "LinkedIn | Instagram | X/Twitter | YouTube | Facebook | Blog Post",
    "contentType": "Educational | Promotional | UGC | Thought Leadership | Behind-the-Scenes | Trending | Engagement | Inspirational",
    "pillar": "which content pillar this serves",
    "hook": "Opening line — the scroll-stopper sentence"
  }
]

Generate exactly ${numberOfPosts} ideas now.`;

    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemma-4-31b-it:generateContent?key=${geminiApiKey}`;

    const geminiRes = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        system_instruction: { parts: [{ text: systemPrompt }] },
        contents: [{ role: "user", parts: [{ text: userPrompt }] }],
        generationConfig: {
          temperature: 0.85,
          maxOutputTokens: 8192,
        },
      }),
    });

    if (!geminiRes.ok) {
      const errText = await geminiRes.text();
      return new Response(
        JSON.stringify({ error: `Gemma API error ${geminiRes.status}: ${errText.slice(0, 300)}` }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const geminiData = await geminiRes.json();
    const rawText = geminiData.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!rawText) {
      return new Response(
        JSON.stringify({ error: "No content returned from Gemma" }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // Parse Gemma's plain text response — try several strategies
    let ideas: unknown[] = [];
    let parsed = false;

    const tryParse = (text: string): unknown[] | null => {
      try {
        const j = JSON.parse(text);
        return Array.isArray(j) ? j : (Array.isArray(j?.ideas) ? j.ideas : null);
      } catch {
        return null;
      }
    };

    // 1. Direct parse
    const direct = tryParse(rawText);
    if (direct) { ideas = direct; parsed = true; }

    // 2. Strip markdown fences ```json ... ```
    if (!parsed) {
      const stripped = rawText.replace(/^```[a-zA-Z]*\s*/m, "").replace(/\s*```\s*$/m, "").trim();
      const r = tryParse(stripped);
      if (r) { ideas = r; parsed = true; }
    }

    // 3. Extract first [...] block (handles prose before/after)
    if (!parsed) {
      const match = rawText.match(/(\[[\s\S]*\])/);
      if (match) {
        const r = tryParse(match[1]);
        if (r) { ideas = r; parsed = true; }
      }
    }

    // 4. Extract first {...} block (wrapped object)
    if (!parsed) {
      const match = rawText.match(/(\{[\s\S]*\})/);
      if (match) {
        const r = tryParse(match[1]);
        if (r) { ideas = r; parsed = true; }
      }
    }

    if (!parsed || ideas.length === 0) {
      console.error("[gemma] raw response (first 1000):", rawText.slice(0, 1000));
      return new Response(
        JSON.stringify({ error: "Failed to parse Gemma JSON response", raw: rawText.slice(0, 500) }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    return new Response(
      JSON.stringify({ success: true, ideas }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
