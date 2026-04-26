import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { initSentry, Sentry } from "../_shared/sentry.ts";

initSentry();
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type'
};
// Apify API Service - Comprehensive integration for all actors
class ApifyService {
  apiKey;
  baseUrl = 'https://api.apify.com/v2';
  constructor(apiKey) {
    this.apiKey = apiKey;
  }
  // List all your available actors
  async listMyActors(limit = 50) {
    const response = await fetch(`${this.baseUrl}/acts?token=${this.apiKey}&limit=${limit}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    if (!response.ok) {
      throw new Error(`Failed to list actors: ${response.status}`);
    }
    return await response.json();
  }
  // Get actor details
  async getActor(actorId) {
    const response = await fetch(`${this.baseUrl}/acts/${actorId}?token=${this.apiKey}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    if (!response.ok) {
      throw new Error(`Failed to get actor ${actorId}: ${response.status}`);
    }
    return await response.json();
  }
  // Start actor run
  async startRun(actorId, input, options = {}) {
    const response = await fetch(`${this.baseUrl}/acts/${actorId}/runs?token=${this.apiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        ...input,
        ...options
      })
    });
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to start run for ${actorId}: ${response.status} - ${errorText}`);
    }
    const runData = await response.json();
    if (!runData.data?.id) {
      throw new Error('No run ID returned from Apify');
    }
    return runData;
  }
  // Wait for run completion and get results
  async waitForResults(runId, maxWaitTime = 60000) {
    const startTime = Date.now();
    while (Date.now() - startTime < maxWaitTime) {
      try {
        // Check run status
        const statusUrl = `${this.baseUrl}/actor-runs/${runId}?token=${this.apiKey}`;
        const statusResponse = await fetch(statusUrl);
        if (!statusResponse.ok) {
          const errorText = await statusResponse.text();
          throw new Error(`Failed to check run status: ${statusResponse.status}`);
        }
        const statusData = await statusResponse.json();
        if (statusData.data.status === 'SUCCEEDED') {
          // Get results from dataset
          const datasetId = statusData.data.defaultDatasetId;
          const resultsResponse = await fetch(`${this.baseUrl}/datasets/${datasetId}/items?token=${this.apiKey}`);
          if (!resultsResponse.ok) {
            throw new Error(`Failed to fetch results: ${resultsResponse.status}`);
          }
          const results = await resultsResponse.json();
          return results;
        }
        if (statusData.data.status === 'FAILED') {
          const errorMessage = statusData.data.errorMessage || 'Run failed without specific error message';
          throw new Error(`Apify run failed: ${errorMessage}`);
        }
        if (statusData.data.status === 'ABORTED') {
          throw new Error('Apify run was aborted');
        }
        if (statusData.data.status === 'TIMED-OUT') {
          throw new Error('Apify run timed out');
        }
        // Wait 3 seconds before checking again
        await new Promise((resolve) => setTimeout(resolve, 3000));
      } catch (error) {
        throw error;
      }
    }
    throw new Error(`Run ${runId} timed out after ${maxWaitTime / 1000} seconds`);
  }
  // Run actor and wait for results (convenience method)
  async runActor(actorId, input, options = {}, maxWaitTime = 60000) {
    try {
      const runData = await this.startRun(actorId, input, options);
      if (!runData.data?.id) {
        if (runData.id) {
          const results = await this.waitForResults(runData.id, maxWaitTime);
          return {
            success: true,
            runId: runData.id,
            data: results,
            actorId
          };
        } else {
          throw new Error('No run ID found in response');
        }
      }
      const results = await this.waitForResults(runData.data.id, maxWaitTime);
      return {
        success: true,
        runId: runData.data.id,
        data: results,
        actorId
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        actorId,
        errorDetails: error.stack
      };
    }
  }
  // LinkedIn Company Profile Scraper with OpenAI processing
  async scrapeLinkedInCompany(companyUrl, options = {}) {
    // Extract company identifier from LinkedIn URL
    const companyId = this.extractLinkedInCompanyId(companyUrl);
    if (!companyId) {
      throw new Error('Could not extract company identifier from LinkedIn URL');
    }
    const actorId = 'pratikdani~linkedin-company-profile-scraper';
    const input = {
      url: companyUrl,
      resultsLimit: options.resultsLimit || 1,
      proxyConfiguration: {
        useApifyProxy: true,
        apifyProxyGroups: options.proxyGroups || [
          'RESIDENTIAL'
        ]
      },
      ...options
    };
    const result = await this.runActor(actorId, input, {}, options.maxWaitTime || 60000);
    // Process each company through OpenAI if scraping was successful
    if (result.success && result.data && Array.isArray(result.data)) {
      for (let i = 0; i < result.data.length; i++) {
        try {
          const processedCompany = await this.processLinkedInCompanyWithOpenAI(result.data[i]);
          result.data[i].openai_processed_summary = processedCompany;
        } catch (error) {
          result.data[i].openai_processing_error = error.message;
        }
      }
    }
    return result;
  }
  // Extract company identifier from LinkedIn company URL
  extractLinkedInCompanyId(companyUrl) {
    try {
      // Handle different LinkedIn company URL formats
      // https://www.linkedin.com/company/company-name
      // https://linkedin.com/company/company-name/
      const url = new URL(companyUrl);
      const pathParts = url.pathname.split('/').filter((part) => part.length > 0);
      // Find the company name after 'company'
      const companyIndex = pathParts.indexOf('company');
      if (companyIndex !== -1 && pathParts.length > companyIndex + 1) {
        const companyId = pathParts[companyIndex + 1];
        return companyId;
      }
      return null;
    } catch (error) {
      return null;
    }
  }
  // LinkedIn Profile Full Sections Scraper with OpenAI processing
  async scrapeLinkedInProfile(profileUrl, options = {}) {
    // Extract username from LinkedIn URL
    const username = this.extractLinkedInUsername(profileUrl);
    if (!username) {
      throw new Error('Could not extract username from LinkedIn URL');
    }
    const actorId = 'apimaestro~linkedin-profile-full-sections-scraper';
    const input = {
      username: username,
      resultsLimit: options.resultsLimit || 1,
      proxyConfiguration: {
        useApifyProxy: true,
        apifyProxyGroups: options.proxyGroups || [
          'RESIDENTIAL'
        ]
      },
      ...options
    };
    const result = await this.runActor(actorId, input, {}, options.maxWaitTime || 60000);
    // Process each profile through OpenAI if scraping was successful
    if (result.success && result.data && Array.isArray(result.data)) {
      for (let i = 0; i < result.data.length; i++) {
        try {
          const processedProfile = await this.processLinkedInProfileWithOpenAI(result.data[i]);
          result.data[i].openai_processed_summary = processedProfile;
        } catch (error) {
          result.data[i].openai_processing_error = error.message;
        }
      }
    }
    return result;
  }
  // Extract username from LinkedIn profile URL
  extractLinkedInUsername(profileUrl) {
    try {
      // Handle different LinkedIn URL formats
      // https://www.linkedin.com/in/username
      // https://linkedin.com/in/username/
      // https://www.linkedin.com/in/username/
      const url = new URL(profileUrl);
      const pathParts = url.pathname.split('/').filter((part) => part.length > 0);
      // Find the username after 'in'
      const inIndex = pathParts.indexOf('in');
      if (inIndex !== -1 && pathParts.length > inIndex + 1) {
        const username = pathParts[inIndex + 1];
        return username;
      }
      return null;
    } catch (error) {
      return null;
    }
  }
  // Process LinkedIn company data through OpenAI
  async processLinkedInCompanyWithOpenAI(companyData) {
    const openaiApiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openaiApiKey) {
      throw new Error('OPENAI_API_KEY environment variable is required');
    }
    // Extract relevant sections from the company data
    const companyName = companyData.name || companyData.company_name || '';
    const description = companyData.description || companyData.about || '';
    const industry = companyData.industry || '';
    const size = companyData.company_size || companyData.employees || '';
    const location = companyData.location || companyData.headquarters || '';
    const website = companyData.website || '';
    const specialties = companyData.specialties || '';
    // Format the input text for company processing
    let inputText = `Company: ${companyName}
Industry: ${industry}
Size: ${size}
Location: ${location}
Website: ${website}
Specialties: ${specialties}

About: ${description}`;
    const messages = [
      {
        role: "system",
        content: "You are a professional company summarizer who writes in a factual, human tone. Do not use titles, exaggerated openings, honorifics, hashtags, or unnecessary praise. Your task is to rewrite scraped company information (from LinkedIn or website sources) into a clear, comprehensive brand introduction. Rules: Begin with the full official company name (including Inc., GmbH, etc.) and clearly state what the company does in the opening sentence. Include all factual details: founding year, headquarters, mission, markets, services or product lines, technologies, regions, channels, partnerships, and certifications. Keep all numeric information (team size, customers, years, etc.) exactly as found. Ignore boilerplate such as menus, job listings, or cookie notices. Translate non-English content into English. Output plain text only - no Markdown, no bullets, no emojis, no hashtags. Length target: 250-450 words, written as smooth, connected sentences. End with two lines separated by blank spacing: Brand message: ... and Brand tagline: ..."
      },
      {
        role: "user",
        content: inputText
      }
    ];
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiApiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: messages,
        max_tokens: 600,
        temperature: 0.4
      })
    });
    if (!response.ok) {
      const errorData = await response.text();
      throw new Error(`OpenAI API error: ${response.status} - ${errorData}`);
    }
    const data = await response.json();
    const summary = data.choices[0]?.message?.content || 'No summary generated';
    return summary;
  }
  // Process LinkedIn profile data through OpenAI
  async processLinkedInProfileWithOpenAI(profileData) {
    const openaiApiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openaiApiKey) {
      throw new Error('OPENAI_API_KEY environment variable is required');
    }
    // Extract relevant sections from the profile data
    const basicInfo = profileData.basicInfo || '';
    const experience = profileData.experience || profileData.positions || '';
    const education = profileData.education || '';
    const languages = profileData.languages || '';
    const skills = profileData.skills || '';
    const recommendations = profileData.recommendations || '';
    // Format the input text using the template variables
    let inputText = `{{s_basic_info}}  
{{s_experience}}  
{{s_education}}  
{{s_languages}}  
{{s_skills}}  
{{s_recommendations}}`;
    // Replace template variables with actual data
    inputText = inputText.replace('{{s_basic_info}}', typeof basicInfo === 'string' ? basicInfo : JSON.stringify(basicInfo)).replace('{{s_experience}}', typeof experience === 'string' ? experience : JSON.stringify(experience)).replace('{{s_education}}', typeof education === 'string' ? education : JSON.stringify(education)).replace('{{s_languages}}', typeof languages === 'string' ? languages : JSON.stringify(languages)).replace('{{s_skills}}', typeof skills === 'string' ? skills : JSON.stringify(skills)).replace('{{s_recommendations}}', typeof recommendations === 'string' ? recommendations : JSON.stringify(recommendations));
    const messages = [
      {
        role: "system",
        content: "You are a professional LinkedIn profile rewriter who writes in a natural, human tone. Do not use titles, exaggerated introductions, honorifics, or unnecessary praise. Your task is to rewrite LinkedIn profile data into a detailed, factual, and conversational biography. Rules: Include all relevant facts, achievements, skills, and experiences from the source text. Do not omit information unless repeated verbatim. Convert fragmented points into smooth, connected sentences that read naturally. Keep it factual, warm, and easy to read in plain English. Avoid jargon, buzzwords, and bullet points. Output plain text only - no Markdown, no bold, no italics, no emojis. Maintain a consistent word count between 240-300 words for detailed profiles. Output only the biography text - no headers, explanations, or formatting. Follow the same tone and structure across all outputs."
      },
      {
        role: "user",
        content: "You are a LinkedIn content rewriter. Your job is to take the provided LinkedIn data and produce a detailed, well-connected summary that captures the person's full professional story. Output only the summary text."
      },
      {
        role: "user",
        content: inputText
      }
    ];
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiApiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: messages,
        max_tokens: 600,
        temperature: 0.4
      })
    });
    if (!response.ok) {
      const errorData = await response.text();
      throw new Error(`OpenAI API error: ${response.status} - ${errorData}`);
    }
    const data = await response.json();
    const summary = data.choices[0]?.message?.content || 'No summary generated';
    return summary;
  }
  // Website Text Scraper with OpenAI Processing
  async scrapeWebsiteText(websiteUrl, options = {}) {
    const actorId = "karamelo~text-scraper-free";
    const input = {
      urls: [
        websiteUrl
      ],
      ...options || {}
    };
    const result = await this.runActor(actorId, input, {}, options && options.maxWaitTime ? options.maxWaitTime : 60000);
    // Add OpenAI processing for website text
    if (result && result.success && Array.isArray(result.data)) {
      const openaiApiKey = Deno.env.get("OPENAI_API_KEY");
      if (!openaiApiKey) {
        return result;
      }
      for (let i = 0; i < result.data.length; i++) {
        try {
          const websiteData = result.data[i] || {};
          const rawText = ((websiteData.title || "") + "\n\n" + (websiteData.textContent || "")).trim();
          // --- Summary prompt ---
          const systemPrompt = "You are a professional content summarizer for brand websites. " + "Take raw website text and create a clean, human-readable brand profile introduction. " + "Rules: preserve meaningful information (mission, history, values, products/services, differentiation); ignore navigation, cookie banners, cart/checkout notices, boilerplate legal text, repetitive price lists, and duplicate sale offers; translate to English if needed; never invent facts. " + "Output must be one cohesive paragraph (plain text only, no bullets or markdown), 5-10 sentences, not shorter than 200 words if there is enough content. " + "At the bottom include two lines exactly:\n" + "Brand Message: <concise 1-2 sentence positioning/values>" + "\n\n" + "Brand Tagline: <the tagline from the source, or a concise one-line synthesis if available>";
          const userPrompt = "Summarize this website text into a detailed brand introduction. Make sure Brand Message and Brand Tagline appear on separate lines with space between them:\n\n<RAW_TEXT_START>\n" + (rawText || "") + "\n<RAW_TEXT_END>";
          // 1) OpenAI call for summary
          const response = await fetch("https://api.openai.com/v1/chat/completions", {
            method: "POST",
            headers: {
              "Authorization": "Bearer " + openaiApiKey,
              "Content-Type": "application/json"
            },
            body: JSON.stringify({
              model: "gpt-4o-mini",
              messages: [
                {
                  role: "system",
                  content: systemPrompt
                },
                {
                  role: "user",
                  content: userPrompt
                }
              ],
              temperature: 0.3,
              max_tokens: 700
            })
          });
          if (!response.ok) {
            const errText = await response.text().catch(function () {
              return "";
            });
            throw new Error("OpenAI API error: " + response.status + (errText ? " - " + errText : ""));
          }
          const data = await response.json();
          const processedText = data && data.choices && data.choices[0] && data.choices[0].message && typeof data.choices[0].message.content === "string" ? data.choices[0].message.content.trim() : "";
          if (processedText) {
            result.data[i].openai_processed_summary = processedText;
          } else {
          }
          // 2) ADD BRAND NAME CODE RIGHT HERE (after summary, inside same try block)
          const brandNameResponse = await fetch("https://api.openai.com/v1/chat/completions", {
            method: "POST",
            headers: {
              "Authorization": "Bearer " + openaiApiKey,
              "Content-Type": "application/json"
            },
            body: JSON.stringify({
              model: "gpt-4o-mini",
              temperature: 0,
              max_tokens: 20,
              messages: [
                {
                  role: "system",
                  content: "Extract only the company or brand name from the website content. Return just the name, nothing else."
                },
                {
                  role: "user",
                  content: "What is the brand or company name from this text:\n\n" + (rawText || "")
                }
              ]
            })
          });
          if (brandNameResponse.ok) {
            const brandData = await brandNameResponse.json();
            const choice = brandData && brandData.choices && brandData.choices.length > 0 ? brandData.choices[0] : null;
            const brandName = choice && choice.message && typeof choice.message.content === "string" ? choice.message.content.trim().replace(/[\r\n]+/g, " ") : "";
            if (brandName) {
              result.data[i].extracted_brand_name = brandName;
            } else {
            }
          } else {
            const brandErrText = await brandNameResponse.text().catch(function () {
              return "";
            });
          }
        } catch (error) {
          const msg = error && error.message ? error.message : String(error);
          try {
            result.data[i].openai_processing_error = msg;
          } catch (_) { }
        }
      }
    }
    return result;
  }
  // Google Trends Scraper
  async scrapeGoogleTrends(keywords, options = {}) {
    const actorId = 'apify~google-trends-scraper';
    const input = {
      searchTerms: keywords,
      timeRange: options.timeRange || 'today 12-m',
      geoLocation: options.geoLocation || '',
      category: options.category || 0,
      outputAsISODate: options.outputAsISODate || false,
      includeRelatedQueries: options.includeRelatedQueries || true,
      includeRelatedTopics: options.includeRelatedTopics || true,
      ...options
    };
    return await this.runActor(actorId, input, {}, options.maxWaitTime || 45000);
  }
  // Generic method to run any actor with custom input
  async runCustomActor(actorId, input, options = {}) {
    return await this.runActor(actorId, input, {}, options.maxWaitTime || 60000);
  }
  // Get run details
  async getRunDetails(runId) {
    const response = await fetch(`${this.baseUrl}/acts/runs/${runId}?token=${this.apiKey}`);
    if (!response.ok) {
      throw new Error(`Failed to get run details: ${response.status}`);
    }
    return await response.json();
  }
  // Get dataset items (results)
  async getDatasetItems(datasetId, options = {}) {
    const params = new URLSearchParams({
      token: this.apiKey,
      format: options.format || 'json',
      ...options.offset && {
        offset: options.offset.toString()
      },
      ...options.limit && {
        limit: options.limit.toString()
      }
    });
    const response = await fetch(`${this.baseUrl}/datasets/${datasetId}/items?${params}`);
    if (!response.ok) {
      throw new Error(`Failed to get dataset items: ${response.status}`);
    }
    return await response.json();
  }
  // List recent runs
  async listRecentRuns(limit = 10) {
    const response = await fetch(`${this.baseUrl}/acts/runs?token=${this.apiKey}&limit=${limit}&desc=1`);
    if (!response.ok) {
      throw new Error(`Failed to list runs: ${response.status}`);
    }
    return await response.json();
  }
}
// Helper function to create ApifyService instance
function createApifyService(apiKey) {
  const key = apiKey || Deno.env.get('APIFY_API_KEY');
  if (!key) {
    throw new Error('APIFY_API_KEY environment variable is required');
  }
  return new ApifyService(key);
}
serve(async (req) => {
  const startTime = Date.now();
  const requestId = crypto.randomUUID().substring(0, 8);
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      headers: corsHeaders
    });
  }
  try {
    const body = await req.json();
    const { action, ...params } = body;
    // Check environment variables
    const apifyKey = Deno.env.get('APIFY_API_KEY');
    const openaiKey = Deno.env.get('OPENAI_API_KEY');
    if (apifyKey) {
    }
    if (!apifyKey) {
    }
    // Initialize Apify service
    const initStart = Date.now();
    const apifyService = createApifyService();
    const initTime = Date.now() - initStart;
    let result;
    let actionStart = Date.now();
    switch (action) {
      case 'listMyActors':
        result = await apifyService.listMyActors(params.limit);
        break;
      case 'getActor':
        if (!params.actorId) throw new Error('actorId is required');
        result = await apifyService.getActor(params.actorId);
        break;
      case 'scrapeLinkedInCompany':
        if (!params.companyUrl) throw new Error('companyUrl is required');
        result = await apifyService.scrapeLinkedInCompany(params.companyUrl, params.options || {});
        break;
      case 'scrapeLinkedInProfile':
        if (!params.profileUrl) throw new Error('profileUrl is required');
        result = await apifyService.scrapeLinkedInProfile(params.profileUrl, params.options || {});
        if (result?.success && result?.data && Array.isArray(result.data)) {
          result.data.forEach((profile, index) => {
            if (profile.openai_processed_summary) {
            }
            if (profile.openai_processing_error) {
            }
          });
        } else if (!result?.success) {
        }
        break;
      case 'scrapeWebsiteText':
        if (!params.websiteUrl) throw new Error('websiteUrl is required');
        result = await apifyService.scrapeWebsiteText(params.websiteUrl, params.options || {});
        break;
      case 'scrapeGoogleTrends':
        if (!params.keywords) throw new Error('keywords array is required');
        result = await apifyService.scrapeGoogleTrends(params.keywords, params.options || {});
        break;
      case 'runCustomActor':
        if (!params.actorId) throw new Error('actorId is required');
        if (!params.input) throw new Error('input is required');
        result = await apifyService.runCustomActor(params.actorId, params.input, params.options || {});
        break;
      case 'getRunDetails':
        if (!params.runId) throw new Error('runId is required');
        result = await apifyService.getRunDetails(params.runId);
        break;
      case 'getDatasetItems':
        if (!params.datasetId) throw new Error('datasetId is required');
        result = await apifyService.getDatasetItems(params.datasetId, params.options || {});
        break;
      case 'listRecentRuns':
        result = await apifyService.listRecentRuns(params.limit || 10);
        break;
      case 'startRun':
        if (!params.actorId) throw new Error('actorId is required');
        if (!params.input) throw new Error('input is required');
        result = await apifyService.startRun(params.actorId, params.input, params.options || {});
        break;
      case 'waitForResults':
        if (!params.runId) throw new Error('runId is required');
        result = await apifyService.waitForResults(params.runId, params.maxWaitTime || 60000);
        break;
      default:
        throw new Error(`Unknown action: ${action}. Available actions: listMyActors, getActor, scrapeLinkedInCompany, scrapeLinkedInProfile, scrapeWebsiteText, scrapeGoogleTrends, runCustomActor, getRunDetails, getDatasetItems, listRecentRuns, startRun, waitForResults`);
    }
    const actionTime = Date.now() - actionStart;
    const totalTime = Date.now() - startTime;
    const responseData = {
      success: true,
      action: action,
      data: result,
      timing: {
        actionTime,
        totalTime
      },
      requestId
    };
    return new Response(JSON.stringify(responseData), {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      },
      status: 200
    });
  } catch (error: any) {
    const totalTime = Date.now() - startTime;
    Sentry.captureException(error);
    // Try to identify error context
    if (error.message.includes('API key')) {
    } else if (error.message.includes('fetch')) {
    } else if (error.message.includes('required')) {
    }
    const errorResponse = {
      success: false,
      error: error.message || 'Unknown error occurred',
      errorType: error.constructor.name,
      timestamp: new Date().toISOString(),
      requestId,
      timing: {
        totalTime
      }
    };
    return new Response(JSON.stringify(errorResponse), {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      },
      status: 400
    });
  }
});
