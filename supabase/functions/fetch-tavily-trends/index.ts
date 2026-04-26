const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const tavilyApiKey = Deno.env.get("TAVILY_API_KEY");
    if (!tavilyApiKey) {
      return new Response(
        JSON.stringify({ error: "TAVILY_API_KEY is not configured" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const { brandName, pillars } = await req.json();
    if (!brandName && (!pillars || pillars.length === 0)) {
      return new Response(
        JSON.stringify({ error: "brandName or pillars required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const pillarsToFetch: string[] = (pillars ?? []).filter(Boolean).slice(0, 4);
    if (pillarsToFetch.length === 0) pillarsToFetch.push(brandName);

    const resultsByPillar: Record<string, unknown[]> = {};

    await Promise.all(
      pillarsToFetch.map(async (pillar: string) => {
        const query = `${brandName} ${pillar} trends news 2025`;
        try {
          const res = await fetch("https://api.tavily.com/search", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              api_key: tavilyApiKey,
              query,
              search_depth: "basic",
              max_results: 10,
              include_answer: false,
            }),
          });
          if (!res.ok) return;
          const json = await res.json();
          resultsByPillar[pillar] = (json.results ?? []).slice(0, 10).map(
            (r: Record<string, unknown>, i: number) => ({
              id: `${pillar}-${i}-${String(r.url ?? "").slice(-16)}`,
              title: String(r.title ?? "").slice(0, 150),
              url: String(r.url ?? ""),
              content: String(r.content ?? "").slice(0, 300),
              score: Number(r.score ?? 0),
              publishedDate: r.published_date ?? undefined,
            }),
          );
        } catch {
          resultsByPillar[pillar] = [];
        }
      }),
    );

    return new Response(
      JSON.stringify({ success: true, resultsByPillar }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
