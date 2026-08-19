import {
  mapBusinessToDetail,
  mapBusinessToListing,
  mapBusinessToSellerListing,
} from "@/lib/repositories/businesses.mapper";
import {
  BUSINESS_WITH_RELATIONS_SELECT,
  type BusinessDetailView,
  type BusinessWithRelations,
  type SellerListingSummary,
  type SellerListingView,
} from "@/lib/repositories/businesses.types";
import {
  resolveSearchFilters,
  type BusinessSearchFilters,
} from "@/lib/search/params";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { Listing } from "@/lib/listings";

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const PUBLIC_FETCH_ERROR =
  "We couldn't load this listing right now. Please try again shortly.";

const SEARCH_FETCH_ERROR =
  "We couldn't load listings right now. Please try again shortly.";

export type FetchPremiumBusinessesResult =
  | { listings: Listing[]; error: null }
  | { listings: []; error: string };

export type FetchBusinessByIdResult =
  | { business: BusinessDetailView; error: null }
  | { business: null; error: null }
  | { business: null; error: string };

export type FetchBusinessesResult =
  | {
      listings: Listing[];
      total: number;
      hasMore: boolean;
      page: number;
      pageSize: number;
      error: null;
    }
  | {
      listings: [];
      total: 0;
      hasMore: false;
      page: number;
      pageSize: number;
      error: string;
    };

function isUuid(value: string): boolean {
  return UUID_PATTERN.test(value);
}

/** Escape characters that break PostgREST filter strings. */
function escapeIlikeValue(value: string): string {
  return value
    .replace(/\\/g, "\\\\")
    .replace(/%/g, "\\%")
    .replace(/_/g, "\\_")
    .replace(/,/g, " ");
}

function mostSpecificLocationFilter(filters: {
  stateId?: string;
  districtId?: string;
  cityId?: string;
  localityId?: string;
}):
  | { column: "locality_id" | "city_id" | "district_id" | "state_id"; id: string }
  | null {
  if (filters.localityId) {
    return { column: "locality_id", id: filters.localityId };
  }
  if (filters.cityId) {
    return { column: "city_id", id: filters.cityId };
  }
  if (filters.districtId) {
    return { column: "district_id", id: filters.districtId };
  }
  if (filters.stateId) {
    return { column: "state_id", id: filters.stateId };
  }
  return null;
}

/**
 * Fetches published premium businesses for the homepage
 * Premium Opportunities section.
 */
export async function fetchPremiumBusinesses(
  limit = 6,
): Promise<FetchPremiumBusinessesResult> {
  const supabase = await createSupabaseServerClient();

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
    listings: await Promise.all(
      data.map((row) => mapBusinessToListing(row as BusinessWithRelations)),
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

  const supabase = await createSupabaseServerClient();

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
    business: await mapBusinessToDetail(data as BusinessWithRelations),
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

  const supabase = await createSupabaseServerClient();
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

  return Promise.all(
    data.map((row) => mapBusinessToListing(row as BusinessWithRelations)),
  );
}

/**
 * Search/browse published businesses for the buyer listings experience.
 * Draft, pending, and sold listings are never returned.
 * Sort: "featured" (default) = is_premium DESC, created_at DESC;
 *       "newest" = created_at DESC.
 */
export async function fetchBusinesses(
  filters: BusinessSearchFilters = {},
): Promise<FetchBusinessesResult> {
  const resolved = resolveSearchFilters(filters);
  const { page, pageSize } = resolved;
  const emptyError = (error: string): FetchBusinessesResult => ({
    listings: [],
    total: 0,
    hasMore: false,
    page,
    pageSize,
    error,
  });

  const supabase = await createSupabaseServerClient();

  if (!supabase) {
    return emptyError(SEARCH_FETCH_ERROR);
  }

  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  let query = supabase
    .from("businesses")
    .select(BUSINESS_WITH_RELATIONS_SELECT, { count: "exact" })
    .eq("status", "published");

  if (resolved.q) {
    const escaped = escapeIlikeValue(resolved.q);
    query = query.or(
      `title.ilike.%${escaped}%,description.ilike.%${escaped}%`,
    );
  }

  if (resolved.categoryIds && resolved.categoryIds.length > 0) {
    const validCategoryIds = resolved.categoryIds.filter(isUuid);
    if (validCategoryIds.length > 0) {
      query = query.in("category_id", validCategoryIds);
    }
  }

  const location = mostSpecificLocationFilter(resolved);
  if (location) {
    query = query.eq(location.column, location.id);
  }

  if (resolved.minPrice != null) {
    query = query.gte("asking_price", resolved.minPrice);
  }

  if (resolved.maxPrice != null) {
    query = query.lte("asking_price", resolved.maxPrice);
  }

  if (resolved.sort === "newest") {
    query = query.order("created_at", { ascending: false });
  } else {
    query = query
      .order("is_premium", { ascending: false })
      .order("created_at", { ascending: false });
  }

  const { data, error, count } = await query.range(from, to);

  if (error) {
    if (process.env.NODE_ENV === "development") {
      console.warn("[Bizora] fetchBusinesses failed:", error.message);
    }
    return emptyError(SEARCH_FETCH_ERROR);
  }

  const total = count ?? 0;
  const listings = await Promise.all(
    (data ?? []).map((row) =>
      mapBusinessToListing(row as BusinessWithRelations),
    ),
  );

  return {
    listings,
    total,
    hasMore: from + listings.length < total,
    page,
    pageSize,
    error: null,
  };
}

const SELLER_FETCH_ERROR =
  "We couldn't load your listings right now. Please try again shortly.";

export type FetchMyBusinessesResult =
  | {
      listings: SellerListingView[];
      summary: SellerListingSummary;
      error: null;
    }
  | {
      listings: [];
      summary: SellerListingSummary;
      error: string;
    };

function emptySellerSummary(): SellerListingSummary {
  return {
    total: 0,
    draft: 0,
    pending: 0,
    published: 0,
    rejected: 0,
    sold: 0,
  };
}

function buildSellerSummary(listings: SellerListingView[]): SellerListingSummary {
  const summary = emptySellerSummary();
  summary.total = listings.length;

  for (const listing of listings) {
    if (listing.status === "draft") summary.draft += 1;
    else if (listing.status === "pending") summary.pending += 1;
    else if (listing.status === "published") summary.published += 1;
    else if (listing.status === "rejected") summary.rejected += 1;
    else if (listing.status === "sold") summary.sold += 1;
  }

  return summary;
}

/**
 * Seller dashboard listings for the authenticated owner only.
 * Ownership is enforced in the query (seller_id = sellerId) and by RLS.
 */
export async function fetchMyBusinesses(
  sellerId: string,
): Promise<FetchMyBusinessesResult> {
  const emptySummary = emptySellerSummary();

  if (!isUuid(sellerId)) {
    return {
      listings: [],
      summary: emptySummary,
      error: SELLER_FETCH_ERROR,
    };
  }

  const supabase = await createSupabaseServerClient();

  if (!supabase) {
    return {
      listings: [],
      summary: emptySummary,
      error: SELLER_FETCH_ERROR,
    };
  }

  const { data, error } = await supabase
    .from("businesses")
    .select(BUSINESS_WITH_RELATIONS_SELECT)
    .eq("seller_id", sellerId)
    .order("updated_at", { ascending: false });

  if (error) {
    if (process.env.NODE_ENV === "development") {
      console.warn("[Bizora] fetchMyBusinesses failed:", error.message);
    }
    return {
      listings: [],
      summary: emptySummary,
      error: SELLER_FETCH_ERROR,
    };
  }

  const listings = await Promise.all(
    (data ?? []).map((row) =>
      mapBusinessToSellerListing(row as BusinessWithRelations),
    ),
  );

  return {
    listings,
    summary: buildSellerSummary(listings),
    error: null,
  };
}

export type OwnedBusinessResult =
  | { business: BusinessWithRelations; error: null }
  | { business: null; error: null }
  | { business: null; error: string };

/**
 * Fetch a listing owned by sellerId (any status). RLS remains the boundary.
 */
export async function fetchOwnedBusinessById(
  businessId: string,
  sellerId: string,
): Promise<OwnedBusinessResult> {
  if (!isUuid(businessId) || !isUuid(sellerId)) {
    return { business: null, error: null };
  }

  const supabase = await createSupabaseServerClient();
  if (!supabase) {
    return { business: null, error: PUBLIC_FETCH_ERROR };
  }

  const { data, error } = await supabase
    .from("businesses")
    .select(BUSINESS_WITH_RELATIONS_SELECT)
    .eq("id", businessId)
    .eq("seller_id", sellerId)
    .maybeSingle();

  if (error) {
    if (process.env.NODE_ENV === "development") {
      console.warn("[Bizora] fetchOwnedBusinessById failed:", error.message);
    }
    return { business: null, error: PUBLIC_FETCH_ERROR };
  }

  if (!data) {
    return { business: null, error: null };
  }

  return { business: data as BusinessWithRelations, error: null };
}
