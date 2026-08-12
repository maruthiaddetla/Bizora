import { mapBusinessToListing } from "@/lib/repositories/businesses.mapper";
import {
  FEATURED_PREMIUM_BUSINESS_SELECT,
  type BusinessWithRelations,
} from "@/lib/repositories/businesses.types";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { Listing } from "@/lib/listings";

export type FetchFeaturedPremiumResult =
  | { listing: Listing; error: null }
  | { listing: null; error: string };

/**
 * Fetches the featured premium business shown as the first card
 * on the homepage Premium Opportunities section.
 */
export async function fetchFeaturedPremiumBusiness(): Promise<FetchFeaturedPremiumResult> {
  const supabase = createSupabaseServerClient();

  if (!supabase) {
    return {
      listing: null,
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
    .limit(1)
    .maybeSingle();

  if (error) {
    if (process.env.NODE_ENV === "development") {
      console.warn("[Bizora] Supabase fetch failed:", error.message);
    }
    return { listing: null, error: error.message };
  }

  if (!data) {
    const message = "No published premium business found in Supabase.";
    if (process.env.NODE_ENV === "development") {
      console.warn("[Bizora]", message);
    }
    return { listing: null, error: message };
  }

  return {
    listing: mapBusinessToListing(data as BusinessWithRelations),
    error: null,
  };
}
