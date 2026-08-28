"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth/session";
import {
  fetchEnquiryByIdForParticipant,
  fetchPublishedBusinessForEnquiry,
  hasRecentEnquiry,
} from "@/lib/repositories/enquiries.repository";
import { scheduleSellerEnquiryEmail } from "@/lib/notifications/enquiry-email-delivery";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const GENERIC_ERROR =
  "We couldn't send your enquiry right now. Please try again shortly.";

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export type EnquiryActionResult =
  | { ok: true; message: string }
  | { ok: false; message: string; fieldError?: string };

function isUuid(value: string): boolean {
  return UUID_PATTERN.test(value);
}

function mapDbError(message: string | undefined): string {
  const text = (message ?? "").toLowerCase();
  if (text.includes("own listing")) {
    return "You cannot send an enquiry on your own listing.";
  }
  if (text.includes("no seller")) {
    return "Seller contact is currently unavailable.";
  }
  if (text.includes("published")) {
    return "This listing is not accepting enquiries.";
  }
  if (text.includes("closed")) {
    return "This enquiry is closed.";
  }
  return GENERIC_ERROR;
}

export async function createEnquiry(
  businessId: string,
  message: string,
): Promise<EnquiryActionResult> {
  const { user } = await requireUser(`/listings/${businessId}`);

  if (!isUuid(businessId)) {
    return { ok: false, message: "Invalid listing." };
  }

  const trimmed = message.trim();
  if (trimmed.length < 10) {
    return {
      ok: false,
      message: "Please enter a message of at least 10 characters.",
      fieldError: "Message must be at least 10 characters.",
    };
  }
  if (trimmed.length > 2000) {
    return {
      ok: false,
      message: "Message must be 2000 characters or fewer.",
      fieldError: "Message is too long.",
    };
  }

  const { business, error: loadError } =
    await fetchPublishedBusinessForEnquiry(businessId);
  if (loadError) {
    return { ok: false, message: loadError };
  }
  if (!business) {
    return { ok: false, message: "This listing is not accepting enquiries." };
  }
  if (!business.seller_id) {
    return {
      ok: false,
      message: "Seller contact is currently unavailable.",
    };
  }
  if (business.seller_id === user.id) {
    return {
      ok: false,
      message: "You cannot send an enquiry on your own listing.",
    };
  }

  if (await hasRecentEnquiry(user.id, businessId)) {
    return {
      ok: false,
      message: "Please wait a moment before sending another enquiry.",
    };
  }

  const supabase = await createSupabaseServerClient();
  if (!supabase) {
    return { ok: false, message: GENERIC_ERROR };
  }

  const { data: inserted, error } = await supabase
    .from("enquiries")
    .insert({
      business_id: businessId,
      buyer_id: user.id,
      message: trimmed,
    })
    .select("id")
    .single();

  if (error || !inserted?.id) {
    if (process.env.NODE_ENV === "development") {
      console.warn("[Bizora] createEnquiry failed:", error?.message);
    }
    return { ok: false, message: mapDbError(error?.message) };
  }

  scheduleSellerEnquiryEmail(inserted.id);

  revalidatePath("/dashboard/enquiries");
  revalidatePath(`/listings/${businessId}`);

  return {
    ok: true,
    message: "Your enquiry has been sent to the seller.",
  };
}

export async function markEnquiryRead(
  enquiryId: string,
): Promise<EnquiryActionResult> {
  const { user } = await requireUser(`/dashboard/enquiries/${enquiryId}`);
  if (!isUuid(enquiryId)) {
    return { ok: false, message: "Enquiry not found." };
  }

  const supabase = await createSupabaseServerClient();
  if (!supabase) {
    return { ok: false, message: GENERIC_ERROR };
  }

  const { data, error } = await supabase
    .from("enquiries")
    .update({ status: "read" })
    .eq("id", enquiryId)
    .eq("seller_id", user.id)
    .eq("status", "new")
    .select("id")
    .maybeSingle();

  if (error) {
    if (process.env.NODE_ENV === "development") {
      console.warn("[Bizora] markEnquiryRead failed:", error.message);
    }
    return { ok: false, message: GENERIC_ERROR };
  }

  if (data) {
    revalidatePath("/dashboard/enquiries");
    revalidatePath(`/dashboard/enquiries/${enquiryId}`);
  }

  return { ok: true, message: "Marked as read." };
}

export async function respondToEnquiry(
  enquiryId: string,
  sellerResponse: string,
): Promise<EnquiryActionResult> {
  const { user } = await requireUser(`/dashboard/enquiries/${enquiryId}`);
  if (!isUuid(enquiryId)) {
    return { ok: false, message: "Enquiry not found." };
  }

  const response = sellerResponse.trim();
  if (response.length < 10) {
    return {
      ok: false,
      message: "Please enter a response of at least 10 characters.",
      fieldError: "Response must be at least 10 characters.",
    };
  }
  if (response.length > 2000) {
    return {
      ok: false,
      message: "Response must be 2000 characters or fewer.",
      fieldError: "Response is too long.",
    };
  }

  const { enquiry } = await fetchEnquiryByIdForParticipant(enquiryId, user.id);
  if (!enquiry || enquiry.sellerId !== user.id) {
    return { ok: false, message: "Enquiry not found or you do not have access." };
  }
  if (enquiry.status === "closed") {
    return { ok: false, message: "This enquiry is closed." };
  }

  const supabase = await createSupabaseServerClient();
  if (!supabase) {
    return { ok: false, message: GENERIC_ERROR };
  }

  const { data, error } = await supabase
    .from("enquiries")
    .update({
      seller_response: response,
      status: "responded",
      responded_at: new Date().toISOString(),
    })
    .eq("id", enquiryId)
    .eq("seller_id", user.id)
    .neq("status", "closed")
    .select("id")
    .maybeSingle();

  if (error) {
    if (process.env.NODE_ENV === "development") {
      console.warn("[Bizora] respondToEnquiry failed:", error.message);
    }
    return { ok: false, message: mapDbError(error.message) };
  }

  if (!data) {
    return { ok: false, message: "This enquiry could not be updated." };
  }

  revalidatePath("/dashboard/enquiries");
  revalidatePath(`/dashboard/enquiries/${enquiryId}`);

  return { ok: true, message: "Response sent to the buyer." };
}

export async function closeEnquiry(
  enquiryId: string,
): Promise<EnquiryActionResult> {
  const { user } = await requireUser(`/dashboard/enquiries/${enquiryId}`);
  if (!isUuid(enquiryId)) {
    return { ok: false, message: "Enquiry not found." };
  }

  const supabase = await createSupabaseServerClient();
  if (!supabase) {
    return { ok: false, message: GENERIC_ERROR };
  }

  const { data, error } = await supabase
    .from("enquiries")
    .update({ status: "closed" })
    .eq("id", enquiryId)
    .eq("seller_id", user.id)
    .neq("status", "closed")
    .select("id")
    .maybeSingle();

  if (error) {
    if (process.env.NODE_ENV === "development") {
      console.warn("[Bizora] closeEnquiry failed:", error.message);
    }
    return { ok: false, message: GENERIC_ERROR };
  }

  if (!data) {
    return { ok: false, message: "This enquiry is already closed." };
  }

  revalidatePath("/dashboard/enquiries");
  revalidatePath(`/dashboard/enquiries/${enquiryId}`);

  return { ok: true, message: "Enquiry closed." };
}

export type EnquiryFormActionState = {
  ok: boolean;
  message?: string;
  fieldError?: string;
};

export async function createEnquiryFormAction(
  _prev: EnquiryFormActionState,
  formData: FormData,
): Promise<EnquiryFormActionState> {
  const businessId = String(formData.get("businessId") ?? "");
  const message = String(formData.get("message") ?? "");
  const result = await createEnquiry(businessId, message);
  if (!result.ok) {
    return {
      ok: false,
      message: result.message,
      fieldError: result.fieldError,
    };
  }
  return { ok: true, message: result.message };
}

export async function respondToEnquiryFormAction(
  _prev: EnquiryFormActionState,
  formData: FormData,
): Promise<EnquiryFormActionState> {
  const enquiryId = String(formData.get("enquiryId") ?? "");
  const response = String(formData.get("sellerResponse") ?? "");
  const result = await respondToEnquiry(enquiryId, response);
  if (!result.ok) {
    return {
      ok: false,
      message: result.message,
      fieldError: result.fieldError,
    };
  }
  return { ok: true, message: result.message };
}

export async function closeEnquiryFormAction(
  _prev: EnquiryFormActionState,
  formData: FormData,
): Promise<EnquiryFormActionState> {
  const enquiryId = String(formData.get("enquiryId") ?? "");
  const result = await closeEnquiry(enquiryId);
  if (!result.ok) {
    return { ok: false, message: result.message };
  }
  return { ok: true, message: result.message };
}
