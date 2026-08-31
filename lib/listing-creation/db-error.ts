import { LISTING_SAVE_FAILED_PRESERVE } from "@/lib/business-images/messages";

/** Safe subset of PostgREST / Postgres errors for server logs (no user PII). */
export type ListingDbErrorFields = {
  code?: string | null;
  message?: string | null;
  details?: string | null;
  hint?: string | null;
};

/**
 * Temporary diagnostic logging for listing save failures.
 * Logs only structural error fields — never form values or credentials.
 */
export function logListingDbError(
  context: string,
  error: ListingDbErrorFields | null | undefined,
): void {
  if (!error) return;

  console.warn(`[Bizora] ${context} failed:`, {
    code: error.code ?? null,
    message: error.message ?? null,
    details: error.details ?? null,
    hint: error.hint ?? null,
  });
}

/**
 * Maps Supabase/Postgres errors from listing writes to user-facing messages.
 */
export function mapListingDbError(
  message: string | undefined,
  code?: string | null,
): string {
  const text = (message ?? "").toLowerCase();
  const errorCode = (code ?? "").toUpperCase();

  if (
    errorCode === "PGRST204" ||
    (text.includes("could not find") && text.includes("column"))
  ) {
    return LISTING_SAVE_FAILED_PRESERVE;
  }

  if (text.includes("district does not belong")) {
    return "Please select a valid city for the selected state.";
  }
  if (text.includes("city does not belong")) {
    return "Please select a valid city for the selected state.";
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
  if (text.includes("monthly_rent")) {
    return "Please enter a monthly rent greater than zero.";
  }
  if (text.includes("area_sqft")) {
    return "Please enter an area greater than zero.";
  }
  if (text.includes("duplicate") && text.includes("slug")) {
    return "That business title is already in use. Please adjust the title.";
  }
  if (
    text.includes("violates foreign key constraint") &&
    text.includes("seller_id")
  ) {
    return LISTING_SAVE_FAILED_PRESERVE;
  }

  return LISTING_SAVE_FAILED_PRESERVE;
}

/**
 * Commercial listings use the same location/slug rules; only the slug message differs.
 */
export function mapCommercialListingDbError(
  message: string | undefined,
  code?: string | null,
): string {
  const mapped = mapListingDbError(message, code);
  if (
    mapped ===
    "That business title is already in use. Please adjust the title."
  ) {
    return "That title is already in use. Please adjust the title.";
  }
  return mapped;
}
