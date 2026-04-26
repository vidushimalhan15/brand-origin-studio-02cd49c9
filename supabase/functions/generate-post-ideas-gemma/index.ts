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

    const systemPrompt = `You output ONLY raw JSON arrays. No prose, no markdown, no explanation. Your entire response must start with [ and end with ].`;

    const userPrompt = `Brand: ${brandName}. About: ${introduction || "N/A"}. Platforms: ${platformList}. Content pillars: ${pillarList}.${trendingContext ? ` Trending signals: ${trendingContext.slice(0, 500)}.` : ""} Seed: ${variationSeed}.

Output a JSON array of exactly ${numberOfPosts} post ideas. Each element must have these exact keys: id, title, caption, platform, contentType, pillar, hook.

Rules:
- id: "idea-1" through "idea-${numberOfPosts}"
- title: max 8 words, specific and actionable
- caption: 120-200 chars, platform-appropriate, 2-3 hashtags
- platform: one of LinkedIn, Instagram, X/Twitter, YouTube, Facebook, Blog Post
- contentType: one of Educational, Thought Leadership, Behind-the-Scenes, Trending, Engagement, Inspirational, Promotional, UGC
- pillar: which content pillar this serves
- hook: one punchy scroll-stopping opening sentence
- Mix content types: ~40% Educational/Thought Leadership, ~30% Engagement/Inspirational, ~30% Promotional/Trending
- Vary platforms across the list above

Respond with ONLY the JSON array, starting with [ and ending with ]. No other text.`;

    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3-flash-preview:generateContent?key=${geminiApiKey}`;

    const geminiRes = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        system_instruction: { parts: [{ text: systemPrompt }] },
        contents: [{ role: "user", parts: [{ text: userPrompt }] }],
        generationConfig: {
          temperature: 0.85,
          maxOutputTokens: 8192,
          responseMimeType: "application/json",
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
    console.log("[gemma] full response:", JSON.stringify(geminiData).slice(0, 2000));

    const rawText = geminiData.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!rawText) {
      console.error("[gemma] no rawText. candidates:", JSON.stringify(geminiData.candidates ?? null));
      return new Response(
        JSON.stringify({ error: "No content returned from Gemma", debug: geminiData }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const fullText = rawText;
    console.log("[gemini3] rawText (first 1000):", fullText.slice(0, 1000));

    // Parse Gemma's response — try several strategies
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

    // 1. Direct parse of prefixed text
    const direct = tryParse(fullText);
    if (direct) { ideas = direct; parsed = true; }

    // 2. Strip markdown fences
    if (!parsed) {
      const stripped = fullText.replace(/^```[a-zA-Z]*\s*/m, "").replace(/\s*```\s*$/m, "").trim();
      const r = tryParse(stripped);
      if (r) { ideas = r; parsed = true; }
    }

    // 3. Extract first [...] block
    if (!parsed) {
      const match = fullText.match(/(\[[\s\S]*\])/);
      if (match) {
        const r = tryParse(match[1]);
        if (r) { ideas = r; parsed = true; }
      }
    }

    if (!parsed || ideas.length === 0) {
      console.error("[gemma] failed to parse. fullText (first 1000):", fullText.slice(0, 1000));
      return new Response(
        JSON.stringify({ error: "Failed to parse Gemma JSON response", raw: fullText.slice(0, 500) }),
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
