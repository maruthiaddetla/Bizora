"use server";

import { generateUniqueSlug } from "@/lib/listing-creation/slug";
import {
  buildRevisionImageClones,
  revisionNeedsImageBackfill,
} from "@/lib/listing-creation/revision-images";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { BusinessRow } from "@/lib/supabase/database.types";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/database.types";

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function isUuid(value: string): boolean {
  return UUID_PATTERN.test(value);
}

export type EnsureRevisionResult =
  | { ok: true; revisionId: string; created: boolean }
  | { ok: false; message: string };

type BizoraClient = SupabaseClient<Database>;

async function slugTaken(
  candidate: string,
  excludeId?: string,
): Promise<boolean> {
  const supabase = await createSupabaseServerClient();
  if (!supabase) return true;

  let query = supabase
    .from("businesses")
    .select("id")
    .eq("slug", candidate)
    .limit(1);

  if (excludeId) {
    query = query.neq("id", excludeId);
  }

  const { data, error } = await query;
  if (error) return true;
  return (data?.length ?? 0) > 0;
}

async function fetchListingImages(
  supabase: BizoraClient,
  businessId: string,
) {
  const { data, error } = await supabase
    .from("business_images")
    .select("image_url, storage_path, sort_order, is_primary")
    .eq("business_id", businessId)
    .order("sort_order", { ascending: true });

  if (error) {
    return { images: null as null, error };
  }

  return { images: data ?? [], error: null };
}

/**
 * Copy published images onto a revision. Published rows are never modified.
 * Returns false when the clone insert fails.
 */
async function cloneImagesOntoRevision(
  supabase: BizoraClient,
  revisionId: string,
  publishedId: string,
): Promise<{ ok: true; cloned: number } | { ok: false; message: string }> {
  const { images, error } = await fetchListingImages(supabase, publishedId);
  if (error || !images) {
    if (process.env.NODE_ENV === "development") {
      console.warn(
        "[Bizora] fetch published images for revision failed:",
        error?.message,
      );
    }
    return {
      ok: false,
      message: "We couldn't copy listing photos into the edit. Please try again.",
    };
  }

  if (images.length === 0) {
    return { ok: true, cloned: 0 };
  }

  const payload = buildRevisionImageClones(revisionId, images);
  const { error: imageError } = await supabase
    .from("business_images")
    .insert(payload);

  if (imageError) {
    if (process.env.NODE_ENV === "development") {
      console.warn(
        "[Bizora] revision image clone failed:",
        imageError.message,
        imageError.code,
        imageError.details,
      );
    }
    return {
      ok: false,
      message: "We couldn't copy listing photos into the edit. Please try again.",
    };
  }

  return { ok: true, cloned: payload.length };
}

/**
 * If an existing revision has no photos but the published listing does,
 * backfill once so Edit never opens empty.
 */
async function backfillRevisionImagesIfNeeded(
  supabase: BizoraClient,
  revisionId: string,
  publishedId: string,
): Promise<{ ok: true } | { ok: false; message: string }> {
  const [revisionImages, publishedImages] = await Promise.all([
    fetchListingImages(supabase, revisionId),
    fetchListingImages(supabase, publishedId),
  ]);

  if (revisionImages.error || publishedImages.error) {
    return {
      ok: false,
      message: "We couldn't load listing photos for editing. Please try again.",
    };
  }

  if (
    !revisionNeedsImageBackfill({
      revisionImageCount: revisionImages.images?.length ?? 0,
      publishedImageCount: publishedImages.images?.length ?? 0,
    })
  ) {
    return { ok: true };
  }

  const cloned = await cloneImagesOntoRevision(
    supabase,
    revisionId,
    publishedId,
  );
  if (!cloned.ok) return cloned;
  return { ok: true };
}

/**
 * Find or create a draft/pending/rejected revision for a published listing.
 * Ownership must already be verified by the caller (seller_id = userId).
 */
export async function ensurePublishedEditRevision(
  publishedId: string,
  userId: string,
): Promise<EnsureRevisionResult> {
  if (!isUuid(publishedId) || !isUuid(userId)) {
    return { ok: false, message: "Listing not found or you do not have access." };
  }

  const supabase = await createSupabaseServerClient();
  if (!supabase) {
    return {
      ok: false,
      message: "We couldn't start editing this listing right now. Please try again.",
    };
  }

  const { data: published, error: loadError } = await supabase
    .from("businesses")
    .select("*")
    .eq("id", publishedId)
    .eq("seller_id", userId)
    .maybeSingle();

  if (loadError || !published) {
    return { ok: false, message: "Listing not found or you do not have access." };
  }

  if (published.status !== "published") {
    return {
      ok: false,
      message: "Only published listings use an edit revision.",
    };
  }

  const { data: existingRevision } = await supabase
    .from("businesses")
    .select("id, status")
    .eq("supersedes_id", publishedId)
    .eq("seller_id", userId)
    .in("status", ["draft", "pending", "rejected"])
    .maybeSingle();

  if (existingRevision) {
    const backfill = await backfillRevisionImagesIfNeeded(
      supabase,
      existingRevision.id,
      publishedId,
    );
    if (!backfill.ok) {
      return { ok: false, message: backfill.message };
    }
    return { ok: true, revisionId: existingRevision.id, created: false };
  }

  const row = published as BusinessRow;
  const slug = await generateUniqueSlug(`${row.title}-edit`, (candidate) =>
    slugTaken(candidate),
  );

  const { data: revision, error: insertError } = await supabase
    .from("businesses")
    .insert({
      seller_id: userId,
      title: row.title,
      slug,
      description: row.description,
      asking_price: row.asking_price,
      annual_revenue: row.annual_revenue,
      annual_profit: row.annual_profit,
      ebitda: row.ebitda,
      established_year: row.established_year,
      employees: row.employees,
      category_id: row.category_id,
      state_id: row.state_id,
      district_id: row.district_id,
      city_id: row.city_id,
      locality_id: row.locality_id,
      locality_name: row.locality_name,
      reason_for_sale: row.reason_for_sale,
      status: "draft",
      listing_type: row.listing_type,
      space_type: row.space_type,
      listing_purpose: row.listing_purpose,
      monthly_rent: row.monthly_rent,
      security_deposit: row.security_deposit,
      area_sqft: row.area_sqft,
      floor: row.floor,
      parking_spaces: row.parking_spaces,
      furnished: row.furnished,
      lease_term_months: row.lease_term_months,
      available_from: row.available_from,
      business_usage: row.business_usage,
      is_premium: false,
      is_verified: false,
      supersedes_id: publishedId,
    })
    .select("id")
    .single();

  if (insertError || !revision) {
    if (process.env.NODE_ENV === "development") {
      console.warn(
        "[Bizora] ensurePublishedEditRevision insert failed:",
        insertError?.message,
      );
    }
    return {
      ok: false,
      message: "We couldn't start editing this listing right now. Please try again.",
    };
  }

  const cloned = await cloneImagesOntoRevision(
    supabase,
    revision.id,
    publishedId,
  );

  if (!cloned.ok) {
    // Roll back empty revision so the seller can retry cleanly.
    await supabase.from("businesses").delete().eq("id", revision.id);
    return { ok: false, message: cloned.message };
  }

  return { ok: true, revisionId: revision.id, created: true };
}

/**
 * When Edit opens a revision row directly (dashboard may link to revisionId),
 * backfill images from the published parent if the revision has none.
 * Safe to call on every revision edit page load.
 */
export async function ensureRevisionImagesForEdit(
  revisionId: string,
  userId: string,
): Promise<{ ok: true; publishedId: string; imageCount: number } | { ok: false; message: string }> {
  if (!isUuid(revisionId) || !isUuid(userId)) {
    return { ok: false, message: "Listing not found or you do not have access." };
  }

  const supabase = await createSupabaseServerClient();
  if (!supabase) {
    return {
      ok: false,
      message: "We couldn't load listing photos for editing. Please try again.",
    };
  }

  const { data: revision, error } = await supabase
    .from("businesses")
    .select("id, seller_id, status, supersedes_id")
    .eq("id", revisionId)
    .eq("seller_id", userId)
    .maybeSingle();

  if (error || !revision) {
    return { ok: false, message: "Listing not found or you do not have access." };
  }

  if (!revision.supersedes_id) {
    const { images, error: imgError } = await fetchListingImages(
      supabase,
      revisionId,
    );
    if (imgError) {
      return {
        ok: false,
        message: "We couldn't load listing photos for editing. Please try again.",
      };
    }
    return {
      ok: true,
      publishedId: revisionId,
      imageCount: images?.length ?? 0,
    };
  }

  const backfill = await backfillRevisionImagesIfNeeded(
    supabase,
    revision.id,
    revision.supersedes_id,
  );
  if (!backfill.ok) {
    return { ok: false, message: backfill.message };
  }

  const { images, error: afterError } = await fetchListingImages(
    supabase,
    revision.id,
  );
  if (afterError) {
    return {
      ok: false,
      message: "We couldn't load listing photos for editing. Please try again.",
    };
  }

  const imageCount = images?.length ?? 0;
  console.info("[Bizora] edit revision images ready:", {
    publishedId: revision.supersedes_id,
    revisionId: revision.id,
    imageCount,
    storagePaths: (images ?? []).map((row) => row.storage_path),
  });

  return {
    ok: true,
    publishedId: revision.supersedes_id,
    imageCount,
  };
}
