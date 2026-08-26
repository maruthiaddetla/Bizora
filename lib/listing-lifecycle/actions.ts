"use server";

import { revalidatePath } from "next/cache";
import { getCurrentUser } from "@/lib/auth/session";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { BusinessStatus } from "@/lib/supabase/database.types";

const GENERIC_ERROR =
  "We couldn't update this listing right now. Please try again shortly.";

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export type ListingLifecycleActionResult =
  | { ok: true; message: string }
  | { ok: false; message: string };

function isUuid(value: string): boolean {
  return UUID_PATTERN.test(value);
}

function revalidateLifecyclePaths(listingId: string) {
  revalidatePath("/dashboard");
  revalidatePath(`/dashboard/listings/${listingId}/preview`);
  revalidatePath(`/dashboard/listings/${listingId}/edit`);
  revalidatePath("/listings");
  revalidatePath(`/listings/${listingId}`);
  revalidatePath("/admin");
  revalidatePath("/admin/listings");
  revalidatePath(`/admin/listings/${listingId}`);
  revalidatePath("/");
}

async function transitionListingStatus(
  listingId: string,
  newStatus: Extract<
    BusinessStatus,
    "sold" | "leased" | "withdrawn" | "pending" | "published"
  >,
  successMessage: string,
): Promise<ListingLifecycleActionResult> {
  if (!isUuid(listingId)) {
    return { ok: false, message: "Listing not found." };
  }

  const user = await getCurrentUser();
  if (!user) {
    return { ok: false, message: "Please sign in to continue." };
  }

  const supabase = await createSupabaseServerClient();
  if (!supabase) {
    return { ok: false, message: GENERIC_ERROR };
  }

  const { error } = await supabase.rpc("transition_listing_status", {
    p_listing_id: listingId,
    p_new_status: newStatus,
  });

  if (error) {
    if (process.env.NODE_ENV === "development") {
      console.warn("[Bizora] transition_listing_status failed:", error.message);
    }
    const message = (error.message ?? "").toLowerCase();
    if (message.includes("not authorized") || message.includes("authentication")) {
      return { ok: false, message: "You do not have permission to update this listing." };
    }
    if (message.includes("only published")) {
      return { ok: false, message: "Only published listings can be closed." };
    }
    if (message.includes("only withdrawn")) {
      return { ok: false, message: "Only withdrawn listings can be republished." };
    }
    return { ok: false, message: GENERIC_ERROR };
  }

  revalidateLifecyclePaths(listingId);
  return { ok: true, message: successMessage };
}

export async function markListingSoldAction(
  listingId: string,
): Promise<ListingLifecycleActionResult> {
  return transitionListingStatus(
    listingId,
    "sold",
    "Listing marked as sold.",
  );
}

export async function markListingLeasedAction(
  listingId: string,
): Promise<ListingLifecycleActionResult> {
  return transitionListingStatus(
    listingId,
    "leased",
    "Listing marked as leased.",
  );
}

export async function withdrawListingAction(
  listingId: string,
): Promise<ListingLifecycleActionResult> {
  return transitionListingStatus(
    listingId,
    "withdrawn",
    "Listing withdrawn from public search.",
  );
}

export async function republishWithdrawnListingAction(
  listingId: string,
): Promise<ListingLifecycleActionResult> {
  return transitionListingStatus(
    listingId,
    "pending",
    "Listing submitted for review.",
  );
}
