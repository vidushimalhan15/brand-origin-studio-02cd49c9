/**
 * generate-content-gemini
 *
 * Ported from SocialFlow's generate-content-claude edge function.
 * Generates full post content (text post, carousel slides, or caption) using Gemini.
 *
 * Input:
 *   brandName, introduction, audiences[], products[], writingStyle,
 *   idea: { id, title, caption, hook, platform, contentType, pillar, peecSource, peecSignal },
 *   contentFormat: "Text Post" | "Carousel" | "Single Image" | "Reel" | "Blog Post" | "Newsletter"
 *   length: "Short" | "Medium" | "Long"
 *
 * Output:
 *   { success, content, slides[]{title,content}, caption, hashtags, wordCount }
 */

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// ─── HELPERS ───────────────────────────────────────────────────────────────────

function sanitizeEmDashes(text: string): string {
  return text ? text.replace(/[\u2014\u2013]/g, "-") : text;
}

function stripMarkdown(text: string): string {
  return text ? text.replace(/\*{1,2}([^*]+)\*{1,2}/g, "$1") : text;
}

function stripHashtags(text: string): string {
  return text
    ? text.replace(/\s*#\w[\w]*/g, "").replace(/\n{3,}/g, "\n\n").replace(/[ \t]{2,}/g, " ").trim()
    : text;
}

function cleanContent(text: string): string {
  return stripHashtags(stripMarkdown(sanitizeEmDashes(text ?? ""))).trim();
}

// ─── PLATFORM FORMAT INSTRUCTIONS ─────────────────────────────────────────────

function getLinkedInTextPostInstructions(length: string): string {
  const wordRanges: Record<string, string> = { Short: "60-110", Medium: "120-200", Long: "200-320" };
  const range = wordRanges[length] || wordRanges.Medium;
  return `
LINKEDIN TEXT POST FORMAT:
- Word count: ${range} words (strictly stay in range)
- Plain text only — no markdown bold/italic (no ** or *)
- Short paragraphs (1-3 lines each), blank line between paragraphs
- Hook: first line must be scroll-stopping (do NOT repeat the post title)
- Body: 2-4 short paragraphs with insights, tips, or story
- End with a CTA or question to drive engagement
- NO hashtags in the body — hashtags go at the very end only (3-5 max)
- Output as "content" field (plain string)

WRITING PATTERNS (use one of these structures):
A) Hook → Problem → Insight → Takeaway → CTA
B) Hook → Story → Lesson → CTA
C) Hook → List (3-5 points with bullets •) → CTA
D) Hook → Before/After → CTA

SLIDE 1 HOOK RULES:
- One flowing sentence — do NOT split it across lines
- Must create curiosity or state a clear benefit
- Never start with "I" as the very first word`;
}

function getLinkedInCarouselInstructions(slidesCount: number, length: string): string {
  const bodyWords: Record<string, string> = { Short: "6-12", Medium: "14-20", Long: "18-26" };
  const words = bodyWords[length] || bodyWords.Medium;
  const totalSlides = Math.max(4, Math.min(slidesCount, length === "Long" ? 9 : 6));
  return `
LINKEDIN CAROUSEL FORMAT:
- Generate EXACTLY ${totalSlides} slides as a JSON array of {title, content} objects
- NO hashtags on slides — hashtags go in caption only
- NO markdown bold/italic — plain text only
- NO em dashes (use hyphen instead)

SLIDE STRUCTURE:
- Slide 1 (Hook): Compelling headline (one sentence) + optional 1-line subtext + short CTA ("Here's how." / "Let me show you." / "Swipe through.")
- Slides 2 to ${totalSlides - 1} (Body): Each slide = one clear idea, ${words} words in "content"
  - Format: "Headline.\\n\\nBody text that expands on it."
  - The \\n\\n between headline and body is MANDATORY
- Slide ${totalSlides} (CTA): Engagement question or call-to-action (short)

RULES:
- "title" field: leave empty for all slides (put ALL text in "content")
- Each slide must be readable in 2-3 seconds
- Vary structure: some slides use short bullets (•), others use prose
- The hook MUST be original — do NOT repeat the post idea title`;
}

function getInstagramInstructions(length: string): string {
  const wordRanges: Record<string, string> = { Short: "50-100", Medium: "100-160", Long: "150-220" };
  return `
INSTAGRAM CAPTION FORMAT:
- Word count: ${wordRanges[length] || wordRanges.Medium} words
- Start with a strong hook on the first line (scroll-stopper)
- Conversational, warm tone — write like a human, not a brand
- Use line breaks between thoughts for scannability
- 8-15 relevant hashtags at the very end (separated by blank line)
- 1-3 emojis to add energy (not every line)
- End with a question or CTA to drive comments
- Output as "content" field`;
}

function getTwitterInstructions(): string {
  return `
TWITTER/X FORMAT — STRICT RULES:
- Choose ONE format:
  A) Single Tweet: 140-220 characters, max 6 short lines, NO bullet points, one core idea
  B) Short Thread: max 3 tweets, each ≤ 240 chars, first tweet = hook, one idea per tweet

- Write conversationally, slightly unfinished — NOT polished corporate tone
- NO bullet lists, NO numbered frameworks, NO "Here's my 3-step approach:"
- NO hashtags in the tweet body (1 hashtag max at end if absolutely relevant)
- Preferred pattern: observation → insight → question (invites replies)
- Output as "content" field (tweets separated by \\n\\n--- if thread)

ANTI-PATTERNS (NEVER DO):
- Bulleted lists (LinkedIn style)
- "Here's what worked:" + bullets
- Framework framing ("Here's the 3-step framework...")
- Over-polished motivational closing lines`;
}

function getFacebookInstructions(length: string): string {
  const wordRanges: Record<string, string> = { Short: "60-120", Medium: "120-200", Long: "180-280" };
  return `
FACEBOOK POST FORMAT:
- Word count: ${wordRanges[length] || wordRanges.Medium} words
- Friendly, community-focused tone
- Hook in the first line (important — Facebook truncates after 2-3 lines)
- Short paragraphs, one idea per paragraph
- End with a question to drive comments
- 2-4 hashtags at the end only
- Output as "content" field`;
}

function getBlogInstructions(wordLimit: number): string {
  return `
BLOG POST FORMAT:
- Target length: ~${wordLimit} words
- Professional, informative tone
- Structure: Title → Introduction → 3-5 main sections with subheadings → Conclusion → CTA
- Use clear headings (##) and subheadings (###)
- Include practical tips, examples, or data where relevant
- End with a clear CTA (subscribe, contact, learn more)
- Markdown formatting is allowed for blog posts (headers, bullets)
- Output as "content" field`;
}

function getNewsletterInstructions(wordLimit: number): string {
  return `
NEWSLETTER FORMAT:
- Target length: ~${wordLimit} words
- Warm, personal tone (like writing to a friend)
- Structure: Hook → Hey there → 2-3 main points → Bullets (use •) → CTA → Sign-off
- Short paragraphs (1-2 sentences each), blank line between every paragraph
- One blank line before and after bullet lists
- End with "Best, [Brand Name]" or equivalent
- Output as "content" field`;
}

// ─── MAIN HANDLER ──────────────────────────────────────────────────────────────

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

    const body = await req.json();
    const {
      brandName,
      introduction,
      audiences = [],
      products = [],
      writingStyle,
      idea,
      contentFormat = "Text Post",
      length = "Medium",
    } = body;

    if (!brandName || !idea) {
      return new Response(
        JSON.stringify({ error: "brandName and idea are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const platform = idea.platform || "LinkedIn";
    const formatLower = contentFormat.toLowerCase();
    const isCarousel = formatLower.includes("carousel");
    const isBlog = formatLower.includes("blog");
    const isNewsletter = formatLower.includes("newsletter");
    const isTwitter = platform.toLowerCase().includes("twitter") || platform.toLowerCase().includes("x/");
    const isInstagram = platform.toLowerCase() === "instagram";
    const isFacebook = platform.toLowerCase() === "facebook";
    const isLinkedIn = platform.toLowerCase() === "linkedin";

    const wordLimit = length === "Short" ? 500 : length === "Long" ? 1500 : 900;
    const slidesCount = length === "Short" ? 4 : length === "Long" ? 9 : 6;

    // ─── Build platform format instructions ───────────────────────────────────
    let formatInstructions = "";
    if (isCarousel) {
      formatInstructions = getLinkedInCarouselInstructions(slidesCount, length);
    } else if (isBlog) {
      formatInstructions = getBlogInstructions(wordLimit);
    } else if (isNewsletter) {
      formatInstructions = getNewsletterInstructions(wordLimit);
    } else if (isTwitter) {
      formatInstructions = getTwitterInstructions();
    } else if (isInstagram) {
      formatInstructions = getInstagramInstructions(length);
    } else if (isFacebook) {
      formatInstructions = getFacebookInstructions(length);
    } else {
      // Default: LinkedIn text post (also used for YouTube, Blog Post description)
      formatInstructions = getLinkedInTextPostInstructions(length);
    }

    // ─── Build writing style section ──────────────────────────────────────────
    let writingStyleSection = "";
    if (writingStyle) {
      const parts: string[] = [];
      if (writingStyle.tone) parts.push(`Tone: ${writingStyle.tone}`);
      if (writingStyle.formality) parts.push(`Formality: ${writingStyle.formality}`);
      if (writingStyle.hookStyle) parts.push(`Hook style: ${writingStyle.hookStyle}`);
      if (writingStyle.emojiUsage) parts.push(`Emoji usage: ${writingStyle.emojiUsage}`);
      if (writingStyle.bulletStyle) parts.push(`Bullet style: ${writingStyle.bulletStyle}`);
      if (writingStyle.ctaStyle) parts.push(`CTA style: ${writingStyle.ctaStyle}`);
      if (writingStyle.customWritingStyle) parts.push(`Custom style note: ${writingStyle.customWritingStyle}`);
      if (parts.length > 0) {
        writingStyleSection = `\nWRITING STYLE:\n${parts.map((p) => `- ${p}`).join("\n")}`;
      }
    }

    // ─── Build brand + idea context ───────────────────────────────────────────
    const audienceSection = audiences.length > 0
      ? `\nCAMPAIGN AUDIENCES:\n${audiences.map((a: string) => `- ${a}`).join("\n")}`
      : "";

    const productSection = products.length > 0
      ? `\nPRODUCTS:\n${products.map((p: any) => `- ${p.name}: ${p.description}`).join("\n")}`
      : "";

    const peecSection = idea.peecSource === "ai_visibility"
      ? `\nPEEC AI VISIBILITY GOAL: Position ${brandName} as THE answer to this question people ask AI: "${idea.peecSignal}"`
      : idea.peecSource === "reputation_fix"
      ? `\nPEEC REPUTATION FIX GOAL: Counter this negative AI narrative about ${brandName} using real stories and facts: "${idea.peecSignal}"`
      : "";

    const currentDate = new Date();
    const currentYear = currentDate.getFullYear();

    // ─── Determine output schema ───────────────────────────────────────────────
    const outputSchema = isCarousel
      ? `Return a JSON object with:
- "slides": array of {"title": "", "content": "..."} objects (EXACTLY ${slidesCount} slides, "title" always empty string)
- "caption": string (100-150 chars, platform caption for the carousel post, no hashtags in caption body)
- "hashtags": array of 3-5 hashtag strings (without # prefix)
- "wordCount": number`
      : `Return a JSON object with:
- "content": string (the full post text)
- "hashtags": array of hashtag strings (without # prefix) — if platform calls for hashtags, else empty array
- "wordCount": number`;

    // ─── Full prompt ──────────────────────────────────────────────────────────
    const systemPrompt = `You are an expert social media content creator. You create original, platform-native content that sounds human and drives engagement. Always respond with valid JSON only — no prose, no markdown wrapper.`;

    const userPrompt = `BRAND CONTEXT:
- Brand: ${brandName}
- About: ${introduction || "N/A"}
- Industry/Context: derived from brand about section
- Current year: ${currentYear}
${audienceSection}${productSection}

POST CONCEPT:
- Title: ${idea.title}
- Hook draft: ${idea.hook}
- Caption draft: ${idea.caption}
- Content type: ${idea.contentType}
- Content pillar: ${idea.pillar}
- Platform: ${platform}
- Format: ${contentFormat}
- Length: ${length}
${peecSection}${writingStyleSection}

GLOBAL RULES (apply to ALL content):
- NO markdown bold/italic (**text** or *text*) in social media content
- NO em dashes (—) — use hyphen (-) instead
- NO hashtags in slide content or post body — hashtags go in the "hashtags" array only
- Do NOT repeat the post title verbatim as the opening line — write an ORIGINAL hook
- Plain text only for social platforms (exception: blog posts may use markdown headers)
- Content must sound human and authentic — not corporate or AI-generated

${formatInstructions}

${outputSchema}

Generate the content now.`;

    // ─── Call Gemini ──────────────────────────────────────────────────────────
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${geminiApiKey}`;

    const geminiRes = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        system_instruction: { parts: [{ text: systemPrompt }] },
        contents: [{ role: "user", parts: [{ text: userPrompt }] }],
        generationConfig: {
          temperature: 0.75,
          maxOutputTokens: isCarousel ? 4096 : isBlog ? 3000 : 1500,
          responseMimeType: "application/json",
        },
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
    const rawText = geminiData.candidates?.[0]?.content?.parts?.[0]?.text ?? "";

    if (!rawText) {
      return new Response(
        JSON.stringify({ error: "No content returned from Gemini" }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // ─── Parse response ────────────────────────────────────────────────────────
    let parsed: any;
    try {
      const stripped = rawText.replace(/^```[a-zA-Z]*\s*/m, "").replace(/\s*```\s*$/m, "").trim();
      parsed = JSON.parse(stripped);
    } catch {
      // Try to extract JSON from response
      const match = rawText.match(/(\{[\s\S]*\})/);
      if (match) {
        try { parsed = JSON.parse(match[1]); } catch { /* fall through */ }
      }
    }

    if (!parsed) {
      return new Response(
        JSON.stringify({ error: "Failed to parse Gemini JSON response", raw: rawText.slice(0, 500) }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // ─── Sanitise output ───────────────────────────────────────────────────────
    if (parsed.content) {
      parsed.content = cleanContent(parsed.content);
    }

    if (parsed.slides && Array.isArray(parsed.slides)) {
      parsed.slides = parsed.slides.map((slide: any) => ({
        title: slide.title ? cleanContent(slide.title) : "",
        content: slide.content ? cleanContent(slide.content) : "",
      }));
    }

    if (parsed.caption) {
      parsed.caption = cleanContent(parsed.caption);
    }

    // Normalise hashtags — remove # prefix if present
    if (parsed.hashtags && Array.isArray(parsed.hashtags)) {
      parsed.hashtags = parsed.hashtags.map((h: any) => String(h).replace(/^#/, "").trim()).filter(Boolean);
    } else {
      parsed.hashtags = [];
    }

    return new Response(
      JSON.stringify({ success: true, ...parsed }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
