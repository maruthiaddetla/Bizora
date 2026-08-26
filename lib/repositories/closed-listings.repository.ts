import { LISTING_PLACEHOLDER_IMAGE } from "@/lib/constants/images";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { BusinessStatus, ListingType } from "@/lib/supabase/database.types";

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export type ClosedListingPublicView = {
  id: string;
  title: string;
  status: Extract<BusinessStatus, "sold" | "leased" | "withdrawn">;
  listingType: ListingType;
  category: string | null;
  location: string;
  image: string;
  closedAt: string | null;
};

export type FetchClosedListingResult =
  | { listing: ClosedListingPublicView; error: null }
  | { listing: null; error: null }
  | { listing: null; error: string };

function isUuid(value: string): boolean {
  return UUID_PATTERN.test(value);
}

function isClosedStatus(
  value: string,
): value is Extract<BusinessStatus, "sold" | "leased" | "withdrawn"> {
  return value === "sold" || value === "leased" || value === "withdrawn";
}

/**
 * Public-safe closed listing summary via SECURITY DEFINER RPC.
 * Does not expose seller contact or private fields.
 */
export async function fetchPublicClosedListing(
  listingId: string,
): Promise<FetchClosedListingResult> {
  if (!isUuid(listingId)) {
    return { listing: null, error: null };
  }

  const supabase = await createSupabaseServerClient();
  if (!supabase) {
    return {
      listing: null,
      error: "We couldn't load this listing right now. Please try again shortly.",
    };
  }

  const { data, error } = await supabase.rpc("get_public_closed_listing", {
    p_listing_id: listingId,
  });

  if (error) {
    if (process.env.NODE_ENV === "development") {
      console.warn("[Bizora] get_public_closed_listing failed:", error.message);
    }
    return {
      listing: null,
      error: "We couldn't load this listing right now. Please try again shortly.",
    };
  }

  const row = Array.isArray(data) ? data[0] : data;
  if (!row || !isClosedStatus(row.status)) {
    return { listing: null, error: null };
  }

  const listingType: ListingType =
    row.listing_type === "commercial_space" ? "commercial_space" : "business";

  return {
    listing: {
      id: row.id,
      title: row.title,
      status: row.status,
      listingType,
      category: row.category_name,
      location: row.location_label?.trim() || "India",
      image: row.primary_image_url?.trim() || LISTING_PLACEHOLDER_IMAGE,
      closedAt: row.closed_at,
    },
    error: null,
  };
}

export function isClosedListingStatus(
  status: string,
): status is Extract<BusinessStatus, "sold" | "leased" | "withdrawn"> {
  return isClosedStatus(status);
}
