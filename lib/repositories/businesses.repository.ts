import {
  mapBusinessToDetail,
  mapBusinessToListing,
} from "@/lib/repositories/businesses.mapper";
import {
  BUSINESS_WITH_RELATIONS_SELECT,
  type BusinessDetailView,
  type BusinessWithRelations,
} from "@/lib/repositories/businesses.types";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { Listing } from "@/lib/listings";

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const PUBLIC_FETCH_ERROR =
  "We couldn't load this listing right now. Please try again shortly.";

export type FetchPremiumBusinessesResult =
  | { listings: Listing[]; error: null }
  | { listings: []; error: string };

export type FetchBusinessByIdResult =
  | { business: BusinessDetailView; error: null }
  | { business: null; error: null }
  | { business: null; error: string };

function isUuid(value: string): boolean {
  return UUID_PATTERN.test(value);
}

/**
 * Fetches published premium businesses for the homepage
 * Premium Opportunities section.
 */
export async function fetchPremiumBusinesses(
  limit = 6,
): Promise<FetchPremiumBusinessesResult> {
  const supabase = createSupabaseServerClient();

  if (!supabase) {
    return {
      listings: [],
      error:
        "Supabase is not configured. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.",
    };
  }

  const { data, error } = await supabase
    .from("businesses")
    .select(BUSINESS_WITH_RELATIONS_SELECT)
    .eq("status", "published")
    .eq("is_premium", true)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    if (process.env.NODE_ENV === "development") {
      console.warn("[Bizora] Supabase fetch failed:", error.message);
    }
    return { listings: [], error: error.message };
  }

  if (!data || data.length === 0) {
    return { listings: [], error: null };
  }

  return {
    listings: data.map((row) =>
      mapBusinessToListing(row as BusinessWithRelations),
    ),
    error: null,
  };
}

/**
 * Fetches a single published business for the public details page.
 * Unpublished (draft/pending/sold) records are treated as not found.
 */
export async function fetchBusinessById(
  id: string,
): Promise<FetchBusinessByIdResult> {
  if (!isUuid(id)) {
    return { business: null, error: null };
  }

  const supabase = createSupabaseServerClient();

  if (!supabase) {
    return { business: null, error: PUBLIC_FETCH_ERROR };
  }

  const { data, error } = await supabase
    .from("businesses")
    .select(BUSINESS_WITH_RELATIONS_SELECT)
    .eq("id", id)
    .eq("status", "published")
    .maybeSingle();

  if (error) {
    if (process.env.NODE_ENV === "development") {
      console.warn("[Bizora] fetchBusinessById failed:", error.message);
    }
    return { business: null, error: PUBLIC_FETCH_ERROR };
  }

  if (!data) {
    return { business: null, error: null };
  }

  return {
    business: mapBusinessToDetail(data as BusinessWithRelations),
    error: null,
  };
}

/**
 * Published businesses in the same category, excluding the current listing.
 */
export async function fetchSimilarBusinesses(
  businessId: string,
  categoryId: string | null,
  limit = 3,
): Promise<Listing[]> {
  if (!categoryId) return [];

  const supabase = createSupabaseServerClient();
  if (!supabase) return [];

  const { data, error } = await supabase
    .from("businesses")
    .select(BUSINESS_WITH_RELATIONS_SELECT)
    .eq("status", "published")
    .eq("category_id", categoryId)
    .neq("id", businessId)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error || !data) {
    if (error && process.env.NODE_ENV === "development") {
      console.warn("[Bizora] fetchSimilarBusinesses failed:", error.message);
    }
    return [];
  }

  return data.map((row) => mapBusinessToListing(row as BusinessWithRelations));
}
