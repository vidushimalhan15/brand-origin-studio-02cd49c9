
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";


const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
const firecrawlApiKey = Deno.env.get('FIRECRAWL_API_KEY');
const perplexityApiKey = Deno.env.get('PERPLEXITY_API_KEY');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Extract user ID from auth header (JWT)
    let userId: string | undefined;
    try {
      const authHeader = req.headers.get('authorization');
      if (authHeader?.startsWith('Bearer ')) {
        const token = authHeader.split(' ')[1];
        const payload = JSON.parse(atob(token.split('.')[1]));
        userId = payload.sub;
      }
    } catch {}

    const requestBody = await req.json();
    
    // Handle tone and voice analysis functionality
    if (requestBody.analyzeToneVoice && (requestBody.brandName || requestBody.introduction)) {
      
      const toneVoicePrompt = `
      Analyze the brand tone and voice from the following brand information:
      
      Brand Name: ${requestBody.brandName || 'Not provided'}
      Brand Introduction: ${requestBody.introduction || 'Not provided'}
      Industry Niches: ${requestBody.industryNiches ? requestBody.industryNiches.join(', ') : 'Not provided'}
      
      Based on this information, determine the brand's tone and voice characteristics in JSON format:
      {
        "tone": ["up to 3 tone attributes from: Professional, Friendly, Casual, Formal, Playful, Serious, Witty, Inspirational, Educational, Conversational"],
        "voice": "single voice attribute from: Authoritative, Empathetic, Confident, Humble, Bold, Gentle, Direct, Supportive, Compassionate"
      }
      
      Guidelines:
      - Choose tone attributes that best match the brand's communication style
      - Select exactly 1 voice attribute that represents the brand's personality
      - Consider the industry context and brand positioning
      - Base analysis on the language, messaging, and brand positioning described
      `;

      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${openAIApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-4.1-2025-04-14',
          messages: [
            { 
              role: 'system', 
              content: 'You are an expert brand analyst who determines brand tone and voice characteristics from brand information.' 
            },
            { 
              role: 'user', 
              content: toneVoicePrompt
            }
          ],
          response_format: { type: "json_object" },
          temperature: 0.3,
          max_tokens: 500
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`OpenAI API error: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      const result = JSON.parse(data.choices[0].message.content);

      return new Response(JSON.stringify({
        success: true,
        tone: result.tone || [],
        voice: result.voice || ''
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Handle message extraction functionality
    if (requestBody.extractMessages && requestBody.text) {
      
      const messagePrompt = `
      Analyze the following brand introduction and extract 3-5 key brand messages or value propositions:
      
      Brand Introduction: "${requestBody.text}"
      
      Return ONLY a JSON array of strings representing the key brand messages. Each message should be:
      - A clear, concise statement of value or benefit
      - Written as it could appear in marketing materials
      - Focused on what the brand offers or believes
      - Maximum 8-10 words per message
      - Include the main tagline if present
      
      Example format: ["Helping businesses save time", "Boost visibility & reach the right people", "Quality content that converts"]
      `;

      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${openAIApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-4.1-2025-04-14',
          messages: [
            { 
              role: 'system', 
              content: 'You are an expert brand messaging specialist who extracts key value propositions and brand messages from brand descriptions.' 
            },
            { 
              role: 'user', 
              content: messagePrompt
            }
          ],
          response_format: { type: "json_object" },
          temperature: 0.3,
          max_tokens: 500
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`OpenAI API error: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      const messageContent = data.choices[0].message.content.trim();

      try {
        const result = JSON.parse(messageContent);
        const messages = result.messages || result; // Handle both wrapped and direct array formats
        if (Array.isArray(messages)) {
          return new Response(JSON.stringify({ messages }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        } else {
          throw new Error('Invalid message format returned');
        }
      } catch (parseError) {
        throw new Error('Failed to parse key messages from AI response');
      }
    }

    // Handle niche analysis functionality
    if (requestBody.analyzeNiches && requestBody.text) {
      
      const nichePrompt = `
      Analyze the following brand introduction and extract 3-5 specific industry niches or market segments this brand operates in:
      
      Brand Introduction: "${requestBody.text}"
      
      Return ONLY a JSON array of strings representing the industry niches. Each niche should be:
      - Specific and relevant to the brand
      - Clear and concise (1-3 words max)
      - Industry-focused rather than broad categories
      - Based on what the brand actually does or serves
      
      Example format: ["fitness coaching", "nutrition", "wellness technology", "health consulting"]
      
      Return ONLY the JSON array, no other text.
      `;

      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${openAIApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [
            { 
              role: 'system', 
              content: 'You are an expert business analyst. Extract specific industry niches from brand descriptions. Return only a JSON array of strings.' 
            },
            { 
              role: 'user', 
              content: nichePrompt
            }
          ],
          temperature: 0.3,
          max_tokens: 200
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`OpenAI API error: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      const nicheContent = data.choices[0].message.content.trim();

      try {
        const niches = JSON.parse(nicheContent);
        if (Array.isArray(niches)) {
          return new Response(JSON.stringify({ niches }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        } else {
          throw new Error('Invalid niche format returned');
        }
      } catch (parseError) {
        throw new Error('Failed to parse industry niches from AI response');
      }
    }
    
    // Handle rephrase functionality
    if (requestBody.rephrase && requestBody.brandName && requestBody.introduction) {
      
      const rephrasePrompt = `
      Please rephrase and improve the following brand information while maintaining the core meaning and brand essence:
      
      Brand Name: ${requestBody.brandName}
      Current Introduction: ${requestBody.introduction}
      
      Please provide a refreshed version in JSON format:
      {
        "brandName": "improved brand name (keep original if already good)",
        "introduction": "improved 2-3 sentence brand introduction that's more engaging and clear"
      }
      
      Guidelines:
      - Keep the core brand identity and meaning
      - Make the language more engaging and professional
      - Ensure clarity and impact
      - Don't change the fundamental brand concept
      `;

      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${openAIApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-4.1-2025-04-14',
          messages: [
            { 
              role: 'system', 
              content: 'You are an expert brand copywriter who improves brand messaging while maintaining brand identity.' 
            },
            { 
              role: 'user', 
              content: rephrasePrompt
            }
          ],
          response_format: { type: "json_object" },
          temperature: 0.7,
          max_tokens: 1000
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`OpenAI API error: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      const result = JSON.parse(data.choices[0].message.content);

      return new Response(JSON.stringify({
        success: true,
        brandName: result.brandName || requestBody.brandName,
        introduction: result.introduction || requestBody.introduction
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    
    // Handle URL analysis
    const { url } = requestBody;
    if (!url) {
      throw new Error('No URL provided');
    }


    let websiteContent = '';
    let contentSource = 'firecrawl'; // Track which method was used
    
    // Try Firecrawl first if API key is available
    if (firecrawlApiKey) {
      try {
        
        const firecrawlResponse = await fetch('https://api.firecrawl.dev/v1/scrape', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${firecrawlApiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            url: url,
            formats: ['markdown', 'html'],
            includeTags: ['title', 'meta', 'h1', 'h2', 'h3', 'p', 'div', 'span'],
            excludeTags: ['script', 'style', 'nav', 'footer', 'aside'],
            onlyMainContent: true,
            removeBase64Images: true
          })
        });

        if (firecrawlResponse.ok) {
          const firecrawlData = await firecrawlResponse.json();
          
          // Use markdown content if available, otherwise fallback to HTML
          const markdownContent = firecrawlData.data?.markdown || '';
          const htmlContent = firecrawlData.data?.html || '';
          const metadata = firecrawlData.data?.metadata || {};
          
          websiteContent = `
          Website: ${url}
          Title: ${metadata.title || 'Not found'}
          Description: ${metadata.description || 'Not found'}
          
          === MAIN CONTENT ===
          ${markdownContent || htmlContent.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()}
          
          === METADATA ===
          Keywords: ${metadata.keywords?.join(', ') || 'Not found'}
          Author: ${metadata.author || 'Not found'}
          Language: ${metadata.language || 'Not found'}
          `;
        } else {
          contentSource = 'fallback';
        }
      } catch (error) {
        contentSource = 'fallback';
      }
    } else {
      contentSource = 'fallback';
    }

    // Fallback to basic scraping if Firecrawl failed or unavailable
    if (contentSource === 'fallback') {
      try {
        // Check if it's a social media URL
        const socialDomains = ['instagram.com', 'facebook.com', 'linkedin.com', 'twitter.com', 'tiktok.com'];
        const urlObj = new URL(url);
        const socialMediaAnalysis = socialDomains.some(domain => urlObj.hostname.includes(domain));
        
        if (socialMediaAnalysis) {
          websiteContent = `Social Media Profile URL: ${url}
          Platform: ${urlObj.hostname}
          This appears to be a social media profile that needs brand analysis.`;
        } else {
          // Try to fetch regular website content
          const response = await fetch(url, {
            headers: {
              'User-Agent': 'Mozilla/5.0 (compatible; BrandAnalyzer/1.0)'
            }
          });
          
          if (response.ok) {
            const html = await response.text();
            // Extract meta tags and content
            const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
            const descMatch = html.match(/<meta[^>]*name="description"[^>]*content="([^"]*)"[^>]*>/i);
            const ogTitleMatch = html.match(/<meta[^>]*property="og:title"[^>]*content="([^"]*)"[^>]*>/i);
            const ogDescMatch = html.match(/<meta[^>]*property="og:description"[^>]*content="([^"]*)"[^>]*>/i);
            
            websiteContent = `
            Website: ${url}
            Title: ${titleMatch ? titleMatch[1] : 'Not found'}
            Description: ${descMatch ? descMatch[1] : 'Not found'}
            OG Title: ${ogTitleMatch ? ogTitleMatch[1] : 'Not found'}
            OG Description: ${ogDescMatch ? ogDescMatch[1] : 'Not found'}
            
            Content Preview: ${html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim().substring(0, 2000)}
            `;
          }
        }
      } catch (error) {
        websiteContent = `Website URL: ${url} - Analysis based on URL structure and domain.`;
      }
    }

    // Get additional context from Perplexity if available
    let perplexityContext = '';
    if (perplexityApiKey) {
      try {
        const urlObj = new URL(url);
        const domainName = urlObj.hostname.replace('www.', '');
        
        const perplexityResponse = await fetch('https://api.perplexity.ai/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${perplexityApiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'llama-3.1-sonar-small-128k-online',
            messages: [
              {
                role: 'system',
                content: 'You are a brand research expert. Provide concise, factual information about companies and brands.'
              },
              {
                role: 'user',
                content: `Research information about the company/brand from ${domainName}. Focus on: company background, mission, key products/services, market position, recent news, and brand characteristics. Provide factual details only.`
              }
            ],
            temperature: 0.2,
            top_p: 0.9,
            max_tokens: 1000,
            return_images: false,
            return_related_questions: false,
            search_recency_filter: 'month'
          }),
        });

        if (perplexityResponse.ok) {
          const perplexityData = await perplexityResponse.json();
          perplexityContext = perplexityData.choices[0].message.content;
        }
      } catch (error) {
      }
    }

    // Enhanced analysis prompt for better brand analysis with Perplexity context
    const analysisPrompt = `
    You are a structured web data extraction model. Your job is to extract the real brand name and brand introduction from the provided website content.

    CONTENT EXTRACTION METHOD: ${contentSource}
    WEBSITE ANALYSIS:
    ${websiteContent}

    ${perplexityContext ? `ADDITIONAL BRAND RESEARCH CONTEXT:\n${perplexityContext}\n` : ''}

    You MUST follow these rules:

    1. NEVER generate placeholder text such as:
       - "Extracted Brand"
       - "Brand information extracted from website"
       - "N/A", "Unknown", "Sample", or any generic fallback.
       - Any invented or hallucinated content.

    2. ONLY return information that actually exists in the website content provided to you.

    3. Do NOT paraphrase the brand name. Extract it exactly as used on the website.

    4. The brand introduction must be concise, factual, and directly derived from the website content. No hallucinations.

    5. Do NOT fill missing fields with placeholders. If you cannot extract real data, leave the field empty or null.

    6. Always prioritize:
       - the <title> tag
       - meta og:title
       - meta description
       - H1 heading
       - About Us section
       - footer brand text

    7. If the website contains multiple names, choose the primary consumer-facing brand.

    8. Extract the brand name WITHOUT page navigation prefixes:
       - Remove "About Us |", "Home -", "Contact |" etc.
       - Remove separator symbols like |, -, –, ®, ™
       - Example: "About us » nu3" → extract "nu3"
       - Example: "Home - Acme Corporation" → extract "Acme Corporation"

    Return a single JSON object with the following fields:
    {
      "brandName": "exact brand name found (no placeholders, no navigation text)",
      "introduction": "clean, human-readable description extracted from the website (no hallucinations)",
      "tone": ["up to 3 tone attributes like professional, casual, friendly, authoritative, conversational, inspirational"],
      "voice": "single voice attribute like confident, approachable, expert, innovative, trustworthy, dynamic",
      "values": ["3-5 inferred core brand values"],
      "colors": ["suggested brand colors in hex format based on content theme"],
      "keyMessages": ["3-5 key brand messages or taglines found in content"],
      "targetAudience": "detailed target audience with demographics/psychographics and needs",
      "suggestedMessages": ["3-5 suggested key messages based on brand positioning"],
      "brandPersonality": "detailed brand personality description",
      "communicationStyle": "how the brand communicates with its audience",
      "brandType": "personal | company",
      "industryNiches": ["1-5 concise industry niches inferred from content, most specific first"],
      "summary": "2-3 sentence AI-written summary of the brand for quick reference",
      "personalDetails": {
        "roles": ["job titles or roles"],
        "yearsExperience": "total years of experience if available",
        "expertise": ["areas of expertise"],
        "education": ["degrees or schools if mentioned"],
        "certifications": ["relevant certifications"],
        "achievements": ["notable awards, publications, talks"]
      },
      "companyDetails": {
        "foundedYear": "year if available",
        "size": "team size or company size if available",
        "headquarters": "hq location if available",
        "markets": ["key markets or regions"],
        "products": ["key products"],
        "services": ["key services"]
      }
    }

    These rules override all previous instructions.
    `;


    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4.1-2025-04-14',
        messages: [
          { 
            role: 'system', 
            content: 'You are an expert brand analysis specialist who extracts comprehensive brand information from website content. Provide accurate, detailed analysis based on the content provided.' 
          },
          { 
            role: 'user', 
            content: analysisPrompt
          }
        ],
        response_format: { type: "json_object" },
        temperature: 0.3,
        max_tokens: 2000
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`OpenAI API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();

    if (!data.choices || !data.choices[0] || !data.choices[0].message) {
      throw new Error('Invalid response format from OpenAI');
    }

    const analysisResult = JSON.parse(data.choices[0].message.content);

    // Clean brand name by removing common navigation patterns
    const cleanBrandName = (name: string, introduction: string = ''): string => {
      if (!name) return name;

      let cleaned = name;


      // Remove common page navigation prefixes (case insensitive)
      const navigationPatterns = [
        /^about\s*us\s*[|»\-–—]\s*/i,
        /^about\s*[|»\-–—]\s*/i,
        /^home\s*[|»\-–—]\s*/i,
        /^contact\s*[|»\-–—]\s*/i,
        /^welcome\s*[|»\-–—]\s*/i,
        /^.*[|»\-–—]\s*about\s*us$/i,
      ];

      navigationPatterns.forEach(pattern => {
        cleaned = cleaned.replace(pattern, '');
      });

      // Remove trailing separators and navigation text
      cleaned = cleaned.replace(/\s*[|»\-–—]\s*$/g, '');

      // If there are still separators, split and take the last/cleanest part
      if (cleaned.match(/[|»\-–—]/)) {
        const parts = cleaned.split(/\s*[|»\-–—]\s*/);
        // Take the shortest non-empty part (usually the actual brand name)
        const nonEmptyParts = parts.filter(p => p.trim().length > 0 && p.trim().length < 50);
        if (nonEmptyParts.length > 0) {
          // Prefer parts without common words like "About", "Home"
          const cleanParts = nonEmptyParts.filter(p =>
            !p.match(/^(about|home|contact|welcome|us|page)/i)
          );
          cleaned = (cleanParts.length > 0 ? cleanParts : nonEmptyParts)[0];
        }
      }

      // Remove duplicate brand names like "Brand - Brand®"
      const parts = cleaned.split(/\s*[|\-–—]\s*/);
      if (parts.length > 1) {
        // Check if parts are similar (same brand repeated)
        const firstPart = parts[0].replace(/[®™©]/g, '').trim().toLowerCase();
        const lastPart = parts[parts.length - 1].replace(/[®™©]/g, '').trim().toLowerCase();

        if (firstPart === lastPart || lastPart.includes(firstPart) || firstPart.includes(lastPart)) {
          cleaned = parts[0]; // Use first occurrence
        }
      }

      // Remove trademark symbols
      cleaned = cleaned.replace(/[®™©]/g, '');

      // Clean up extra whitespace
      cleaned = cleaned.replace(/\s+/g, ' ').trim();

      // Final validation: if name still looks like navigation, try to extract from introduction
      if (cleaned.match(/^(about|home|contact|welcome)/i) && introduction) {

        // Look for brand name in first sentence of introduction
        const firstSentence = introduction.split(/[.!?]/)[0];
        const match = firstSentence.match(/\b([A-Z][a-z]*(?:\s+[A-Z][a-z]*){0,3})\s+is\s+/);
        if (match && match[1]) {
          cleaned = match[1];
        }
      }

      return cleaned;
    };

    // Structure the response with all extracted information
    const extractedInfo = {
      values: analysisResult.values || [],
      colors: analysisResult.colors || [],
      keyMessages: analysisResult.keyMessages || [],
      targetAudience: analysisResult.targetAudience || 'Not specified',
      brandPersonality: analysisResult.brandPersonality || 'Not specified',
      communicationStyle: analysisResult.communicationStyle || 'Not specified',
      summary: analysisResult.summary || '',
      brandType: analysisResult.brandType || '',
      personalDetails: analysisResult.personalDetails || null,
      companyDetails: analysisResult.companyDetails || null,
      industryNiches: analysisResult.industryNiches || []
    };

    const finalResponse = {
      success: true,
      extractedInfo,
      brandName: cleanBrandName(analysisResult.brandName || '', analysisResult.introduction || ''),
      introduction: analysisResult.introduction || '',
      tone: Array.isArray(analysisResult.tone) ? analysisResult.tone : [],
      voice: analysisResult.voice || '',
      suggestedMessages: analysisResult.suggestedMessages || [],
      industryNiches: analysisResult.industryNiches || [],
      url: url,
      contentSource: contentSource, // Indicate which method was used
      analysisTimestamp: new Date().toISOString()
    };


    return new Response(JSON.stringify(finalResponse), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response(JSON.stringify({ 
      success: false, 
      error: error.message,
      details: 'Please ensure the URL is valid and accessible, or try uploading a brand deck instead.'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
