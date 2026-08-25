"use server";

import { redirect } from "next/navigation";
import { getBusinessImageSubmitState } from "@/lib/business-images/actions";
import { requireUser } from "@/lib/auth/session";
import { generateUniqueSlug } from "@/lib/listing-creation/slug";
import {
  hasFieldErrors,
  parseListingFormInput,
  validateDraftFields,
  validateSubmitFields,
  ensureDistrictFromCity,
  type ListingFieldErrors,
  type ListingFormInput,
  type ParsedListingFields,
} from "@/lib/listing-creation/validation";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const GENERIC_ERROR =
  "We couldn't save your listing right now. Please try again shortly.";

export type ListingActionResult =
  | {
      ok: true;
      listingId: string;
      slug: string;
      message?: string;
    }
  | {
      ok: false;
      message: string;
      fieldErrors?: ListingFieldErrors;
    };

function formDataToInput(formData: FormData): ListingFormInput {
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
    askingPrice: read("askingPrice"),
    annualRevenue: read("annualRevenue"),
    annualProfit: read("annualProfit"),
    ebitda: read("ebitda"),
    establishedYear: read("establishedYear"),
    employees: read("employees"),
    reasonForSale: read("reasonForSale"),
  };
}

function toDbRow(fields: ParsedListingFields) {
  return {
    title: fields.title,
    description: fields.description,
    category_id: fields.categoryId,
    state_id: fields.stateId,
    district_id: fields.districtId,
    city_id: fields.cityId,
    locality_id: fields.localityId,
    asking_price: fields.askingPrice,
    annual_revenue: fields.annualRevenue,
    annual_profit: fields.annualProfit,
    ebitda: fields.ebitda,
    established_year: fields.establishedYear,
    employees: fields.employees,
    reason_for_sale: fields.reasonForSale,
  };
}

function mapDbError(message: string | undefined): string {
  const text = (message ?? "").toLowerCase();
  if (text.includes("district does not belong")) {
    return "Please select a valid city for the selected state.";
  }
  if (text.includes("city does not belong")) {
    return "Please select a valid city for the selected state.";
  }
  if (text.includes("locality does not belong")) {
    return "Please select a valid locality for the selected city.";
  }
  if (text.includes("state is required")) {
    return "Please select a state.";
  }
  if (text.includes("district is required")) {
    return "Please select a city.";
  }
  if (text.includes("city is required")) {
    return "Please select a city.";
  }
  if (text.includes("duplicate") && text.includes("slug")) {
    return "That business title is already in use. Please adjust the title.";
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

/**
 * Create a new draft listing owned by the authenticated user.
 * seller_id and status are server-controlled.
 */
export async function createDraftListing(
  input: ListingFormInput,
): Promise<ListingActionResult> {
  const { user } = await requireUser("/dashboard/listings/new");
  const supabase = await createSupabaseServerClient();
  if (!supabase) {
    return { ok: false, message: GENERIC_ERROR };
  }

  const { fields: parsedFields, errors: parseErrors } =
    parseListingFormInput(input);
  const fields = await ensureDistrictFromCity(parsedFields);
  const fieldErrors = validateDraftFields(fields, parseErrors);
  if (hasFieldErrors(fieldErrors)) {
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
      ...toDbRow(fields),
      slug,
      seller_id: user.id,
      status: "draft",
      listing_type: "business",
      is_premium: false,
      is_verified: false,
    })
    .select("id, slug")
    .single();

  if (error || !data) {
    if (process.env.NODE_ENV === "development") {
      console.warn("[Bizora] createDraftListing failed:", error?.message);
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

/**
 * Update an owned draft or rejected listing. Never publishes.
 */
export async function updateDraftListing(
  listingId: string,
  input: ListingFormInput,
): Promise<ListingActionResult> {
  const { user } = await requireUser(`/dashboard/listings/${listingId}/edit`);
  const supabase = await createSupabaseServerClient();
  if (!supabase) {
    return { ok: false, message: GENERIC_ERROR };
  }

  const { fields: parsedFields, errors: parseErrors } =
    parseListingFormInput(input);
  const fields = await ensureDistrictFromCity(parsedFields);
  const fieldErrors = validateDraftFields(fields, parseErrors);
  if (hasFieldErrors(fieldErrors)) {
    return {
      ok: false,
      message: "Please fix the highlighted fields.",
      fieldErrors,
    };
  }

  const { data: existing, error: loadError } = await supabase
    .from("businesses")
    .select("id, seller_id, status, title, slug")
    .eq("id", listingId)
    .eq("seller_id", user.id)
    .maybeSingle();

  if (loadError || !existing) {
    return { ok: false, message: "Listing not found or you do not have access." };
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
      ...toDbRow(fields),
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
      console.warn("[Bizora] updateDraftListing failed:", error?.message);
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

/**
 * Persist form data (if provided), validate text/data rules, and set status=pending.
 * Image requirement is reserved for Phase 4C-2B via validateSubmitFields options.
 */
export async function submitListingForReview(
  listingId: string,
  input?: ListingFormInput,
): Promise<ListingActionResult> {
  const { user } = await requireUser(`/dashboard/listings/${listingId}/edit`);
  const supabase = await createSupabaseServerClient();
  if (!supabase) {
    return { ok: false, message: GENERIC_ERROR };
  }

  const { data: existing, error: loadError } = await supabase
    .from("businesses")
    .select(
      "id, seller_id, status, title, description, category_id, state_id, district_id, city_id, locality_id, asking_price, annual_revenue, annual_profit, ebitda, established_year, employees, reason_for_sale, slug",
    )
    .eq("id", listingId)
    .eq("seller_id", user.id)
    .maybeSingle();

  if (loadError || !existing) {
    return { ok: false, message: "Listing not found or you do not have access." };
  }

  if (existing.status !== "draft" && existing.status !== "rejected") {
    return {
      ok: false,
      message: "Only draft or rejected listings can be submitted for review.",
    };
  }

  let fields: ParsedListingFields;
  let parseErrors: ListingFieldErrors = {};

  if (input) {
    const parsed = parseListingFormInput(input);
    fields = await ensureDistrictFromCity(parsed.fields);
    parseErrors = parsed.errors;
  } else {
    fields = await ensureDistrictFromCity({
      title: existing.title,
      description: existing.description,
      categoryId: existing.category_id,
      stateId: existing.state_id,
      districtId: existing.district_id,
      cityId: existing.city_id,
      localityId: existing.locality_id,
      askingPrice: existing.asking_price,
      annualRevenue: existing.annual_revenue,
      annualProfit: existing.annual_profit,
      ebitda: existing.ebitda,
      establishedYear: existing.established_year,
      employees: existing.employees,
      reasonForSale: existing.reason_for_sale,
    });
  }

  const imageState = await getBusinessImageSubmitState(listingId);
  const fieldErrors = await validateSubmitFields(fields, parseErrors, {
    requirePrimaryImage: true,
    hasPrimaryImage: imageState.hasPrimary,
    imageCount: imageState.imageCount,
  });

  if (hasFieldErrors(fieldErrors)) {
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
      ...toDbRow(fields),
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
      console.warn("[Bizora] submitListingForReview failed:", error?.message);
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

export type ListingFormActionState = {
  ok: boolean;
  message?: string;
  fieldErrors?: ListingFieldErrors;
  listingId?: string;
  intent?: "draft" | "submit";
};

export async function createListingFormAction(
  _prev: ListingFormActionState,
  formData: FormData,
): Promise<ListingFormActionState> {
  const intent = formData.get("intent") === "submit" ? "submit" : "draft";
  const input = formDataToInput(formData);

  if (intent === "draft") {
    const result = await createDraftListing(input);
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

  // Pre-validate submit rules before creating so the user keeps form state on errors
  const { fields: parsedFields, errors: parseErrors } =
    parseListingFormInput(input);
  const fields = await ensureDistrictFromCity(parsedFields);
  const submitErrors = await validateSubmitFields(fields, parseErrors, {
    requirePrimaryImage: true,
    hasPrimaryImage: false,
    imageCount: 0,
  });
  if (hasFieldErrors(submitErrors)) {
    return {
      ok: false,
      message:
        submitErrors.images ??
        "Please complete the required fields before submitting. Save a draft first to upload photos.",
      fieldErrors: submitErrors,
      intent,
    };
  }

  const created = await createDraftListing(input);
  if (!created.ok) {
    return {
      ok: false,
      message: created.message,
      fieldErrors: created.fieldErrors,
      intent,
    };
  }

  const submitted = await submitListingForReview(created.listingId, input);
  if (!submitted.ok) {
    redirect(`/dashboard/listings/${created.listingId}/edit?error=submit`);
  }

  redirect(`/dashboard/listings/${created.listingId}/preview?submitted=1`);
}

export async function updateListingFormAction(
  _prev: ListingFormActionState,
  formData: FormData,
): Promise<ListingFormActionState> {
  const listingId = String(formData.get("listingId") ?? "");
  const intent = formData.get("intent") === "submit" ? "submit" : "draft";
  const input = formDataToInput(formData);

  if (!listingId) {
    return { ok: false, message: "Listing id is required.", intent };
  }

  if (intent === "draft") {
    const result = await updateDraftListing(listingId, input);
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

  const submitted = await submitListingForReview(listingId, input);
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
