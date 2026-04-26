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

    const userPrompt = `Brand: ${brandName}
About: ${introduction || "N/A"}
Platforms to use (ONLY these): ${platformList}
Content pillars: ${pillarList}
Seed: ${variationSeed}
${trendingContext ? `\n--- CONTEXT & SIGNALS ---\n${trendingContext}\n--- END SIGNALS ---` : ""}

Generate exactly ${numberOfPosts} post ideas as a JSON array.

IMPORTANT RULES FOR PEEC SIGNALS:
- If context includes "PEEC AI VISIBILITY" questions: create dedicated posts that position ${brandName} as THE answer to those questions. Set peecSource="ai_visibility" and peecSignal=the exact question being addressed.
- If context includes "PEEC REPUTATION FIX" negatives: create posts using real customer stories or facts to counter each negative. Set peecSource="reputation_fix" and peecSignal=the exact negative being countered.
- For all other posts: peecSource=null, peecSignal=null.

Each JSON object must have EXACTLY these keys:
- id: "idea-1" to "idea-${numberOfPosts}"
- title: max 8 words, specific
- caption: 120-200 chars, absolutely NO hashtags (do not include any # symbols anywhere), ready to post
- hook: NO hashtags, no # symbols
- title: NO hashtags, no # symbols
- platform: MUST be one of the provided platforms: ${platformList}
- contentType: one of Educational, Thought Leadership, Behind-the-Scenes, Trending, Engagement, Inspirational, Promotional, UGC
- pillar: which content pillar this serves
- hook: one punchy scroll-stopping sentence
- peecSource: "ai_visibility" | "reputation_fix" | null
- peecSignal: the specific question or negative point this post addresses, or null

Distribute across content types: ~40% Educational/Thought Leadership, ~30% Engagement/Inspirational, remainder Promotional/Trending/Peec.
Vary platforms across: ${platformList}.

Return ONLY the raw JSON array. No prose. No markdown. Start with [ end with ].`;

    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${geminiApiKey}`;

    const geminiRes = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ role: "user", parts: [{ text: systemPrompt + "\n\n" + userPrompt }] }],
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
