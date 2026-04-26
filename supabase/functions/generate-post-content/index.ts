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

    const { brandName, introduction, idea } = await req.json();

    if (!brandName || !idea) {
      return new Response(
        JSON.stringify({ error: "brandName and idea are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const platformGuidance: Record<string, string> = {
      LinkedIn: "professional tone, 150-300 words, structured paragraphs, 3-5 relevant hashtags at end",
      Instagram: "conversational and visual tone, 80-150 words, 8-15 hashtags at end, emoji-friendly",
      "X/Twitter": "punchy, max 280 chars for main tweet, no hashtags in body",
      Facebook: "friendly community tone, 100-200 words, 2-3 hashtags",
      YouTube: "engaging description, 100-200 words, include relevant keywords",
      "Blog Post": "informative tone, 200-400 words, professional structure with subheadings suggested",
    };

    const guide = platformGuidance[idea.platform] ?? "professional tone, 150-250 words";

    const prompt = `You are a social media content writer for ${brandName}.

Brand: ${brandName}
About: ${introduction || "N/A"}
Platform: ${idea.platform}
Platform guidance: ${guide}

Post idea to expand into full content:
- Title: ${idea.title}
- Hook: ${idea.hook}
- Caption draft: ${idea.caption}
- Content type: ${idea.contentType}
- Content pillar: ${idea.pillar}
${idea.peecSource === "ai_visibility" ? `- AI Visibility goal: Position ${brandName} as the answer to: "${idea.peecSignal}"` : ""}
${idea.peecSource === "reputation_fix" ? `- Reputation goal: Counter this negative narrative with real brand stories: "${idea.peecSignal}"` : ""}

Write a complete, ready-to-post caption for ${idea.platform}. Follow the platform guidance strictly.
Rules:
- Start with the hook
- Do NOT include any markdown bold/italic formatting (no ** or *)
- Do NOT include em dashes (—)
- Hashtags only at the very end if platform calls for them
- Output ONLY the final caption text, nothing else. No labels, no "Caption:", no explanation.`;

    const url = `https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent?key=${geminiApiKey}`;

    const geminiRes = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.75, maxOutputTokens: 1024 },
      }),
    });

    if (!geminiRes.ok) {
      const errText = await geminiRes.text();
      return new Response(
        JSON.stringify({ error: `Gemini API error ${geminiRes.status}: ${errText.slice(0, 300)}` }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const geminiData = await geminiRes.json();
    const rawText = geminiData.candidates?.[0]?.content?.parts?.[0]?.text?.trim() ?? "";

    if (!rawText) {
      return new Response(
        JSON.stringify({ error: "No content returned from Gemini" }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // Clean up output
    const cleaned = rawText
      .replace(/^```[a-zA-Z]*\s*/m, "").replace(/\s*```\s*$/m, "")
      .replace(/\*{1,2}([^*]+)\*{1,2}/g, "$1")
      .replace(/[\u2014\u2013]/g, "-")
      .trim();

    return new Response(
      JSON.stringify({ success: true, content: cleaned }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
