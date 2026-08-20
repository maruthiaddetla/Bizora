import {
  BUSINESS_WITH_RELATIONS_SELECT,
  type BusinessWithRelations,
} from "@/lib/repositories/businesses.types";
import { mapBusinessesToListings } from "@/lib/repositories/businesses.mapper";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { Listing } from "@/lib/listings";

const FAVORITES_FETCH_ERROR =
  "We couldn't load saved businesses right now. Please try again shortly.";

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function isUuid(value: string): boolean {
  return UUID_PATTERN.test(value);
}

export type FavoriteListingView = Listing & {
  favoritedAt: string;
};

export type FetchMyFavoritesResult =
  | {
      favorites: FavoriteListingView[];
      total: number;
      error: null;
    }
  | {
      favorites: [];
      total: 0;
      error: string;
    };

/**
 * Ownership-scoped favourite business IDs for the given user.
 */
export async function fetchFavoriteBusinessIds(
  userId: string,
): Promise<string[]> {
  if (!isUuid(userId)) return [];

  const supabase = await createSupabaseServerClient();
  if (!supabase) return [];

  const { data, error } = await supabase
    .from("favorites")
    .select("business_id")
    .eq("user_id", userId);

  if (error || !data) {
    if (error && process.env.NODE_ENV === "development") {
      console.warn("[Bizora] fetchFavoriteBusinessIds failed:", error.message);
    }
    return [];
  }

  return data.map((row) => row.business_id);
}

export async function isBusinessFavorited(
  userId: string,
  businessId: string,
): Promise<boolean> {
  if (!isUuid(userId) || !isUuid(businessId)) return false;

  const supabase = await createSupabaseServerClient();
  if (!supabase) return false;

  const { data, error } = await supabase
    .from("favorites")
    .select("id")
    .eq("user_id", userId)
    .eq("business_id", businessId)
    .maybeSingle();

  if (error) {
    if (process.env.NODE_ENV === "development") {
      console.warn("[Bizora] isBusinessFavorited failed:", error.message);
    }
    return false;
  }

  return Boolean(data);
}

/**
 * Saved businesses for the dashboard. Only published listings are returned.
 */
export async function fetchMyFavorites(
  userId: string,
  options: { page?: number; pageSize?: number } = {},
): Promise<FetchMyFavoritesResult> {
  if (!isUuid(userId)) {
    return { favorites: [], total: 0, error: FAVORITES_FETCH_ERROR };
  }

  const page = options.page != null && options.page >= 1 ? Math.floor(options.page) : 1;
  const pageSize =
    options.pageSize != null && options.pageSize >= 1
      ? Math.min(Math.floor(options.pageSize), 50)
      : 24;
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  const supabase = await createSupabaseServerClient();
  if (!supabase) {
    return { favorites: [], total: 0, error: FAVORITES_FETCH_ERROR };
  }

  const { data: favoriteRows, error: favoriteError, count } = await supabase
    .from("favorites")
    .select("business_id, created_at", { count: "exact" })
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .range(from, to);

  if (favoriteError) {
    if (process.env.NODE_ENV === "development") {
      console.warn("[Bizora] fetchMyFavorites failed:", favoriteError.message);
    }
    return { favorites: [], total: 0, error: FAVORITES_FETCH_ERROR };
  }

  const rows = favoriteRows ?? [];
  if (rows.length === 0) {
    return { favorites: [], total: count ?? 0, error: null };
  }

  const businessIds = rows.map((row) => row.business_id);
  const favoritedAtByBusinessId = new Map(
    rows.map((row) => [row.business_id, row.created_at] as const),
  );

  const { data: businessRows, error: businessError } = await supabase
    .from("businesses")
    .select(BUSINESS_WITH_RELATIONS_SELECT)
    .in("id", businessIds)
    .eq("status", "published");

  if (businessError) {
    if (process.env.NODE_ENV === "development") {
      console.warn("[Bizora] fetchMyFavorites businesses failed:", businessError.message);
    }
    return { favorites: [], total: 0, error: FAVORITES_FETCH_ERROR };
  }

  const businessesById = new Map(
    ((businessRows ?? []) as BusinessWithRelations[]).map((business) => [
      business.id,
      business,
    ]),
  );

  // Preserve favourite order; skip unpublished / missing businesses
  const orderedBusinesses: BusinessWithRelations[] = [];
  for (const id of businessIds) {
    const business = businessesById.get(id);
    if (business) orderedBusinesses.push(business);
  }

  const listings = await mapBusinessesToListings(orderedBusinesses);
  const favorites: FavoriteListingView[] = listings.map((listing) => ({
    ...listing,
    favoritedAt: favoritedAtByBusinessId.get(listing.id) ?? "",
  }));

  return {
    favorites,
    total: count ?? favorites.length,
    error: null,
  };
}

export async function createFavorite(
  userId: string,
  businessId: string,
): Promise<{ ok: true } | { ok: false; message: string; code?: string }> {
  if (!isUuid(userId) || !isUuid(businessId)) {
    return { ok: false, message: "Invalid request." };
  }

  const supabase = await createSupabaseServerClient();
  if (!supabase) {
    return {
      ok: false,
      message: "We couldn't save this business right now. Please try again shortly.",
    };
  }

  const { data: business, error: businessError } = await supabase
    .from("businesses")
    .select("id, status")
    .eq("id", businessId)
    .eq("status", "published")
    .maybeSingle();

  if (businessError) {
    return {
      ok: false,
      message: "We couldn't save this business right now. Please try again shortly.",
    };
  }

  if (!business) {
    return {
      ok: false,
      message: "Only published businesses can be saved.",
      code: "not_published",
    };
  }

  const { error } = await supabase.from("favorites").insert({
    user_id: userId,
    business_id: businessId,
  });

  if (error) {
    if (error.code === "23505") {
      return { ok: true };
    }
    if (process.env.NODE_ENV === "development") {
      console.warn("[Bizora] createFavorite failed:", error.message);
    }
    const lower = error.message.toLowerCase();
    if (lower.includes("only published")) {
      return {
        ok: false,
        message: "Only published businesses can be saved.",
        code: "not_published",
      };
    }
    return {
      ok: false,
      message: "We couldn't save this business right now. Please try again shortly.",
    };
  }

  return { ok: true };
}

export async function deleteFavorite(
  userId: string,
  businessId: string,
): Promise<{ ok: true } | { ok: false; message: string }> {
  if (!isUuid(userId) || !isUuid(businessId)) {
    return { ok: false, message: "Invalid request." };
  }

  const supabase = await createSupabaseServerClient();
  if (!supabase) {
    return {
      ok: false,
      message: "We couldn't update saved businesses right now. Please try again shortly.",
    };
  }

  const { error } = await supabase
    .from("favorites")
    .delete()
    .eq("user_id", userId)
    .eq("business_id", businessId);

  if (error) {
    if (process.env.NODE_ENV === "development") {
      console.warn("[Bizora] deleteFavorite failed:", error.message);
    }
    return {
      ok: false,
      message: "We couldn't update saved businesses right now. Please try again shortly.",
    };
  }

  return { ok: true };
}
