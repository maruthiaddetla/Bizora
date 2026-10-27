"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth/session";
import { assertCanRecordContactShare } from "@/lib/listing-contacts/share-guard";
import type { EnquiryStatus } from "@/lib/supabase/database.types";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const GENERIC_ERROR =
  "We couldn't update this enquiry right now. Please try again shortly.";

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const ADMIN_ENQUIRY_STATUSES: EnquiryStatus[] = [
  "new",
  "read",
  "responded",
  "contacted",
  "qualified",
  "contact_shared",
  "closed",
];

export type AdminEnquiryActionResult =
  | { ok: true; message: string }
  | { ok: false; message: string };

function isUuid(value: string): boolean {
  return UUID_PATTERN.test(value);
}

function revalidateEnquiryPaths(enquiryId: string) {
  revalidatePath("/admin/enquiries");
  revalidatePath(`/admin/enquiries/${enquiryId}`);
}

async function assertAdminEnquiryClient(enquiryId: string) {
  const { user, isAdmin } = await requireAdmin(`/admin/enquiries/${enquiryId}`);
  if (!isAdmin || !user) {
    return { user: null, supabase: null, error: "Access denied." as const };
  }
  const supabase = await createSupabaseServerClient();
  if (!supabase) {
    return { user: null, supabase: null, error: GENERIC_ERROR };
  }
  return { user, supabase, error: null };
}

export async function updateAdminEnquiryStatus(
  enquiryId: string,
  status: EnquiryStatus,
): Promise<AdminEnquiryActionResult> {
  if (!isUuid(enquiryId) || !ADMIN_ENQUIRY_STATUSES.includes(status)) {
    return { ok: false, message: "Invalid enquiry or status." };
  }

  const { supabase, error } = await assertAdminEnquiryClient(enquiryId);
  if (error || !supabase) {
    return { ok: false, message: error ?? GENERIC_ERROR };
  }

  const { data, error: updateError } = await supabase
    .from("enquiries")
    .update({
      status,
      updated_at: new Date().toISOString(),
    })
    .eq("id", enquiryId)
    .select("id")
    .maybeSingle();

  if (updateError || !data) {
    if (process.env.NODE_ENV === "development") {
      console.warn(
        "[Bizora] updateAdminEnquiryStatus failed:",
        updateError?.message,
      );
    }
    return { ok: false, message: GENERIC_ERROR };
  }

  revalidateEnquiryPaths(enquiryId);
  return { ok: true, message: "Enquiry status updated." };
}

export async function saveAdminEnquiryNotes(
  enquiryId: string,
  notes: string,
): Promise<AdminEnquiryActionResult> {
  if (!isUuid(enquiryId)) {
    return { ok: false, message: "Enquiry not found." };
  }

  const { user, supabase, error } = await assertAdminEnquiryClient(enquiryId);
  if (error || !supabase || !user) {
    return { ok: false, message: error ?? GENERIC_ERROR };
  }

  const { error: upsertError } = await supabase
    .from("enquiry_admin_notes")
    .upsert(
      {
        enquiry_id: enquiryId,
        notes: notes.trim(),
        updated_by: user.id,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "enquiry_id" },
    );

  if (upsertError) {
    if (process.env.NODE_ENV === "development") {
      console.warn(
        "[Bizora] saveAdminEnquiryNotes failed:",
        upsertError.message,
      );
    }
    return { ok: false, message: GENERIC_ERROR };
  }

  revalidateEnquiryPaths(enquiryId);
  return { ok: true, message: "Notes saved." };
}

/**
 * Record that the listing seller contact was shared with this enquiry's buyer.
 * Blocked when sharing_authorised is false or contact is missing.
 * Never sends the number automatically — admin records the share after manual outreach.
 */
export async function recordEnquiryContactShared(
  enquiryId: string,
  note?: string,
): Promise<AdminEnquiryActionResult> {
  if (!isUuid(enquiryId)) {
    return { ok: false, message: "Enquiry not found." };
  }

  const { user, supabase, error } = await assertAdminEnquiryClient(enquiryId);
  if (error || !supabase || !user) {
    return { ok: false, message: error ?? GENERIC_ERROR };
  }

  const { data: enquiry, error: enquiryError } = await supabase
    .from("enquiries")
    .select("id, business_id, buyer_id")
    .eq("id", enquiryId)
    .maybeSingle();

  if (enquiryError || !enquiry) {
    return { ok: false, message: "Enquiry not found." };
  }

  const { data: contact, error: contactError } = await supabase
    .from("listing_seller_contacts")
    .select("business_id, mobile_e164, sharing_authorised")
    .eq("business_id", enquiry.business_id)
    .maybeSingle();

  if (contactError) {
    return { ok: false, message: GENERIC_ERROR };
  }

  const shareGuard = assertCanRecordContactShare(contact);
  if (!shareGuard.ok) {
    return shareGuard;
  }

  const { error: insertError } = await supabase
    .from("enquiry_contact_shares")
    .insert({
      enquiry_id: enquiry.id,
      business_id: enquiry.business_id,
      buyer_id: enquiry.buyer_id,
      shared_by: user.id,
      note: note?.trim() || null,
    });

  if (insertError) {
    if (process.env.NODE_ENV === "development") {
      console.warn(
        "[Bizora] recordEnquiryContactShared insert failed:",
        insertError.message,
      );
    }
    return { ok: false, message: GENERIC_ERROR };
  }

  await supabase
    .from("enquiries")
    .update({
      status: "contact_shared",
      updated_at: new Date().toISOString(),
    })
    .eq("id", enquiryId);

  revalidateEnquiryPaths(enquiryId);
  return {
    ok: true,
    message: "Contact share recorded. Status set to Contact Shared.",
  };
}
