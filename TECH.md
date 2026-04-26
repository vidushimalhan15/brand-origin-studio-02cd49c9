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
| `/` | `routes/index.tsx` | `LandingPage` — public homepage |
| `/brand-setup` | `routes/brand-setup.tsx` | `BrandSetupPage` — brand identity, audiences, products |
| `/strategy` | `routes/strategy.tsx` | Content strategy builder — content mix & pillars |
| `/campaigns` | `routes/campaigns.tsx` | Campaign wizard — dates, platforms, AI events |
| `/post-ideation` | `routes/post-ideation.tsx` | `PostIdeation` — generate and save post ideas |
| `/post-generation` | `routes/post-generation.tsx` | `PostGeneration` — generate full post copy and carousels |
| `/image-generation` | `routes/image-generation.tsx` | `ImageGeneration` — Nano Banana Pro AI image generator |

---

## Pages

| File | Used By | Description |
|---|---|---|
| `pages/LandingPage.tsx` | `/` route | Public marketing page with animated LLM cycling hero |
| `pages/BrandSetupPage.tsx` | `/brand-setup` route | Brand profile form + AudienceProfiles + ProductsSection |
| `pages/NotFound.tsx` | Root `notFoundComponent` | 404 fallback |

---

## Key Components

### Layout
- **`AppLayout.tsx`** — Sidebar with nav links (Dashboard, Brand Setup, Content Strategy, Campaigns, Post Ideation, Post Generation, Nano Banana Pro). Wraps all app pages.

### Feature Components
- **`AudienceProfiles.tsx`** — Add/edit/delete target audiences. Has AI suggest via `suggestAudiences` server fn. Props: `brandName`, `introduction`.
- **`PostIdeation.tsx`** — Runs PEEC analysis, selects signals, generates post ideas via `generatePostIdeas`. Saves ideas to Supabase.
- **`PostGeneration.tsx`** — Generates full post content per idea via `generatePostContent`. Shows carousel slides, PEEC amber-highlight demo, per-post checkboxes, export brief, and "Generate Images" CTA. Persists to Supabase `generated_posts`.
- **`ImageGeneration.tsx`** — Loads approved posts from localStorage, lets user set brand style (colors, font, logo), and generates images per post/slide via Gemini Imagen 3.

---

## Server Functions (`src/server/brand.functions.ts`)

All functions use `createServerFn({ method: "POST" })` with Zod input validation.

| Function | What it does |
|---|---|
| `analyzeBrandUrl` | Scrapes a URL via Apify and extracts brand name + intro using GPT-4.1-mini |
| `suggestAudiences` | Generates 3 target audience profiles (name, role, challenge) using GPT-4.1-mini |
| `fetchPeecInsights` | Calls Peec AI API — returns AI visibility score, sentiment, competitor gaps, content prompts, chat gaps, UGC brief |
| `fetchLocationEvents` | Fetches local holidays/events for a date range using GPT-4.1-mini |
| `autoAnalyzePillars` | Generates 4 content pillar topics from brand name + intro |
| `draftProductDescription` | Writes a product description using GPT-4.1-mini |
| `searchTavily` | Searches Tavily for trending articles across content pillars |
| `searchTavilyByPillar` | Calls Supabase edge function to search Tavily per individual pillar |
| `generatePostContent` | Calls Supabase edge function — generates post copy, carousel slides, hashtags, content format via Gemini |
| `generatePostIdeas` | Calls Supabase edge function — generates 6–30 post ideas for given platforms/pillars via Gemini |
| `generateImageBannerbear` | Calls Supabase edge function — generates an image via Gemini Imagen 3 from a text prompt |

---

## Supabase Edge Functions

### `generate-image-bannerbear`
- **Trigger:** Called by `generateImageBannerbear` server function
- **Input:** `{ prompt: string, aspectRatio?: string }`
- **Action:** Calls `generativelanguage.googleapis.com/v1beta/models/imagen-3.0-generate-002:predict` using `GEMINI_API_KEY`
- **Output:** `{ success: true, imageUrl: "data:image/png;base64,..." }`

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
```

---

## Environment Variables

### Server-side (`process.env`)
| Variable | Used For |
|---|---|
| `OPENAI_API_KEY` | GPT-4.1-mini — audience suggestions, pillar analysis, events, product copy |
| `SUPABASE_URL` / `VITE_SUPABASE_URL` | Supabase project URL |
| `SUPABASE_PUBLISHABLE_KEY` / `VITE_SUPABASE_PUBLISHABLE_KEY` | Supabase anon key |
| `TAVILY_API_KEY` | Trend search |

### Supabase Edge Function (`Deno.env.get`)
| Variable | Used For |
|---|---|
| `GEMINI_API_KEY` | Gemini Imagen 3 image generation |
| `OPENAI_API_KEY` | Post/idea generation (Gemini edge fn fallback) |
| `PEEC_API` | Peec AI visibility insights |
| `TAVILY_API_KEY` | Tavily trend search (edge fn) |
| `APIFY_API_KEY` | Website scraping for brand URL analysis |

---

## User Flow

```
Landing Page (/)
    └── Get started → Brand Setup (/brand-setup)
            ├── Brand name + description
            ├── Audience profiles (manual or AI suggest)
            └── Products & services
                    └── → Content Strategy (/strategy)
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
- **Gemini Imagen via edge function** — image generation runs server-side in a Deno edge function to keep `GEMINI_API_KEY` off the client.
- **PEEC highlighting** — post content shows deterministic 30–40% amber underline demo highlight to visualise AI-optimised phrases without requiring live PEEC data per post.
