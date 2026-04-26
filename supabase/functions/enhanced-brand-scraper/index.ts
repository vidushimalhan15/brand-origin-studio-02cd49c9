import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { logApiUsage } from "../_shared/usage-logger.ts"

// API Keys
const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
const apifyApiKey = Deno.env.get('APIFY_API_KEY') || 'apify_api_HPY8g4rmJkNXPgh4CMNjeMIisdZBlw14QAIy';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
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

    const {
      profileUrl,
      companyUrl,
      websiteUrl,
      type,
      category,
      scrapingFunction,
      extractFields,
      processWithChatGPT,
      chatGPTPrompt
    } = await req.json();


    let scrapedData: any = {};
    let processedData: any = {};

    // Step 1: Scrape based on category
    switch (category) {
      case 'LinkedIn Profile':
        scrapedData = await scrapeLinkedInProfile(profileUrl);
        break;
      case 'LinkedIn Company Page':
        scrapedData = await scrapeLinkedInCompany(companyUrl);
        break;
      case 'Website Text Scraper':
        scrapedData = await scrapeWebsiteText(websiteUrl);
        break;
      default:
        throw new Error(`Unsupported category: ${category}`);
    }


    // Step 2: Process with ChatGPT if requested
    if (processWithChatGPT && openAIApiKey && chatGPTPrompt) {
      processedData = await processWithOpenAI(scrapedData, chatGPTPrompt, category, userId);
    }

    return new Response(
      JSON.stringify({
        success: true,
        data: scrapedData,
        processedData: processedData,
        category: category,
        scrapingMethod: scrapingFunction
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || 'Failed to scrape brand information'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

// LinkedIn Profile Scraper using Apify
async function scrapeLinkedInProfile(profileUrl: string) {
  
  try {
    // Use Apify's LinkedIn Profile Scraper
    const runInput = {
      startUrls: [{ url: profileUrl }],
      resultsLimit: 1,
      // Apify LinkedIn Profile Scraper specific settings
      proxyConfiguration: {
        useApifyProxy: true,
        apifyProxyGroups: ['RESIDENTIAL']
      }
    };

    // Start Apify run using the LinkedIn Profile Full Sections Scraper from your account
    const runResponse = await fetch(`https://api.apify.com/v2/acts/apimaestro~linkedin-profile-full-sections-scraper/runs?token=${apifyApiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(runInput),
    });

    if (!runResponse.ok) {
      throw new Error(`Apify run failed: ${runResponse.status}`);
    }

    const runData = await runResponse.json();
    const runId = runData.data.id;

    // Wait for run to complete and get results
    const results = await waitForApifyResults(runId);
    
    if (results && results.length > 0) {
      const profile = results[0];
      return {
        name: profile.fullName || profile.name,
        headline: profile.headline,
        summary: profile.summary || profile.about,
        experience: profile.experience || [],
        skills: profile.skills || [],
        education: profile.education || [],
        location: profile.location,
        profileImageUrl: profile.profileImageUrl,
        connectionsCount: profile.connectionsCount,
        followersCount: profile.followersCount
      };
    }

    throw new Error('No profile data found');

  } catch (error) {
    // Fallback to basic text scraping
    return await fallbackTextScrape(profileUrl);
  }
}

// LinkedIn Company Scraper using Apify
async function scrapeLinkedInCompany(companyUrl: string) {
  
  try {
    // Use Apify's LinkedIn Company Scraper
    const runInput = {
      startUrls: [{ url: companyUrl }],
      resultsLimit: 1,
      proxyConfiguration: {
        useApifyProxy: true,
        apifyProxyGroups: ['RESIDENTIAL']
      }
    };

    // Start Apify run using the LinkedIn Company Profile Scraper from your account
    const runResponse = await fetch(`https://api.apify.com/v2/acts/pratikdani~linkedin-company-profile-scraper/runs?token=${apifyApiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(runInput),
    });

    if (!runResponse.ok) {
      throw new Error(`Apify company run failed: ${runResponse.status}`);
    }

    const runData = await runResponse.json();
    const runId = runData.data.id;

    // Wait for run to complete and get results
    const results = await waitForApifyResults(runId);
    
    if (results && results.length > 0) {
      const company = results[0];
      return {
        name: company.name || company.companyName,
        description: company.description || company.about,
        industry: company.industry,
        size: company.companySize || company.employeeCount,
        headquarters: company.headquarters || company.location,
        specialties: company.specialities || company.specialties || [],
        website: company.website,
        followerCount: company.followerCount,
        logoUrl: company.logoUrl,
        coverImageUrl: company.coverImageUrl,
        foundedYear: company.foundedYear
      };
    }

    throw new Error('No company data found');

  } catch (error) {
    // Fallback to basic text scraping
    return await fallbackTextScrape(companyUrl);
  }
}

// Website Text Scraper using Apify Web Scraper
async function scrapeWebsiteText(websiteUrl: string) {
  
  try {
    // Use Apify's Text Scraper (Free) - simpler input format
    const runInput = {
      startUrls: [{ url: websiteUrl }],
      maxPagesPerCrawl: 1,
      proxyConfiguration: {
        useApifyProxy: true
      }
    };

    // Start Apify run using the Text Scraper (Free) from your account
    const runResponse = await fetch(`https://api.apify.com/v2/acts/karamelo~text-scraper-free/runs?token=${apifyApiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(runInput),
    });

    if (!runResponse.ok) {
      throw new Error(`Apify web scraper run failed: ${runResponse.status}`);
    }

    const runData = await runResponse.json();
    const runId = runData.data.id;

    // Wait for run to complete and get results
    const results = await waitForApifyResults(runId);
    
    if (results && results.length > 0) {
      return results[0];
    }

    throw new Error('No website data found');

  } catch (error) {
    // Fallback to basic text scraping
    return await fallbackTextScrape(websiteUrl);
  }
}

// Wait for Apify results
async function waitForApifyResults(runId: string, maxWaitTime: number = 300000) {
  const startTime = Date.now();
  
  while (Date.now() - startTime < maxWaitTime) {
    try {
      const statusResponse = await fetch(`https://api.apify.com/v2/acts/runs/${runId}?token=${apifyApiKey}`);
      const statusData = await statusResponse.json();
      
      
      if (statusData.data.status === 'SUCCEEDED') {
        // Get results
        const resultsResponse = await fetch(`https://api.apify.com/v2/datasets/${statusData.data.defaultDatasetId}/items?token=${apifyApiKey}`);
        const results = await resultsResponse.json();
        return results;
      }
      
      if (statusData.data.status === 'FAILED' || statusData.data.status === 'ABORTED') {
        throw new Error(`Apify run ${statusData.data.status.toLowerCase()}`);
      }
      
      // Wait 2 seconds before checking again
      await new Promise(resolve => setTimeout(resolve, 2000));
      
    } catch (error) {
      throw error;
    }
  }
  
  throw new Error('Apify run timed out');
}

// Fallback text scraping (similar to existing scrape-product-info but for brand content)
async function fallbackTextScrape(url: string) {
  
  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      }
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch URL: ${response.status}`);
    }

    const html = await response.text();
    
    // Extract basic information
    const title = extractTitle(html);
    const description = extractMetaDescription(html);
    const content = extractMainContent(html);
    
    return {
      title,
      description,
      content: content.substring(0, 2000), // Limit content size
      name: title,
      summary: description
    };
    
  } catch (error) {
    throw error;
  }
}

// Process scraped data with OpenAI using category-specific prompts
async function processWithOpenAI(scrapedData: any, prompt: string, category: string, userId?: string) {
  
  try {
    const dataString = JSON.stringify(scrapedData, null, 2);
    
    let systemMessage = '';
    let userMessage = '';
    
    // Use category-specific prompts
    if (category === 'LinkedIn Company Page') {
      systemMessage = `You are a professional company summarizer who writes in a conversational, human tone — no titles, no exaggerated introductions, no honorifics, no unnecessary praise.

Your task is to rewrite scraped COMPANY content (LinkedIn Company/Showcase or website "About" page) into a detailed, clear, and engaging brand introduction. This is about a company, not a person.

Non-negotiable: do not miss any relevant information from the source. Also, include the full name of the company. Include every factual detail that is not boilerplate. If details repeat, merge them once. Never invent facts.

Rules:
- Start with the official company/brand name (include legal suffix if present, e.g., Inc., GmbH, LLC), then—in the opening sentence—state what the company does.
- Preserve ALL meaningful facts from the source: founding year, HQ city/country, mission/positioning, credibility signals (customer counts, years of experience, awards, certifications, "Made in …"), primary products/services, product pillars or categories, technologies/capabilities, markets/regions, sales channels (DTC/B2B/Retail/Marketplaces), notable partnerships, sustainability/quality standards, and website if present.
- If quantitative stats appear (years, numbers of customers, regions, team size, product counts), include them exactly.
- Ignore navigation, cookie banners, cart/checkout text, generic menus, job listings, and other boilerplate.
- Translate to English if the source is not in English.
- Plain text only — no Markdown, no bullets, no bold/italics, no headings, no JSON.
- Length target: 240–300 words. Use smooth, connected sentences (no list-like fragments).
- End with one concise sentence listing the company's key product categories and main markets served.
- Do not carry over anything from previous brands; base the summary only on the provided input.

Output: final brand introduction paragraph, at the bottom brand messaging should be included along tagline.`;

      userMessage = `You are a content spinner, your job is to take information from Linkedin company profiles and rewrite it in a way that it summarises the whole linkedin profile in a detailed summary. Output in summary.

Here is the scraped company content (raw text or JSON). Extract fields as specified and return plain text only.

SCRAPED_INPUT:
${dataString}`;

    } else {
      // Default prompt for other categories
      systemMessage = 'You are a brand analysis expert. Extract and summarize brand information in a conversational tone.';
      userMessage = `${prompt}
      
      SCRAPED DATA FROM ${category}:
      ${dataString}
      
      Please extract and structure the brand information as requested. Return plain text summary.`;
    }
    
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
            content: systemMessage
          },
          {
            role: 'user',
            content: userMessage
          }
        ],
        temperature: 0.3,
        max_tokens: 500
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    const aiResponse = data.choices[0].message.content;

    // Return the plain text response for LinkedIn Company
    if (category === 'LinkedIn Company Page') {
      return { 
        brandIntroduction: aiResponse,
        processedSummary: aiResponse
      };
    }
    
    // For other categories, try to parse as JSON or return raw response
    try {
      return JSON.parse(aiResponse);
    } catch (parseError) {
      return { rawResponse: aiResponse, processedSummary: aiResponse };
    }
    
  } catch (error) {
    return {};
  }
}

// Helper functions for fallback scraping
function extractTitle(html: string): string {
  const patterns = [
    /<meta[^>]*property="og:title"[^>]*content="([^"]+)"/i,
    /<title[^>]*>([^<]+)<\/title>/i,
    /<h1[^>]*>([^<]+)<\/h1>/i
  ];

  for (const pattern of patterns) {
    const match = html.match(pattern);
    if (match && match[1]) {
      return match[1].trim();
    }
  }
  
  return '';
}

function extractMetaDescription(html: string): string {
  const patterns = [
    /<meta[^>]*name="description"[^>]*content="([^"]+)"/i,
    /<meta[^>]*property="og:description"[^>]*content="([^"]+)"/i
  ];

  for (const pattern of patterns) {
    const match = html.match(pattern);
    if (match && match[1]) {
      return match[1].trim();
    }
  }
  
  return '';
}

function extractMainContent(html: string): string {
  // Remove scripts and styles
  let content = html.replace(/<(script|style)[^>]*>[\s\S]*?<\/\1>/gi, '');
  
  // Try to find main content areas
  const contentPatterns = [
    /<main[^>]*>([\s\S]*?)<\/main>/gi,
    /<div[^>]*class="[^"]*(?:main|content|about)[^"]*"[^>]*>([\s\S]*?)<\/div>/gi,
    /<article[^>]*>([\s\S]*?)<\/article>/gi
  ];
  
  for (const pattern of contentPatterns) {
    const matches = content.matchAll(pattern);
    for (const match of matches) {
      const text = match[1].replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
      if (text.length > 100) {
        return text;
      }
    }
  }
  
  // Fallback: extract from body, excluding nav and footer
  content = content.replace(/<(nav|footer|header)[^>]*>[\s\S]*?<\/\1>/gi, '');
  const bodyMatch = content.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
  if (bodyMatch) {
    return bodyMatch[1].replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
  }
  
  return '';
}