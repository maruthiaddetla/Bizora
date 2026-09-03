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
 * Approve a pending listing (admin only).
 * Edit revisions (supersedes_id set) are merged onto the published parent.
 * New listings are published on the same row.
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

  const { data: pendingRow, error: loadError } = await supabase
    .from("businesses")
    .select("id, status, supersedes_id")
    .eq("id", listingId)
    .eq("status", "pending")
    .maybeSingle();

  if (loadError) {
    if (process.env.NODE_ENV === "development") {
      console.warn("[Bizora] approveListing load failed:", loadError.message);
    }
    return { ok: false, message: GENERIC_ERROR };
  }

  if (!pendingRow) {
    return {
      ok: false,
      message: "Only pending listings can be approved.",
    };
  }

  if (pendingRow.supersedes_id) {
    const { data: merged, error: rpcError } = await supabase.rpc(
      "approve_listing_edit_revision",
      { p_revision_id: listingId },
    );

    if (rpcError || !merged) {
      if (process.env.NODE_ENV === "development") {
        console.warn(
          "[Bizora] approve_listing_edit_revision failed:",
          rpcError?.message,
        );
      }
      return { ok: false, message: GENERIC_ERROR };
    }

    const publishedId =
      typeof merged === "object" && merged && "id" in merged
        ? String((merged as { id: string }).id)
        : pendingRow.supersedes_id;

    revalidateListingPaths(listingId);
    revalidateListingPaths(publishedId);
    return {
      ok: true,
      message: "Listing edits approved. The published listing has been updated.",
    };
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
 * Close or reopen a listing via controlled RPC (admin only).
 */
async function adminTransitionListing(
  listingId: string,
  newStatus: "sold" | "leased" | "withdrawn" | "published" | "pending",
  successMessage: string,
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

  const { error: rpcError } = await supabase.rpc("transition_listing_status", {
    p_listing_id: listingId,
    p_new_status: newStatus,
  });

  if (rpcError) {
    if (process.env.NODE_ENV === "development") {
      console.warn("[Bizora] admin transition failed:", rpcError.message);
    }
    return { ok: false, message: GENERIC_ERROR };
  }

  revalidateListingPaths(listingId);
  return { ok: true, message: successMessage };
}

/**
 * Mark a listing as sold (admin).
 */
export async function markListingSold(
  listingId: string,
): Promise<AdminReviewActionResult> {
  return adminTransitionListing(listingId, "sold", "Listing marked as sold.");
}

/**
 * Mark a listing as leased (admin).
 */
export async function markListingLeased(
  listingId: string,
): Promise<AdminReviewActionResult> {
  return adminTransitionListing(
    listingId,
    "leased",
    "Listing marked as leased.",
  );
}

/**
 * Withdraw a listing from public search (admin).
 */
export async function withdrawListing(
  listingId: string,
): Promise<AdminReviewActionResult> {
  return adminTransitionListing(
    listingId,
    "withdrawn",
    "Listing withdrawn from public search.",
  );
}

/**
 * Correct a closed listing back to published (admin).
 */
export async function reopenListingPublished(
  listingId: string,
): Promise<AdminReviewActionResult> {
  return adminTransitionListing(
    listingId,
    "published",
    "Listing reopened and published.",
  );
}

/**
 * Send a closed listing back through review (admin).
 */
export async function reopenListingPending(
  listingId: string,
): Promise<AdminReviewActionResult> {
  return adminTransitionListing(
    listingId,
    "pending",
    "Listing moved to pending review.",
  );
}
