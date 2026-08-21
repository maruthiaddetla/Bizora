import {
  BUSINESS_WITH_RELATIONS_SELECT,
  type BusinessWithRelations,
} from "@/lib/repositories/businesses.types";
import { mapBusinessesToListings } from "@/lib/repositories/businesses.mapper";
import { resolveProfileAvatarUrl } from "@/lib/profile/resolve-avatar";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { Listing } from "@/lib/listings";
import type { ProfileRow } from "@/lib/supabase/database.types";

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const PROFILE_FETCH_ERROR =
  "We couldn't load this profile right now. Please try again shortly.";

function isUuid(value: string): boolean {
  return UUID_PATTERN.test(value);
}

export type SellerProfileView = {
  id: string;
  displayName: string;
  companyName: string | null;
  bio: string | null;
  avatarUrl: string | null;
  website: string | null;
  city: string | null;
  memberSince: string;
  listingCount: number;
  listings: Listing[];
};

export type MyProfileView = {
  id: string;
  role: ProfileRow["role"];
  fullName: string | null;
  displayName: string | null;
  companyName: string | null;
  bio: string | null;
  avatarUrl: string | null;
  avatarStoragePath: string | null;
  website: string | null;
  city: string | null;
  phone: string | null;
  createdAt: string;
  updatedAt: string;
};

export type SellerProfileUpdateInput = {
  displayName: string | null;
  companyName: string | null;
  bio: string | null;
  city: string | null;
  website: string | null;
};

const MY_PROFILE_SELECT =
  "id, role, full_name, phone, company_name, display_name, bio, avatar_storage_path, website, city, created_at, updated_at";

/**
 * Public seller profile + published listings only.
 * Uses public_seller_profiles view (no email/phone/role).
 */
export async function fetchPublicSellerProfile(
  profileId: string,
): Promise<
  | { profile: SellerProfileView; error: null }
  | { profile: null; error: null }
  | { profile: null; error: string }
> {
  if (!isUuid(profileId)) {
    return { profile: null, error: null };
  }

  const supabase = await createSupabaseServerClient();
  if (!supabase) {
    return { profile: null, error: PROFILE_FETCH_ERROR };
  }

  const { data: row, error } = await supabase
    .from("public_seller_profiles")
    .select(
      "id, display_name, company_name, bio, avatar_storage_path, website, city, member_since",
    )
    .eq("id", profileId)
    .maybeSingle();

  if (error) {
    if (process.env.NODE_ENV === "development") {
      console.warn("[Bizora] fetchPublicSellerProfile failed:", error.message);
    }
    return { profile: null, error: PROFILE_FETCH_ERROR };
  }

  if (!row) {
    return { profile: null, error: null };
  }

  const { data: businessRows, error: businessError } = await supabase
    .from("businesses")
    .select(BUSINESS_WITH_RELATIONS_SELECT)
    .eq("seller_id", profileId)
    .eq("status", "published")
    .order("created_at", { ascending: false });

  if (businessError) {
    if (process.env.NODE_ENV === "development") {
      console.warn(
        "[Bizora] fetchPublicSellerProfile listings failed:",
        businessError.message,
      );
    }
    return { profile: null, error: PROFILE_FETCH_ERROR };
  }

  const listings = await mapBusinessesToListings(
    (businessRows ?? []) as BusinessWithRelations[],
  );
  const avatarUrl = await resolveProfileAvatarUrl(row.avatar_storage_path);

  return {
    profile: {
      id: row.id,
      displayName: row.display_name,
      companyName: row.company_name,
      bio: row.bio,
      avatarUrl,
      website: row.website,
      city: row.city,
      memberSince: row.member_since,
      listingCount: listings.length,
      listings,
    },
    error: null,
  };
}

/**
 * Lightweight public seller summary for listing detail (published count only).
 */
export async function fetchPublicSellerSummary(profileId: string): Promise<{
  id: string;
  displayName: string;
  companyName: string | null;
  avatarUrl: string | null;
  listingCount: number;
} | null> {
  if (!isUuid(profileId)) return null;

  const supabase = await createSupabaseServerClient();
  if (!supabase) return null;

  const { data: row, error } = await supabase
    .from("public_seller_profiles")
    .select("id, display_name, company_name, avatar_storage_path")
    .eq("id", profileId)
    .maybeSingle();

  if (error || !row) return null;

  const { count, error: countError } = await supabase
    .from("businesses")
    .select("id", { count: "exact", head: true })
    .eq("seller_id", profileId)
    .eq("status", "published");

  if (countError) return null;

  const avatarUrl = await resolveProfileAvatarUrl(row.avatar_storage_path);

  return {
    id: row.id,
    displayName: row.display_name,
    companyName: row.company_name,
    avatarUrl,
    listingCount: count ?? 0,
  };
}

export async function fetchMyProfile(
  userId: string,
): Promise<
  | { profile: MyProfileView; error: null }
  | { profile: null; error: string }
> {
  if (!isUuid(userId)) {
    return { profile: null, error: PROFILE_FETCH_ERROR };
  }

  const supabase = await createSupabaseServerClient();
  if (!supabase) {
    return { profile: null, error: PROFILE_FETCH_ERROR };
  }

  const { data, error } = await supabase
    .from("profiles")
    .select(MY_PROFILE_SELECT)
    .eq("id", userId)
    .maybeSingle();

  if (error || !data) {
    if (error && process.env.NODE_ENV === "development") {
      console.warn("[Bizora] fetchMyProfile failed:", error.message);
    }
    return { profile: null, error: PROFILE_FETCH_ERROR };
  }

  const avatarUrl = await resolveProfileAvatarUrl(data.avatar_storage_path);

  return {
    profile: {
      id: data.id,
      role: data.role,
      fullName: data.full_name,
      displayName: data.display_name,
      companyName: data.company_name,
      bio: data.bio,
      avatarUrl,
      avatarStoragePath: data.avatar_storage_path,
      website: data.website,
      city: data.city,
      phone: data.phone,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    },
    error: null,
  };
}

export async function updateMySellerProfile(
  userId: string,
  profileData: SellerProfileUpdateInput,
): Promise<{ ok: true } | { ok: false; message: string }> {
  if (!isUuid(userId)) {
    return { ok: false, message: "Invalid request." };
  }

  const supabase = await createSupabaseServerClient();
  if (!supabase) {
    return {
      ok: false,
      message: "Profile updates are temporarily unavailable. Please try again.",
    };
  }

  const { data, error } = await supabase
    .from("profiles")
    .update({
      display_name: profileData.displayName,
      company_name: profileData.companyName,
      bio: profileData.bio,
      city: profileData.city,
      website: profileData.website,
    })
    .eq("id", userId)
    .select("id")
    .maybeSingle();

  if (error) {
    if (process.env.NODE_ENV === "development") {
      console.warn("[Bizora] updateMySellerProfile failed:", error.message);
    }
    return {
      ok: false,
      message: "We couldn't save your profile. Please try again.",
    };
  }

  if (!data) {
    return { ok: false, message: "Profile not found." };
  }

  return { ok: true };
}

export async function updateMyAvatarPath(
  userId: string,
  storagePath: string | null,
): Promise<{ ok: true } | { ok: false; message: string }> {
  if (!isUuid(userId)) {
    return { ok: false, message: "Invalid request." };
  }

  const supabase = await createSupabaseServerClient();
  if (!supabase) {
    return {
      ok: false,
      message: "Avatar updates are temporarily unavailable. Please try again.",
    };
  }

  const { data, error } = await supabase
    .from("profiles")
    .update({ avatar_storage_path: storagePath })
    .eq("id", userId)
    .select("id")
    .maybeSingle();

  if (error || !data) {
    return {
      ok: false,
      message: "We couldn't update your avatar. Please try again.",
    };
  }

  return { ok: true };
}
