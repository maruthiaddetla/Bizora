"use server";

import {
  BUSINESS_IMAGES_BUCKET,
  MAX_BUSINESS_IMAGES,
} from "@/lib/business-images/constants";
import { PHOTO_REGISTER_FAILED } from "@/lib/business-images/messages";
import { parseBusinessImageStoragePath } from "@/lib/business-images/storage-path";
import { resolveBusinessImageDisplayUrl } from "@/lib/business-images/resolve-url";
import type {
  BusinessImageActionResult,
  BusinessImageView,
} from "@/lib/business-images/types";
import { requireUser } from "@/lib/auth/session";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export type { BusinessImageActionResult, BusinessImageView };

const GENERIC_ERROR =
  "We couldn't update photos right now. Please try again shortly.";

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function isUuid(value: string): boolean {
  return UUID_PATTERN.test(value);
}

async function loadEditableBusiness(businessId: string, sellerId: string) {
  const supabase = await createSupabaseServerClient();
  if (!supabase) return { supabase: null, business: null, error: GENERIC_ERROR };

  const { data, error } = await supabase
    .from("businesses")
    .select("id, seller_id, status")
    .eq("id", businessId)
    .eq("seller_id", sellerId)
    .maybeSingle();

  if (error) {
    if (process.env.NODE_ENV === "development") {
      console.warn("[Bizora] loadEditableBusiness failed:", error.message);
    }
    return { supabase, business: null, error: GENERIC_ERROR };
  }

  if (!data) {
    return {
      supabase,
      business: null,
      error: "Listing not found or you do not have access.",
    };
  }

  if (data.status !== "draft" && data.status !== "rejected") {
    return {
      supabase,
      business: null,
      error: "Photos can only be changed while the listing is a draft or rejected.",
    };
  }

  return { supabase, business: data, error: null };
}

async function mapImageRow(row: {
  id: string;
  business_id: string;
  sort_order: number;
  is_primary: boolean;
  image_url: string;
  storage_path: string | null;
}): Promise<BusinessImageView | null> {
  const displayUrl = await resolveBusinessImageDisplayUrl(row);
  if (!displayUrl) return null;

  return {
    id: row.id,
    businessId: row.business_id,
    sortOrder: row.sort_order,
    isPrimary: row.is_primary,
    displayUrl,
    storagePath: row.storage_path,
  };
}

export async function listBusinessImagesForOwner(
  businessId: string,
): Promise<BusinessImageActionResult> {
  const { user } = await requireUser(`/dashboard/listings/${businessId}/edit`);
  if (!isUuid(businessId)) {
    return { ok: false, message: "Invalid listing." };
  }

  const supabase = await createSupabaseServerClient();
  if (!supabase) return { ok: false, message: GENERIC_ERROR };

  const { data: business } = await supabase
    .from("businesses")
    .select("id")
    .eq("id", businessId)
    .eq("seller_id", user.id)
    .maybeSingle();

  if (!business) {
    return { ok: false, message: "Listing not found or you do not have access." };
  }

  const { data, error } = await supabase
    .from("business_images")
    .select("id, business_id, image_url, storage_path, sort_order, is_primary")
    .eq("business_id", businessId)
    .order("is_primary", { ascending: false })
    .order("sort_order", { ascending: true });

  if (error) {
    if (process.env.NODE_ENV === "development") {
      console.warn("[Bizora] listBusinessImagesForOwner failed:", error.message);
    }
    return { ok: false, message: GENERIC_ERROR };
  }

  const images = (
    await Promise.all((data ?? []).map((row) => mapImageRow(row)))
  ).filter((image): image is BusinessImageView => Boolean(image));

  return { ok: true, images };
}

export type RegisterBusinessImageInput = {
  businessId: string;
  imageId: string;
  storagePath: string;
  mime: string;
};

/**
 * Registers a photo after the browser uploaded bytes directly to Storage.
 * Accepts only metadata — never image binary / base64.
 */
export async function registerBusinessImage(
  input: RegisterBusinessImageInput,
): Promise<BusinessImageActionResult> {
  const businessId = String(input.businessId ?? "");
  const imageId = String(input.imageId ?? "");
  const storagePath = String(input.storagePath ?? "");
  const mime = String(input.mime ?? "").toLowerCase().trim();

  const { user } = await requireUser(
    businessId
      ? `/dashboard/listings/${businessId}/edit`
      : "/dashboard/listings/new",
  );

  if (!isUuid(businessId) || !isUuid(imageId)) {
    return { ok: false, message: "Invalid listing photo." };
  }

  const parsed = parseBusinessImageStoragePath(storagePath, {
    userId: user.id,
    businessId,
    imageId,
  });

  if (!parsed) {
    return {
      ok: false,
      message: "Invalid photo storage path.",
    };
  }

  if (mime && mime !== parsed.mime) {
    return { ok: false, message: "Photo type does not match the uploaded file." };
  }

  const { supabase, business, error } = await loadEditableBusiness(
    businessId,
    user.id,
  );
  if (!supabase || !business || error) {
    return { ok: false, message: error ?? GENERIC_ERROR };
  }

  // Confirm the object exists in Storage under the caller's path (RLS-scoped).
  const { data: signed, error: signedError } = await supabase.storage
    .from(BUSINESS_IMAGES_BUCKET)
    .createSignedUrl(storagePath, 60);

  if (signedError || !signed?.signedUrl) {
    if (process.env.NODE_ENV === "development") {
      console.warn(
        "[Bizora] registerBusinessImage missing storage object:",
        signedError?.message,
      );
    }
    return { ok: false, message: PHOTO_REGISTER_FAILED };
  }

  const { count, error: countError } = await supabase
    .from("business_images")
    .select("id", { count: "exact", head: true })
    .eq("business_id", businessId);

  if (countError) {
    return { ok: false, message: GENERIC_ERROR };
  }

  if ((count ?? 0) >= MAX_BUSINESS_IMAGES) {
    await supabase.storage.from(BUSINESS_IMAGES_BUCKET).remove([storagePath]);
    return {
      ok: false,
      message: `You can upload up to ${MAX_BUSINESS_IMAGES} photos per listing.`,
    };
  }

  const isFirst = (count ?? 0) === 0;
  const nextSort = count ?? 0;

  const { data: inserted, error: insertError } = await supabase
    .from("business_images")
    .insert({
      id: imageId,
      business_id: businessId,
      image_url: storagePath,
      storage_path: storagePath,
      sort_order: nextSort,
      is_primary: isFirst,
    })
    .select("id, business_id, image_url, storage_path, sort_order, is_primary")
    .single();

  if (insertError || !inserted) {
    await supabase.storage.from(BUSINESS_IMAGES_BUCKET).remove([storagePath]);
    if (process.env.NODE_ENV === "development") {
      console.warn("[Bizora] image insert failed:", insertError?.message);
    }
    const message =
      insertError?.message?.toLowerCase().includes("maximum of 8")
        ? `You can upload up to ${MAX_BUSINESS_IMAGES} photos per listing.`
        : PHOTO_REGISTER_FAILED;
    return { ok: false, message };
  }

  const image = await mapImageRow(inserted);
  if (!image) {
    return { ok: false, message: GENERIC_ERROR };
  }

  return { ok: true, message: "Photo uploaded.", image };
}

export async function deleteBusinessImage(
  businessId: string,
  imageId: string,
): Promise<BusinessImageActionResult> {
  const { user } = await requireUser(`/dashboard/listings/${businessId}/edit`);
  if (!isUuid(businessId) || !isUuid(imageId)) {
    return { ok: false, message: "Invalid photo." };
  }

  const { supabase, business, error } = await loadEditableBusiness(
    businessId,
    user.id,
  );
  if (!supabase || !business || error) {
    return { ok: false, message: error ?? GENERIC_ERROR };
  }

  const { data: existing, error: loadError } = await supabase
    .from("business_images")
    .select("id, business_id, storage_path, is_primary, sort_order")
    .eq("id", imageId)
    .eq("business_id", businessId)
    .maybeSingle();

  if (loadError || !existing) {
    return { ok: false, message: "Photo not found." };
  }

  const { error: deleteError } = await supabase
    .from("business_images")
    .delete()
    .eq("id", imageId)
    .eq("business_id", businessId);

  if (deleteError) {
    if (process.env.NODE_ENV === "development") {
      console.warn("[Bizora] image delete failed:", deleteError.message);
    }
    return { ok: false, message: GENERIC_ERROR };
  }

  if (existing.storage_path) {
    const { error: storageError } = await supabase.storage
      .from(BUSINESS_IMAGES_BUCKET)
      .remove([existing.storage_path]);
    if (storageError && process.env.NODE_ENV === "development") {
      console.warn(
        "[Bizora] storage delete after DB delete failed:",
        storageError.message,
      );
    }
  }

  if (existing.is_primary) {
    const { data: remaining } = await supabase
      .from("business_images")
      .select("id")
      .eq("business_id", businessId)
      .order("sort_order", { ascending: true })
      .limit(1);

    const nextPrimary = remaining?.[0]?.id;
    if (nextPrimary) {
      await supabase.rpc("set_primary_business_image", {
        p_image_id: nextPrimary,
      });
    }
  }

  return { ok: true, message: "Photo removed." };
}

export async function setPrimaryBusinessImage(
  businessId: string,
  imageId: string,
): Promise<BusinessImageActionResult> {
  const { user } = await requireUser(`/dashboard/listings/${businessId}/edit`);
  if (!isUuid(businessId) || !isUuid(imageId)) {
    return { ok: false, message: "Invalid photo." };
  }

  const { supabase, business, error } = await loadEditableBusiness(
    businessId,
    user.id,
  );
  if (!supabase || !business || error) {
    return { ok: false, message: error ?? GENERIC_ERROR };
  }

  const { data: existing } = await supabase
    .from("business_images")
    .select("id")
    .eq("id", imageId)
    .eq("business_id", businessId)
    .maybeSingle();

  if (!existing) {
    return { ok: false, message: "Photo not found." };
  }

  const { error: rpcError } = await supabase.rpc("set_primary_business_image", {
    p_image_id: imageId,
  });

  if (rpcError) {
    if (process.env.NODE_ENV === "development") {
      console.warn("[Bizora] setPrimaryBusinessImage failed:", rpcError.message);
    }
    return { ok: false, message: GENERIC_ERROR };
  }

  return { ok: true, message: "Primary photo updated." };
}

export async function reorderBusinessImage(
  businessId: string,
  imageId: string,
  direction: "left" | "right",
): Promise<BusinessImageActionResult> {
  const { user } = await requireUser(`/dashboard/listings/${businessId}/edit`);
  if (!isUuid(businessId) || !isUuid(imageId)) {
    return { ok: false, message: "Invalid photo." };
  }

  const { supabase, business, error } = await loadEditableBusiness(
    businessId,
    user.id,
  );
  if (!supabase || !business || error) {
    return { ok: false, message: error ?? GENERIC_ERROR };
  }

  const { data: rows, error: listError } = await supabase
    .from("business_images")
    .select("id, sort_order")
    .eq("business_id", businessId)
    .order("sort_order", { ascending: true });

  if (listError || !rows) {
    return { ok: false, message: GENERIC_ERROR };
  }

  const index = rows.findIndex((row) => row.id === imageId);
  if (index < 0) {
    return { ok: false, message: "Photo not found." };
  }

  const swapWith = direction === "left" ? index - 1 : index + 1;
  if (swapWith < 0 || swapWith >= rows.length) {
    return { ok: true, message: "Already at the edge." };
  }

  const current = rows[index];
  const neighbor = rows[swapWith];

  const { error: firstError } = await supabase
    .from("business_images")
    .update({ sort_order: neighbor.sort_order })
    .eq("id", current.id)
    .eq("business_id", businessId);

  const { error: secondError } = await supabase
    .from("business_images")
    .update({ sort_order: current.sort_order })
    .eq("id", neighbor.id)
    .eq("business_id", businessId);

  if (firstError || secondError) {
    if (process.env.NODE_ENV === "development") {
      console.warn(
        "[Bizora] reorderBusinessImage failed:",
        firstError?.message ?? secondError?.message,
      );
    }
    return { ok: false, message: GENERIC_ERROR };
  }

  return { ok: true, message: "Photo order updated." };
}

export async function getBusinessImageSubmitState(businessId: string): Promise<{
  imageCount: number;
  hasPrimary: boolean;
  primaryCount: number;
}> {
  const supabase = await createSupabaseServerClient();
  if (!supabase || !isUuid(businessId)) {
    return { imageCount: 0, hasPrimary: false, primaryCount: 0 };
  }

  const { data } = await supabase
    .from("business_images")
    .select("id, is_primary")
    .eq("business_id", businessId);

  const rows = data ?? [];
  const primaryCount = rows.filter((row) => row.is_primary).length;

  return {
    imageCount: rows.length,
    hasPrimary: primaryCount === 1,
    primaryCount,
  };
}
