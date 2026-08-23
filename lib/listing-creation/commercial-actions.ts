"use server";

import { redirect } from "next/navigation";
import { getBusinessImageSubmitState } from "@/lib/business-images/actions";
import { requireUser } from "@/lib/auth/session";
import { generateUniqueSlug } from "@/lib/listing-creation/slug";
import {
  hasCommercialFieldErrors,
  parseCommercialFormInput,
  validateCommercialDraftFields,
  validateCommercialSubmitFields,
  type CommercialFieldErrors,
  type CommercialSpaceFormInput,
  type ParsedCommercialFields,
} from "@/lib/listing-creation/commercial-validation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type {
  FurnishedOption,
  ListingPurpose,
  SpaceType,
} from "@/lib/listing-types";

const GENERIC_ERROR =
  "We couldn't save your listing right now. Please try again shortly.";

export type CommercialListingActionResult =
  | {
      ok: true;
      listingId: string;
      slug: string;
      message?: string;
    }
  | {
      ok: false;
      message: string;
      fieldErrors?: CommercialFieldErrors;
    };

function formDataToCommercialInput(formData: FormData): CommercialSpaceFormInput {
  const read = (key: string) => {
    const value = formData.get(key);
    return typeof value === "string" ? value : null;
  };

  return {
    title: read("title"),
    description: read("description"),
    categoryId: read("categoryId") || null,
    stateId: read("stateId") || null,
    districtId: read("districtId") || null,
    cityId: read("cityId") || null,
    localityId: read("localityId") || null,
    spaceType: read("spaceType") || null,
    listingPurpose: read("listingPurpose") || null,
    monthlyRent: read("monthlyRent"),
    securityDeposit: read("securityDeposit"),
    areaSqft: read("areaSqft"),
    floor: read("floor"),
    parkingSpaces: read("parkingSpaces"),
    furnished: read("furnished") || null,
    leaseTermMonths: read("leaseTermMonths"),
    availableFrom: read("availableFrom") || null,
    businessUsage: read("businessUsage"),
  };
}

function toCommercialDbRow(fields: ParsedCommercialFields) {
  return {
    title: fields.title,
    description: fields.description,
    category_id: fields.categoryId,
    state_id: fields.stateId,
    district_id: fields.districtId,
    city_id: fields.cityId,
    locality_id: fields.localityId,
    space_type: fields.spaceType as SpaceType | null,
    listing_purpose: fields.listingPurpose as ListingPurpose | null,
    monthly_rent: fields.monthlyRent,
    security_deposit: fields.securityDeposit,
    area_sqft: fields.areaSqft,
    floor: fields.floor,
    parking_spaces: fields.parkingSpaces,
    furnished: fields.furnished as FurnishedOption | null,
    lease_term_months: fields.leaseTermMonths,
    available_from: fields.availableFrom,
    business_usage: fields.businessUsage,
  };
}

function mapDbError(message: string | undefined): string {
  const text = (message ?? "").toLowerCase();
  if (text.includes("district does not belong")) {
    return "Please select a valid district for the selected state.";
  }
  if (text.includes("city does not belong")) {
    return "Please select a valid city for the selected district.";
  }
  if (text.includes("locality does not belong")) {
    return "Please select a valid locality for the selected city.";
  }
  if (text.includes("state is required")) {
    return "Please select a state.";
  }
  if (text.includes("district is required")) {
    return "Please select a district.";
  }
  if (text.includes("city is required")) {
    return "Please select a city.";
  }
  if (text.includes("monthly_rent")) {
    return "Please enter a monthly rent greater than zero.";
  }
  if (text.includes("area_sqft")) {
    return "Please enter an area greater than zero.";
  }
  if (text.includes("duplicate") && text.includes("slug")) {
    return "That title is already in use. Please adjust the title.";
  }
  return GENERIC_ERROR;
}

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
  if (error) {
    if (process.env.NODE_ENV === "development") {
      console.warn("[Bizora] slug check failed:", error.message);
    }
    return true;
  }
  return (data?.length ?? 0) > 0;
}

async function promoteCallerToSeller(): Promise<void> {
  const supabase = await createSupabaseServerClient();
  if (!supabase) return;

  const { error } = await supabase.rpc("promote_to_seller");
  if (error && process.env.NODE_ENV === "development") {
    console.warn("[Bizora] promote_to_seller failed:", error.message);
  }
}

export async function createCommercialDraftListing(
  input: CommercialSpaceFormInput,
): Promise<CommercialListingActionResult> {
  const { user } = await requireUser("/dashboard/listings/new/commercial");
  const supabase = await createSupabaseServerClient();
  if (!supabase) {
    return { ok: false, message: GENERIC_ERROR };
  }

  const { fields, errors: parseErrors } = parseCommercialFormInput(input);
  const fieldErrors = validateCommercialDraftFields(fields, parseErrors);
  if (hasCommercialFieldErrors(fieldErrors)) {
    return {
      ok: false,
      message: "Please fix the highlighted fields.",
      fieldErrors,
    };
  }

  const slug = await generateUniqueSlug(fields.title, (candidate) =>
    slugTaken(candidate),
  );

  const { data, error } = await supabase
    .from("businesses")
    .insert({
      ...toCommercialDbRow(fields),
      slug,
      seller_id: user.id,
      status: "draft",
      listing_type: "commercial_space",
      is_premium: false,
      is_verified: false,
    })
    .select("id, slug")
    .single();

  if (error || !data) {
    if (process.env.NODE_ENV === "development") {
      console.warn("[Bizora] createCommercialDraftListing failed:", error?.message);
    }
    return { ok: false, message: mapDbError(error?.message) };
  }

  await promoteCallerToSeller();

  return {
    ok: true,
    listingId: data.id,
    slug: data.slug,
    message: "Draft saved.",
  };
}

export async function updateCommercialDraftListing(
  listingId: string,
  input: CommercialSpaceFormInput,
): Promise<CommercialListingActionResult> {
  const { user } = await requireUser(`/dashboard/listings/${listingId}/edit`);
  const supabase = await createSupabaseServerClient();
  if (!supabase) {
    return { ok: false, message: GENERIC_ERROR };
  }

  const { fields, errors: parseErrors } = parseCommercialFormInput(input);
  const fieldErrors = validateCommercialDraftFields(fields, parseErrors);
  if (hasCommercialFieldErrors(fieldErrors)) {
    return {
      ok: false,
      message: "Please fix the highlighted fields.",
      fieldErrors,
    };
  }

  const { data: existing, error: loadError } = await supabase
    .from("businesses")
    .select("id, seller_id, status, title, slug, listing_type")
    .eq("id", listingId)
    .eq("seller_id", user.id)
    .maybeSingle();

  if (loadError || !existing) {
    return { ok: false, message: "Listing not found or you do not have access." };
  }

  if (existing.listing_type !== "commercial_space") {
    return { ok: false, message: "This listing is not a commercial space." };
  }

  if (existing.status !== "draft" && existing.status !== "rejected") {
    return {
      ok: false,
      message: "Only draft or rejected listings can be edited.",
    };
  }

  let slug = existing.slug;
  if (fields.title !== existing.title) {
    slug = await generateUniqueSlug(fields.title, (candidate) =>
      slugTaken(candidate, listingId),
    );
  }

  const { data, error } = await supabase
    .from("businesses")
    .update({
      ...toCommercialDbRow(fields),
      slug,
      updated_at: new Date().toISOString(),
    })
    .eq("id", listingId)
    .eq("seller_id", user.id)
    .in("status", ["draft", "rejected"])
    .select("id, slug")
    .single();

  if (error || !data) {
    if (process.env.NODE_ENV === "development") {
      console.warn("[Bizora] updateCommercialDraftListing failed:", error?.message);
    }
    return { ok: false, message: mapDbError(error?.message) };
  }

  return {
    ok: true,
    listingId: data.id,
    slug: data.slug,
    message: "Draft saved.",
  };
}

export async function submitCommercialListingForReview(
  listingId: string,
  input?: CommercialSpaceFormInput,
): Promise<CommercialListingActionResult> {
  const { user } = await requireUser(`/dashboard/listings/${listingId}/edit`);
  const supabase = await createSupabaseServerClient();
  if (!supabase) {
    return { ok: false, message: GENERIC_ERROR };
  }

  const { data: existing, error: loadError } = await supabase
    .from("businesses")
    .select("*")
    .eq("id", listingId)
    .eq("seller_id", user.id)
    .maybeSingle();

  if (loadError || !existing) {
    return { ok: false, message: "Listing not found or you do not have access." };
  }

  if (existing.listing_type !== "commercial_space") {
    return { ok: false, message: "This listing is not a commercial space." };
  }

  if (existing.status !== "draft" && existing.status !== "rejected") {
    return {
      ok: false,
      message: "Only draft or rejected listings can be submitted for review.",
    };
  }

  let fields: ParsedCommercialFields;
  let parseErrors: CommercialFieldErrors = {};

  if (input) {
    const parsed = parseCommercialFormInput(input);
    fields = parsed.fields;
    parseErrors = parsed.errors;
  } else {
    fields = {
      title: existing.title,
      description: existing.description,
      categoryId: existing.category_id,
      stateId: existing.state_id,
      districtId: existing.district_id,
      cityId: existing.city_id,
      localityId: existing.locality_id,
      spaceType: existing.space_type,
      listingPurpose: existing.listing_purpose,
      monthlyRent: existing.monthly_rent,
      securityDeposit: existing.security_deposit,
      areaSqft: existing.area_sqft,
      floor: existing.floor,
      parkingSpaces: existing.parking_spaces,
      furnished: existing.furnished,
      leaseTermMonths: existing.lease_term_months,
      availableFrom: existing.available_from,
      businessUsage: existing.business_usage,
    };
  }

  const imageState = await getBusinessImageSubmitState(listingId);
  const fieldErrors = await validateCommercialSubmitFields(fields, parseErrors, {
    requirePrimaryImage: true,
    hasPrimaryImage: imageState.hasPrimary,
    imageCount: imageState.imageCount,
  });

  if (hasCommercialFieldErrors(fieldErrors)) {
    return {
      ok: false,
      message: "Please complete the required fields before submitting.",
      fieldErrors,
    };
  }

  let slug = existing.slug;
  if (input && fields.title !== existing.title) {
    slug = await generateUniqueSlug(fields.title, (candidate) =>
      slugTaken(candidate, listingId),
    );
  }

  const { data, error } = await supabase
    .from("businesses")
    .update({
      ...toCommercialDbRow(fields),
      slug,
      status: "pending",
      submitted_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("id", listingId)
    .eq("seller_id", user.id)
    .in("status", ["draft", "rejected"])
    .select("id, slug")
    .single();

  if (error || !data) {
    if (process.env.NODE_ENV === "development") {
      console.warn(
        "[Bizora] submitCommercialListingForReview failed:",
        error?.message,
      );
    }
    return { ok: false, message: mapDbError(error?.message) };
  }

  return {
    ok: true,
    listingId: data.id,
    slug: data.slug,
    message: "Listing submitted for review.",
  };
}

export type CommercialFormActionState = {
  ok: boolean;
  message?: string;
  fieldErrors?: CommercialFieldErrors;
  listingId?: string;
  intent?: "draft" | "submit";
};

export async function createCommercialFormAction(
  _prev: CommercialFormActionState,
  formData: FormData,
): Promise<CommercialFormActionState> {
  const intent = formData.get("intent") === "submit" ? "submit" : "draft";
  const input = formDataToCommercialInput(formData);

  if (intent === "draft") {
    const result = await createCommercialDraftListing(input);
    if (!result.ok) {
      return {
        ok: false,
        message: result.message,
        fieldErrors: result.fieldErrors,
        intent,
      };
    }
    redirect(`/dashboard/listings/${result.listingId}/edit?saved=1`);
  }

  const { fields, errors: parseErrors } = parseCommercialFormInput(input);
  const submitErrors = await validateCommercialSubmitFields(fields, parseErrors, {
    requirePrimaryImage: true,
    hasPrimaryImage: false,
    imageCount: 0,
  });
  if (hasCommercialFieldErrors(submitErrors)) {
    return {
      ok: false,
      message:
        submitErrors.images ??
        "Please complete the required fields before submitting. Save a draft first to upload photos.",
      fieldErrors: submitErrors,
      intent,
    };
  }

  const created = await createCommercialDraftListing(input);
  if (!created.ok) {
    return {
      ok: false,
      message: created.message,
      fieldErrors: created.fieldErrors,
      intent,
    };
  }

  const submitted = await submitCommercialListingForReview(
    created.listingId,
    input,
  );
  if (!submitted.ok) {
    redirect(`/dashboard/listings/${created.listingId}/edit?error=submit`);
  }

  redirect(`/dashboard/listings/${created.listingId}/preview?submitted=1`);
}

export async function updateCommercialFormAction(
  _prev: CommercialFormActionState,
  formData: FormData,
): Promise<CommercialFormActionState> {
  const listingId = String(formData.get("listingId") ?? "");
  const intent = formData.get("intent") === "submit" ? "submit" : "draft";
  const input = formDataToCommercialInput(formData);

  if (!listingId) {
    return { ok: false, message: "Listing id is required.", intent };
  }

  if (intent === "draft") {
    const result = await updateCommercialDraftListing(listingId, input);
    if (!result.ok) {
      return {
        ok: false,
        message: result.message,
        fieldErrors: result.fieldErrors,
        listingId,
        intent,
      };
    }
    return {
      ok: true,
      message: result.message ?? "Draft saved.",
      listingId: result.listingId,
      intent,
    };
  }

  const submitted = await submitCommercialListingForReview(listingId, input);
  if (!submitted.ok) {
    return {
      ok: false,
      message: submitted.message,
      fieldErrors: submitted.fieldErrors,
      listingId,
      intent,
    };
  }

  redirect(`/dashboard/listings/${submitted.listingId}/preview?submitted=1`);
}
