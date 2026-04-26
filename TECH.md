# SocialFlow — Technical Documentation

> AI-powered social content engine for the age of AI search. Helps brands create on-brand social content optimised to get cited and found on Perplexity, Claude, and Gemini.

---

## Origin

The initial UI was built using **[Lovable](https://lovable.dev)** — an AI-powered app builder that scaffolded the component structure, Tailwind styling, and Radix UI primitives. The project was then extended with custom server functions, Supabase persistence, AI integrations (OpenAI, Gemini, Peec, Tavily), and additional routes built directly in the codebase using Claude Code.

---

## Stack Overview

| Layer | Technology |
|---|---|
| Framework | TanStack Start (React + Vite) |
| Routing | TanStack Router (file-based) |
| Server Functions | TanStack Start `createServerFn` |
| Database | Supabase (Postgres) |
| Auth | Anonymous session via `localStorage` UUID |
| AI — Text | OpenAI GPT-4.1-mini |
| AI — Posts/Ideas | Google Gemini (via Supabase edge function) |
| AI — Images | Google Gemini Imagen 3 (via Supabase edge function) |
| AI — Web Scraping | Apify (via Supabase edge function) |
| AI — Trends | Tavily Search API |
| AI — LLM Visibility | Peec AI API |
| Styling | Tailwind CSS + Radix UI primitives |
| Icons | Lucide React |
| Deployment | Cloudflare (via `@cloudflare/vite-plugin`) |

---

## Routes

All app routes (except `/`) render inside `AppLayout` which provides the sidebar navigation.

| Path | File | Page/Component |
|---|---|---|
| `/` | `routes/index.tsx` | `LandingPage` — public homepage with animated LLM cycling hero |
| `/brand-setup` | `routes/brand-setup.tsx` | `BrandIdentityStep` — full brand setup with URL analyser + Peec AI |
| `/strategy` | `routes/strategy.tsx` | Content strategy builder — content mix & pillars |
| `/campaigns` | `routes/campaigns.tsx` | Campaign wizard — dates, platforms, AI events |
| `/post-ideation` | `routes/post-ideation.tsx` | `PostIdeation` — generate and save post ideas |
| `/post-generation` | `routes/post-generation.tsx` | `PostGeneration` — generate full post copy and carousels |
| `/image-generation` | `routes/image-generation.tsx` | `ImageGeneration` — Nano Banana Pro AI image generator |

---

## Key Components

### Layout
- **`AppLayout.tsx`** — Sidebar with nav links: Dashboard, Brand Setup, Content Strategy, Campaigns, Post Ideation, Post Generation, Nano Banana Pro (with gradient sparkle styling). Wraps all app pages.

### Brand Setup
- **`BrandIdentityStep.tsx`** — Full 3-step brand setup wizard:
  - **Step 1 — Brand Identity:** URL analyser (paste website → auto-fills brand name + intro via Apify scraper), manual brand name + intro fields, Peec AI insights panel (share of voice, sentiment, competitors, insight bullets), "Load Peec AI Insights" trigger button
  - **Step 2 — Audience Profiles:** Uses `AudienceProfiles` component
  - **Step 3 — Products & Services:** Uses `ProductsServices` component
  - Save & Continue → `/strategy`

- **`AudienceProfiles.tsx`** — Add/edit/delete target audiences. AI suggest via `suggestAudiences` server fn. Props: `brandName`, `introduction`.
- **`ProductsServices.tsx`** — Add/edit/delete products and services.

### Content
- **`PostIdeation.tsx`** — Runs PEEC analysis, selects signals (prompts, chat gaps, UGC brief), generates post ideas via `generatePostIdeas`. Saves ideas to Supabase.
- **`PostGeneration.tsx`** — Generates full post content per idea via `generatePostContent`. Shows carousel slides, PEEC amber-highlight demo, per-post checkboxes, export brief, and "Generate Images with Nano Banana Pro" CTA. Persists approved posts to Supabase `generated_posts`.
- **`ImageGeneration.tsx`** — Loads approved posts, lets user configure brand style (colors, font, logo), generates images per post/slide via Gemini Imagen 3.

---

## Server Functions (`src/server/brand.functions.ts`)

All functions use `createServerFn({ method: "POST" })` with Zod input validation. Introduction field accepts up to 2000 characters.

| Function | What it does |
|---|---|
| `analyzeBrandUrl` | Scrapes a website URL via the `apify-universal` edge function, extracts brand name + introduction (up to 2000 chars). Auto-triggers Peec AI after successful analysis. |
| `fetchPeecInsights` | Calls the `fetch-peec-insights` edge function — returns share of voice %, sentiment score (0–100), competitor list with SOV, content prompts, chat gaps, and UGC brief |
| `suggestAudiences` | Generates 3 target audience profiles (name, role/industry, challenge) using OpenAI GPT-4.1-mini |
| `fetchLocationEvents` | Fetches local holidays and events for a date range using GPT-4.1-mini |
| `autoAnalyzePillars` | Generates 4 content pillar topics from brand name + intro using GPT-4.1-mini |
| `draftProductDescription` | Writes a product description using GPT-4.1-mini |
| `searchTavily` | Searches Tavily for trending articles across content pillars |
| `searchTavilyByPillar` | Calls `fetch-tavily-trends` edge function to search trends per individual pillar |
| `generatePostContent` | Calls `generate-post-content` edge function — returns post copy, carousel slides, hashtags, content format via Gemini |
| `generatePostIdeas` | Calls `generate-post-ideas-gemma` edge function — generates 6–30 post ideas for given platforms/pillars via Gemini |
| `generateImageBannerbear` | Calls `generate-image-bannerbear` edge function — generates an image via Gemini Imagen 3 from a text prompt built from post content + brand style |

---

## Supabase Edge Functions

| Function | Input | Action | Output |
|---|---|---|---|
| `apify-universal` | `{ action, websiteUrl, options }` | Scrapes website text via Apify API | `{ success, data: [{ extracted_brand_name, openai_processed_summary }] }` |
| `analyze-brand-url` | `{ url }` | Scrapes + summarises brand website | `{ brandName, introduction }` |
| `fetch-peec-insights` | `{ brandName, brandDescription }` | Calls Peec AI API for LLM visibility data | `{ visibility, sentiment, position, competitors[], contentRecommendations, postIdeation }` |
| `fetch-tavily-trends` | `{ pillars[], brandName }` | Searches Tavily for trending content per pillar | `{ results: Record<pillar, articles[]> }` |
| `generate-post-content` | `{ idea, brandName, platform, ... }` | Generates full post via Gemini | `{ content, slides[], hashtags[], contentFormat }` |
| `generate-post-ideas-gemma` | `{ brandName, platforms[], pillars[], ... }` | Generates post ideas via Gemini | `{ ideas[] }` |
| `generate-image-bannerbear` | `{ prompt, aspectRatio? }` | Calls Gemini Imagen 3 (`imagen-3.0-generate-002`) | `{ success, imageUrl: "data:image/png;base64,..." }` |
| `enhanced-brand-scraper` | `{ url }` | Alternative brand scraper (fallback) | `{ brandName, introduction }` |

---

## Data Layer (`src/hooks/use-brand-store.ts`)

### Session Identity
```ts
getSessionId(): string
```
Generates and persists a UUID in `localStorage` (`socialflow.session_id`). All Supabase rows are scoped to this session ID — no auth required.

### React Hooks (localStorage + cross-tab sync)
```ts
useAudiences()   // [Audience[], updater]
useProducts()    // [Product[], updater]
```

### Supabase Persistence Functions
```ts
// Brand
saveBrandProfile(brandName, introduction)
loadBrandProfile(): Promise<{ brandName, introduction } | null>

// Audiences
saveAudiencesToDB(audiences[])
loadAudiencesFromDB(): Promise<Audience[]>

// Products
saveProductsToDB(products[])
loadProductsFromDB(): Promise<Product[]>

// Campaigns
saveCampaignToDB(campaign): Promise<string | null>   // returns id
loadLatestCampaignFromDB(): Promise<CampaignData | null>

// Post Ideation
savePostIdeationState(state)
loadPostIdeationState(): Promise<PostIdeationState | null>

// Content Strategy
saveStrategyToDB(settings)
loadStrategyFromDB(): Promise<StrategySettings | null>

// Generated Posts
saveGeneratedPostsToDB(posts[])
loadGeneratedPostsFromDB(): Promise<GeneratedPostRow[]>
```

---

## Supabase Tables

| Table | Key Fields | Notes |
|---|---|---|
| `brand_profiles` | `session_id` (PK), `brand_name`, `introduction` | Upserted on conflict |
| `audiences` | `id`, `session_id`, `name`, `role_and_industry`, `challenge` | Deleted + re-inserted on save |
| `products` | `id`, `session_id`, `name`, `description` | Deleted + re-inserted on save |
| `campaigns` | `id`, `session_id`, `name`, `content_pillars[]`, `start_date`, `end_date`, `location`, `selected_audience_ids[]`, `selected_product_ids[]`, `selected_platforms[]`, `ai_events[]`, `updated_at` | Insert or update by id |
| `post_ideation_state` | `session_id` (PK), `peec_data`, `selected_peec_signals`, `ideas[]`, `saved_ideas[]`, `number_of_posts` | Upserted on conflict |
| `content_strategy` | `session_id` (PK), `preset_id`, `custom_mix`, `product_mention` | Upserted on conflict |
| `generated_posts` | `session_id`, `idea_id`, `title`, `platform`, `content_type`, `pillar`, `peec_source`, `peec_signal`, `content`, `slides[]`, `hashtags[]`, `approved`, `content_format` | Upserted on `(session_id, idea_id)` |

---

## Types

```ts
type Audience = { id: string; name: string; roleAndIndustry: string; challenge: string }

type Product = { id: string; name: string; description: string }

type CampaignData = {
  id?: string; name: string; contentPillars: string[];
  startDate: string; endDate: string; location: string;
  selectedAudienceIds: string[]; selectedProductIds: string[];
  selectedPlatforms: string[]; aiEvents: object[];
}

type PostIdeationState = {
  peecData: unknown | null;
  selectedPeecSignals: { prompts: number[]; chatGaps: number[]; ugcBrief: number[] };
  ideas: unknown[]; savedIdeas: unknown[]; numberOfPosts: number;
}

type StrategySettings = {
  presetId: string; customMix: Record<string, number> | null; productMention: number;
}

type GeneratedPostRow = {
  ideaId: string; title: string; platform: string; contentType: string;
  pillar: string; peecSource: string | null; peecSignal?: string;
  content: string; slides: { title: string; content: string }[];
  hashtags: string[]; approved: boolean; contentFormat?: string;
}

type PeecInsightsFull = {
  visibility: { shareOfVoice: number };  // % of AI responses mentioning the brand
  sentiment: number;                      // 0–100
  position: number;
  competitors: { name: string; shareOfVoice: number; sentiment: number }[];
  contentRecommendations: {
    educational: { percentage: number; reason: string };
    ugc: { percentage: number; reason: string };
  };
  postIdeation: {
    volumeRankedPrompts: { prompt: string; rank: number; volume: string }[];
    chatGaps: string[];
    ugcBrief: string;
  };
  error?: string;
}
```

---

## Environment Variables

### Server-side (`process.env`)
| Variable | Used For |
|---|---|
| `OPENAI_API_KEY` | GPT-4.1-mini — audience suggestions, pillar analysis, events, product copy |
| `SUPABASE_URL` / `VITE_SUPABASE_URL` | Supabase project URL |
| `SUPABASE_PUBLISHABLE_KEY` / `VITE_SUPABASE_PUBLISHABLE_KEY` | Supabase anon key |
| `TAVILY_API_KEY` | Tavily trend search (server-side) |

### Supabase Edge Functions (`Deno.env.get`)
| Variable | Used For |
|---|---|
| `GEMINI_API_KEY` | Gemini Imagen 3 image generation |
| `OPENAI_API_KEY` | Post/idea generation fallback |
| `PEEC_API` | Peec AI LLM visibility insights |
| `TAVILY_API_KEY` | Tavily trend search (edge fn) |
| `APIFY_API_KEY` | Website scraping for brand URL analysis |

---

## User Flow

```
Landing Page (/)
    └── Get started → Brand Setup (/brand-setup)
            ├── 1. Paste website URL → Analyse → auto-fills brand + triggers Peec AI
            ├── 2. Peec AI panel: share of voice, sentiment, competitors
            ├── 3. Audience profiles (manual or AI suggest)
            └── 4. Products & services
                    └── Save & Continue → Content Strategy (/strategy)
                                └── → Campaigns (/campaigns)
                                            └── → Post Ideation (/post-ideation)
                                                        └── → Post Generation (/post-generation)
                                                                    └── → Image Generation (/image-generation)
```

---

## Key Design Decisions

- **No auth** — anonymous sessions via `localStorage` UUID scoped to Supabase rows. Zero friction onboarding.
- **localStorage + Supabase dual persistence** — audiences and products live in localStorage for instant reactivity and sync to Supabase for cross-session durability.
- **`.maybeSingle()` not `.single()`** — all load functions use `maybeSingle()` to return `null` gracefully when no row exists yet (avoids Supabase 406 errors for new sessions).
- **Analyse URL auto-triggers Peec** — after a successful URL scrape, `fetchPeecInsights` is called automatically so the user sees their AI visibility data without an extra click.
- **2000 char introduction limit** — raised from 600 to accommodate rich scraped website descriptions across all server function validators.
- **Gemini Imagen via edge function** — image generation runs server-side in a Deno edge function to keep `GEMINI_API_KEY` off the client.
- **PEEC highlighting** — post content shows deterministic 30–40% amber underline demo highlight to visualise AI-optimised phrases without requiring live PEEC data per post.
- **Prompt-based image generation** — images are generated from a text prompt built from post headline, body, brand colors, and font style — no template IDs required.
