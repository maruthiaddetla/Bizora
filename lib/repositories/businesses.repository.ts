import { mapBusinessToListing } from "@/lib/repositories/businesses.mapper";
import {
  FEATURED_PREMIUM_BUSINESS_SELECT,
  type BusinessWithRelations,
} from "@/lib/repositories/businesses.types";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { Listing } from "@/lib/listings";

export type FetchPremiumBusinessesResult =
  | { listings: Listing[]; error: null }
  | { listings: []; error: string };

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
    .select(FEATURED_PREMIUM_BUSINESS_SELECT)
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
