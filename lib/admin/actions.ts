"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth/session";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const GENERIC_ERROR =
  "We couldn't update this listing right now. Please try again shortly.";

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export type AdminReviewActionResult =
  | { ok: true; message: string }
  | { ok: false; message: string; fieldError?: string };

function isUuid(value: string): boolean {
  return UUID_PATTERN.test(value);
}

async function assertAdminClient(nextPath: string) {
  const { user, isAdmin } = await requireAdmin(nextPath);
  if (!isAdmin) {
    return {
      user: null,
      supabase: null,
      error: "Access denied." as const,
    };
  }

  const supabase = await createSupabaseServerClient();
  if (!supabase) {
    return { user: null, supabase: null, error: GENERIC_ERROR };
  }

  return { user, supabase, error: null };
}

function revalidateListingPaths(listingId: string) {
  revalidatePath("/admin");
  revalidatePath("/admin/listings");
  revalidatePath(`/admin/listings/${listingId}`);
  revalidatePath("/listings");
  revalidatePath(`/listings/${listingId}`);
  revalidatePath("/dashboard");
  revalidatePath(`/dashboard/listings/${listingId}/preview`);
  revalidatePath(`/dashboard/listings/${listingId}/edit`);
}

/**
 * Approve a pending listing (admin only). Sets status=published.
 */
export async function approveListing(
  listingId: string,
): Promise<AdminReviewActionResult> {
  if (!isUuid(listingId)) {
    return { ok: false, message: "Listing not found." };
  }

  const { user, supabase, error } = await assertAdminClient(
    `/admin/listings/${listingId}`,
  );
  if (error || !supabase || !user) {
    return { ok: false, message: error ?? GENERIC_ERROR };
  }

  const { data, error: updateError } = await supabase
    .from("businesses")
    .update({
      status: "published",
      reviewed_at: new Date().toISOString(),
      reviewed_by: user.id,
      rejection_reason: null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", listingId)
    .eq("status", "pending")
    .select("id")
    .maybeSingle();

  if (updateError) {
    if (process.env.NODE_ENV === "development") {
      console.warn("[Bizora] approveListing failed:", updateError.message);
    }
    return { ok: false, message: GENERIC_ERROR };
  }

  if (!data) {
    return {
      ok: false,
      message: "Only pending listings can be approved.",
    };
  }

  revalidateListingPaths(listingId);
  return { ok: true, message: "Listing approved and published." };
}

/**
 * Reject a pending listing (admin only). Requires a rejection reason.
 */
export async function rejectListing(
  listingId: string,
  rejectionReason: string,
): Promise<AdminReviewActionResult> {
  if (!isUuid(listingId)) {
    return { ok: false, message: "Listing not found." };
  }

  const reason = rejectionReason.trim();
  if (reason.length < 10) {
    return {
      ok: false,
      message: "Please provide a clearer rejection reason.",
      fieldError: "Rejection reason must be at least 10 characters.",
    };
  }

  const { user, supabase, error } = await assertAdminClient(
    `/admin/listings/${listingId}`,
  );
  if (error || !supabase || !user) {
    return { ok: false, message: error ?? GENERIC_ERROR };
  }

  const { data, error: updateError } = await supabase
    .from("businesses")
    .update({
      status: "rejected",
      reviewed_at: new Date().toISOString(),
      reviewed_by: user.id,
      rejection_reason: reason,
      updated_at: new Date().toISOString(),
    })
    .eq("id", listingId)
    .eq("status", "pending")
    .select("id")
    .maybeSingle();

  if (updateError) {
    if (process.env.NODE_ENV === "development") {
      console.warn("[Bizora] rejectListing failed:", updateError.message);
    }
    return { ok: false, message: GENERIC_ERROR };
  }

  if (!data) {
    return {
      ok: false,
      message: "Only pending listings can be rejected.",
    };
  }

  revalidateListingPaths(listingId);
  return { ok: true, message: "Listing rejected." };
}

/**
 * Mark a published listing as sold (admin only).
 */
export async function markListingSold(
  listingId: string,
): Promise<AdminReviewActionResult> {
  if (!isUuid(listingId)) {
    return { ok: false, message: "Listing not found." };
  }

  const { user, supabase, error } = await assertAdminClient(
    `/admin/listings/${listingId}`,
  );
  if (error || !supabase || !user) {
    return { ok: false, message: error ?? GENERIC_ERROR };
  }

  const { data, error: updateError } = await supabase
    .from("businesses")
    .update({
      status: "sold",
      reviewed_at: new Date().toISOString(),
      reviewed_by: user.id,
      updated_at: new Date().toISOString(),
    })
    .eq("id", listingId)
    .eq("status", "published")
    .select("id")
    .maybeSingle();

  if (updateError) {
    if (process.env.NODE_ENV === "development") {
      console.warn("[Bizora] markListingSold failed:", updateError.message);
    }
    return { ok: false, message: GENERIC_ERROR };
  }

  if (!data) {
    return {
      ok: false,
      message: "Only published listings can be marked as sold.",
    };
  }

  revalidateListingPaths(listingId);
  return { ok: true, message: "Listing marked as sold." };
}
