import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

export type Audience = {
  id: string;
  name: string;
  roleAndIndustry: string;
  challenge: string;
};

export type Product = {
  id: string;
  name: string;
  description: string;
};

const AUDIENCES_KEY = "socialflow.audiences";
const PRODUCTS_KEY = "socialflow.products";
const SESSION_KEY = "socialflow.session_id";

// Stable anonymous session ID persisted in localStorage
export function getSessionId(): string {
  if (typeof window === "undefined") return "ssr";
  let id = window.localStorage.getItem(SESSION_KEY);
  if (!id) {
    id = crypto.randomUUID();
    window.localStorage.setItem(SESSION_KEY, id);
  }
  return id;
}

function readStorage<T>(key: string): T[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T[]) : [];
  } catch {
    return [];
  }
}

function writeStorage<T>(key: string, value: T[]) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
    window.dispatchEvent(new CustomEvent("brand-store-change", { detail: { key } }));
  } catch {
    // ignore
  }
}

function usePersistedList<T>(key: string) {
  const [items, setItems] = useState<T[]>(() => readStorage<T>(key));

  useEffect(() => {
    const sync = (e: Event) => {
      const detail = (e as CustomEvent).detail as { key?: string } | undefined;
      if (!detail || detail.key === key) {
        setItems(readStorage<T>(key));
      }
    };
    const onStorage = (e: StorageEvent) => {
      if (e.key === key) setItems(readStorage<T>(key));
    };
    window.addEventListener("brand-store-change", sync);
    window.addEventListener("storage", onStorage);
    return () => {
      window.removeEventListener("brand-store-change", sync);
      window.removeEventListener("storage", onStorage);
    };
  }, [key]);

  const update = useCallback(
    (updater: T[] | ((prev: T[]) => T[])) => {
      setItems((prev) => {
        const next = typeof updater === "function" ? (updater as (p: T[]) => T[])(prev) : updater;
        writeStorage(key, next);
        return next;
      });
    },
    [key],
  );

  return [items, update] as const;
}

export const useAudiences = () => usePersistedList<Audience>(AUDIENCES_KEY);
export const useProducts = () => usePersistedList<Product>(PRODUCTS_KEY);

// ── Supabase persistence helpers ────────────────────────────────────────────

export async function saveBrandProfile(brandName: string, introduction: string) {
  const sessionId = getSessionId();
  await supabase
    .from("brand_profiles")
    .upsert({ session_id: sessionId, brand_name: brandName, introduction }, { onConflict: "session_id" });
}

export async function loadBrandProfile(): Promise<{ brandName: string; introduction: string } | null> {
  const sessionId = getSessionId();
  const { data } = await supabase
    .from("brand_profiles")
    .select("brand_name, introduction")
    .eq("session_id", sessionId)
    .single();
  if (!data) return null;
  return { brandName: data.brand_name, introduction: data.introduction };
}

export async function saveAudiencesToDB(audiences: Audience[]) {
  const sessionId = getSessionId();
  await supabase.from("audiences").delete().eq("session_id", sessionId);
  if (audiences.length === 0) return;
  await supabase.from("audiences").insert(
    audiences.map((a) => ({
      id: a.id,
      session_id: sessionId,
      name: a.name,
      role_and_industry: a.roleAndIndustry,
      challenge: a.challenge,
    })),
  );
}

export async function loadAudiencesFromDB(): Promise<Audience[]> {
  const sessionId = getSessionId();
  const { data } = await supabase
    .from("audiences")
    .select("id, name, role_and_industry, challenge")
    .eq("session_id", sessionId)
    .order("created_at");
  if (!data) return [];
  return data.map((r) => ({
    id: r.id,
    name: r.name,
    roleAndIndustry: r.role_and_industry,
    challenge: r.challenge,
  }));
}

export async function saveProductsToDB(products: Product[]) {
  const sessionId = getSessionId();
  await supabase.from("products").delete().eq("session_id", sessionId);
  if (products.length === 0) return;
  await supabase.from("products").insert(
    products.map((p) => ({
      id: p.id,
      session_id: sessionId,
      name: p.name,
      description: p.description,
    })),
  );
}

export async function loadProductsFromDB(): Promise<Product[]> {
  const sessionId = getSessionId();
  const { data } = await supabase
    .from("products")
    .select("id, name, description")
    .eq("session_id", sessionId)
    .order("created_at");
  if (!data) return [];
  return data.map((r) => ({ id: r.id, name: r.name, description: r.description }));
}

export type CampaignData = {
  id?: string;
  name: string;
  contentPillars: string[];
  startDate: string;
  endDate: string;
  location: string;
  selectedAudienceIds: string[];
  selectedProductIds: string[];
  selectedPlatforms: string[];
  aiEvents: object[];
};

export async function saveCampaignToDB(campaign: CampaignData): Promise<string | null> {
  const sessionId = getSessionId();
  const row = {
    session_id: sessionId,
    name: campaign.name,
    content_pillars: campaign.contentPillars,
    start_date: campaign.startDate || null,
    end_date: campaign.endDate || null,
    location: campaign.location,
    selected_audience_ids: campaign.selectedAudienceIds,
    selected_product_ids: campaign.selectedProductIds,
    selected_platforms: campaign.selectedPlatforms,
    ai_events: campaign.aiEvents,
  };
  if (campaign.id) {
    await supabase.from("campaigns").update(row).eq("id", campaign.id);
    return campaign.id;
  } else {
    const { data } = await supabase.from("campaigns").insert(row).select("id").single();
    return data?.id ?? null;
  }
}

export async function loadLatestCampaignFromDB(): Promise<CampaignData | null> {
  const sessionId = getSessionId();
  const { data } = await supabase
    .from("campaigns")
    .select("*")
    .eq("session_id", sessionId)
    .order("updated_at", { ascending: false })
    .limit(1)
    .single();
  if (!data) return null;
  return {
    id: data.id,
    name: data.name,
    contentPillars: data.content_pillars ?? [],
    startDate: data.start_date ?? "",
    endDate: data.end_date ?? "",
    location: data.location ?? "",
    selectedAudienceIds: data.selected_audience_ids ?? [],
    selectedProductIds: data.selected_product_ids ?? [],
    selectedPlatforms: data.selected_platforms ?? [],
    aiEvents: data.ai_events ?? [],
  };
}

// ── Post Ideation persistence ────────────────────────────────────────────────

export type PostIdeationState = {
  peecData: unknown | null;
  selectedPeecSignals: { prompts: number[]; chatGaps: number[]; ugcBrief: number[] };
  ideas: unknown[];
  savedIdeas: unknown[];
  numberOfPosts: number;
};

export async function savePostIdeationState(state: PostIdeationState) {
  const sessionId = getSessionId();
  await supabase.from("post_ideation_state").upsert(
    {
      session_id: sessionId,
      peec_data: state.peecData,
      selected_peec_signals: state.selectedPeecSignals,
      ideas: state.ideas,
      saved_ideas: state.savedIdeas,
      number_of_posts: state.numberOfPosts,
    },
    { onConflict: "session_id" },
  );
}

export async function loadPostIdeationState(): Promise<PostIdeationState | null> {
  const sessionId = getSessionId();
  const { data } = await supabase
    .from("post_ideation_state")
    .select("*")
    .eq("session_id", sessionId)
    .single();
  if (!data) return null;
  return {
    peecData: data.peec_data ?? null,
    selectedPeecSignals: data.selected_peec_signals ?? { prompts: [], chatGaps: [], ugcBrief: [] },
    ideas: data.ideas ?? [],
    savedIdeas: data.saved_ideas ?? [],
    numberOfPosts: data.number_of_posts ?? 6,
  };
}

export type StrategySettings = {
  presetId: string;
  customMix: Record<string, number> | null;
  productMention: number;
};

export async function saveStrategyToDB(settings: StrategySettings) {
  const sessionId = getSessionId();
  await supabase.from("content_strategy").upsert(
    {
      session_id: sessionId,
      preset_id: settings.presetId,
      custom_mix: settings.customMix,
      product_mention: settings.productMention,
    },
    { onConflict: "session_id" },
  );
}

export async function loadStrategyFromDB(): Promise<StrategySettings | null> {
  const sessionId = getSessionId();
  const { data } = await supabase
    .from("content_strategy")
    .select("preset_id, custom_mix, product_mention")
    .eq("session_id", sessionId)
    .single();
  if (!data) return null;
  return {
    presetId: data.preset_id,
    customMix: data.custom_mix as Record<string, number> | null,
    productMention: data.product_mention,
  };
}
