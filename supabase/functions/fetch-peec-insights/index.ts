import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const PEEC_API_KEY = Deno.env.get('PEEC_API');
const PEEC_BASE_URL = 'https://api.peec.ai/customer/v1';

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    if (!PEEC_API_KEY) throw new Error('PEEC_API not configured');

    const { brandName } = await req.json();
    if (!brandName) throw new Error('brandName is required');

    const headers = {
      'x-api-key': PEEC_API_KEY,
      'Content-Type': 'application/json',
    };

    const fmt = (d: Date) => d.toISOString().split('T')[0];
    const today = new Date();
    const startDate = new Date(today);
    startDate.setDate(today.getDate() - 30);

    // ── 1. Fetch brands ──────────────────────────────────────────────────────
    const brandsRes = await fetch(`${PEEC_BASE_URL}/brands?limit=50`, { headers });
    const brandsData = brandsRes.ok ? await brandsRes.json() : {};
    let allBrands: { id: string; name: string; domains: string[]; is_own?: boolean }[] =
      brandsData.data || brandsData.brands || [];

    // Match: exact → partial contains → is_own flag
    let matchedBrand = allBrands.find(
      (b) => b.name.toLowerCase() === brandName.toLowerCase()
    ) || allBrands.find(
      (b) => b.name.toLowerCase().includes(brandName.toLowerCase()) ||
             brandName.toLowerCase().includes(b.name.toLowerCase())
    ) || allBrands.find((b) => b.is_own === true);

    if (!matchedBrand) {
      const createRes = await fetch(`${PEEC_BASE_URL}/brands`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ name: brandName, is_own: true }),
      });
      const createData = createRes.ok ? await createRes.json() : {};
      const newBrand = createData.data || createData.brand || createData;
      if (newBrand?.id) {
        allBrands = [...allBrands, newBrand];
        matchedBrand = newBrand;
      }
    }

    // ── 2. Fetch brand report (share of voice + sentiment) ───────────────────
    const reportRes = await fetch(`${PEEC_BASE_URL}/reports/brands`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ start_date: fmt(startDate), end_date: fmt(today), limit: 50 }),
    });
    const reportData = reportRes.ok ? await reportRes.json() : {};
    const rows: any[] = Array.isArray(reportData.data)
      ? reportData.data
      : (reportData.data?.rows || reportData.rows || []);

    const findRow = (brandId: string, bName?: string) =>
      rows.find((r) => r.brand?.id === brandId) ||
      (bName ? rows.find((r) => r.brand?.name?.toLowerCase() === bName.toLowerCase()) : null);

    const brandRow = matchedBrand
      ? findRow(matchedBrand.id, matchedBrand.name)
      : rows.find((r) => r.brand?.name?.toLowerCase() === brandName.toLowerCase());

    const competitors = allBrands
      .filter((b) => b.id !== matchedBrand?.id)
      .map((b) => {
        const row = findRow(b.id, b.name);
        return { name: b.name, shareOfVoice: row?.share_of_voice ?? null, sentiment: row?.sentiment ?? null };
      })
      .sort((a, b) => (b.shareOfVoice ?? 0) - (a.shareOfVoice ?? 0));

    // ── 3. volumeRankedPrompts derived from chats after chat pipeline runs ──────
    // (The /prompts endpoint returns empty text for this account — we use chat questions instead)
    let volumeRankedPrompts: { id: string; text: string; volume: number }[] = [];
    let talkingPoints: string[] = [];

    // ── 5. Fetch recent chats where brand was tracked ────────────────────────
    let contentRecommendations: any = null;
    let chatGaps: { prompt: string; competitorWins: { name: string; position: number }[] }[] = [];
    let ugcBrief: string[] = [];

    if (matchedBrand) {
      const chatsUrl = `${PEEC_BASE_URL}/chats?brand_id=${matchedBrand.id}&limit=50&start_date=${fmt(startDate)}&end_date=${fmt(today)}`;
      const chatsRes = await fetch(chatsUrl, { headers });
      const chatsData = chatsRes.ok ? await chatsRes.json() : {};
      const recentChats: any[] = chatsData.data || chatsData.chats || [];
      console.log('[peec] chats count:', recentChats.length);

      // ── 6. Fetch chat content: question + position + UGC objections ──────
      const rawResults = await Promise.all(
        recentChats.slice(0, 30).map(async (chat: any) => {
          try {
            const contentRes = await fetch(`${PEEC_BASE_URL}/chats/${chat.id}/content`, { headers });
            const contentData = contentRes.ok ? await contentRes.json() : {};
            const content = contentData.data || contentData;

            const messages: any[] = content.messages || [];
            const userMessage = messages.find((m: any) => m.role === 'user');
            const questionText = userMessage?.content || userMessage?.text || null;

            // Extract assistant messages for UGC objection brief
            const assistantMessages: string[] = messages
              .filter((m: any) => m.role === 'assistant')
              .map((m: any) => m.content || m.text || '')
              .filter(Boolean);

            const brandsMentioned: any[] = content.brands_mentioned || [];
            const brandEntry = brandsMentioned.find((bm: any) => bm.id === matchedBrand!.id);

            // Competitors ranked above our brand in this chat
            const brandPos = brandEntry?.position ?? null;
            const competitorWins = brandsMentioned
              .filter((bm: any) => bm.id !== matchedBrand!.id && bm.position != null && (brandPos === null || bm.position < brandPos))
              .map((bm: any) => ({ name: bm.name || '', position: bm.position }))
              .sort((a: any, b: any) => a.position - b.position);

            return {
              prompt: questionText,
              position: brandEntry?.position ?? null,
              absent: !brandEntry,
              competitorWins,
              assistantMessages,
            };
          } catch {
            return null;
          }
        })
      );

      // Deduplicate by prompt text, keep best position
      const seen = new Map<string, any>();
      for (const r of rawResults.filter((r) => r !== null && r.prompt)) {
        const key = r.prompt.trim().toLowerCase();
        if (!seen.has(key) || (r.position !== null && (seen.get(key).position === null || r.position < seen.get(key).position))) {
          seen.set(key, r);
        }
      }
      const promptResults = Array.from(seen.values()).slice(0, 10);
      console.log('[peec] prompt results:', JSON.stringify(promptResults).substring(0, 500));

      // ── 7. volumeRankedPrompts from chat questions (sorted by best position) ──
      volumeRankedPrompts = promptResults
        .filter((r) => r.prompt)
        .map((r) => ({
          id: r.prompt.trim().toLowerCase().replace(/\s+/g, '-').substring(0, 40),
          text: r.prompt,
          volume: r.position !== null ? Math.max(1, 10 - r.position) : 1,
        }));

      // ── 8. Build chat gaps (competitor wins) ─────────────────────────────
      chatGaps = promptResults
        .filter((r) => r.absent || (r.position != null && r.position > 2))
        .map((r) => ({ prompt: r.prompt, competitorWins: r.competitorWins || [] }))
        .slice(0, 5);

      // ── 8. UGC brief from assistant objection messages ───────────────────
      const negativeKeywords = [
        'however', 'downside', 'issue', 'problem', 'concern', 'criticism', 'complaint',
        'drawback', 'disadvantage', 'expensive', 'pricey', 'costly', 'overpriced',
        'lack', 'lacking', 'missing', 'limited', 'weak', 'behind',
        'not as good', 'falls short', 'struggle', 'struggles',
        'difficult', 'hard to', 'unreliable', 'disappointing', 'disappointed',
        'worse', 'inferior', 'poor', 'bad', 'low', 'slow', 'outdated',
        'criticized', 'questioned', 'complained', 'reported issues',
      ];
      const positiveKeywords = [
        'voted', 'award', 'winner', 'best', 'top', 'excellent', 'outstanding',
        'praised', 'renowned', 'celebrated', 'impressive', 'exceptional',
        'noted for its', 'known for its', 'recognized', 'leading',
      ];
      const objectionLines: string[] = [];
      for (const r of rawResults.filter(Boolean)) {
        for (const msg of (r!.assistantMessages || [])) {
          const sentences = msg.split(/[.!?\n]+/).filter(Boolean);
          for (const sentence of sentences) {
            // Strip markdown: **, *, #, leading dashes/bullets
            const cleaned = sentence
              .replace(/\*{1,2}([^*]*)\*{1,2}/g, '$1')
              .replace(/#+\s*/g, '')
              .replace(/^[\s\-•*]+/, '')
              .trim();
            const lower = cleaned.toLowerCase();
            const hasOurBrand = lower.includes(brandName.toLowerCase()) || lower.includes(matchedBrand.name.toLowerCase());
            const hasNegative = negativeKeywords.some((kw) => lower.includes(kw));
            const hasPositive = positiveKeywords.some((kw) => lower.includes(kw));
            // Must mention brand AND have a negative signal AND no overriding positive signal
            if (hasOurBrand && hasNegative && !hasPositive && cleaned.length > 40 && cleaned.length < 400) {
              objectionLines.push(cleaned);
            }
          }
        }
      }
      // Deduplicate and cap at 10
      ugcBrief = [...new Set(objectionLines)].slice(0, 10);
      console.log('[peec] ugcBrief count:', ugcBrief.length);

      // ── 9. Derive content mix recommendations ────────────────────────────
      const lowRankPrompts = promptResults.filter((r) => r.absent || (r.position != null && r.position > 3));
      const lowRankCount = lowRankPrompts.length;
      const totalChecked = promptResults.length;

      const sentimentScore = brandRow?.sentiment ?? null;
      const educationalRecommended = lowRankCount >= 3;
      const educationalPct = educationalRecommended
        ? Math.min(50, 20 + Math.round((lowRankCount / totalChecked) * 40))
        : null;

      const ugcRecommended = sentimentScore !== null && sentimentScore < 60;
      const ugcPct = ugcRecommended
        ? Math.min(35, 10 + Math.round(((60 - sentimentScore) / 60) * 30))
        : null;

      contentRecommendations = {
        educational: {
          recommended: educationalRecommended,
          suggestedPercentage: educationalPct,
          reason: educationalRecommended
            ? `${brandName} ranks below position 3 on ${lowRankCount} of ${totalChecked} high-volume prompts — more educational content can improve AI visibility`
            : `${brandName} ranks well on most high-volume prompts — educational content is working`,
          lowRankCount,
          totalPrompts: totalChecked,
        },
        ugc: {
          recommended: ugcRecommended,
          suggestedPercentage: ugcPct,
          reason: ugcRecommended
            ? `Sentiment score of ${sentimentScore?.toFixed(0)}/100 suggests mixed AI perception — authentic UGC content can shift the narrative`
            : `Sentiment score of ${sentimentScore?.toFixed(0)}/100 is healthy — current content mix is working`,
        },
        highVolumePrompts: promptResults.slice(0, 5),
      };
    }

    return new Response(JSON.stringify({
      brandName: matchedBrand?.name || brandName,
      visibility: {
        shareOfVoice: brandRow?.share_of_voice ?? null,
        mentionCount: brandRow?.mention_count ?? null,
        visibilityScore: brandRow?.visibility ?? null,
      },
      sentiment: brandRow?.sentiment ?? null,
      position: brandRow?.position ?? null,
      competitors,
      totalBrands: allBrands.length,
      period: { start: fmt(startDate), end: fmt(today) },
      contentRecommendations,
      postIdeation: {
        volumeRankedPrompts,
        talkingPoints,
        chatGaps,
        ugcBrief,
      },
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
