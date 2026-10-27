import { formatListingContactPhone } from "@/lib/listing-contacts/phone";
import type {
  ListingContactAdminView,
  ListingContactOwnerView,
  ParsedListingContact,
} from "@/lib/listing-contacts/types";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { ListingSellerContactRow } from "@/lib/supabase/database.types";

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function isUuid(value: string): boolean {
  return UUID_PATTERN.test(value);
}

function emptyOwnerView(): ListingContactOwnerView {
  return {
    contactName: "",
    contactMobile: "",
    contactEmail: "",
    contactType: "",
    sharingAuthorised: false,
    exists: false,
  };
}

function mapOwnerView(row: ListingSellerContactRow): ListingContactOwnerView {
  return {
    contactName: row.contact_name?.trim() ?? "",
    contactMobile: formatListingContactPhone(row.mobile_e164),
    contactEmail: row.email?.trim() ?? "",
    contactType: row.contact_type ?? "",
    sharingAuthorised: row.sharing_authorised,
    exists: true,
  };
}

/**
 * Load contact for the authenticated owner/admin editing a listing.
 * Returns empty defaults when no row exists (legacy listings).
 */
export async function fetchListingContactForOwner(
  businessId: string,
): Promise<{ contact: ListingContactOwnerView; error: string | null }> {
  if (!isUuid(businessId)) {
    return { contact: emptyOwnerView(), error: null };
  }

  const supabase = await createSupabaseServerClient();
  if (!supabase) {
    return {
      contact: emptyOwnerView(),
      error: "We couldn't load contact details right now.",
    };
  }

  const { data, error } = await supabase
    .from("listing_seller_contacts")
    .select(
      "business_id, contact_name, mobile_e164, email, contact_type, sharing_authorised, created_at, updated_at",
    )
    .eq("business_id", businessId)
    .maybeSingle();

  if (error) {
    if (process.env.NODE_ENV === "development") {
      console.warn("[Bizora] fetchListingContactForOwner failed:", error.message);
    }
    return {
      contact: emptyOwnerView(),
      error: "We couldn't load contact details right now.",
    };
  }

  if (!data) {
    return { contact: emptyOwnerView(), error: null };
  }

  return {
    contact: mapOwnerView(data as ListingSellerContactRow),
    error: null,
  };
}

/**
 * Admin-only contact fetch for enquiry workspace. Relies on RLS is_admin().
 */
export async function fetchListingContactForAdmin(
  businessId: string,
): Promise<{ contact: ListingContactAdminView | null; error: string | null }> {
  if (!isUuid(businessId)) {
    return { contact: null, error: "Listing not found." };
  }

  const supabase = await createSupabaseServerClient();
  if (!supabase) {
    return { contact: null, error: "Unable to load contact details." };
  }

  const { data, error } = await supabase
    .from("listing_seller_contacts")
    .select(
      "business_id, contact_name, mobile_e164, email, contact_type, sharing_authorised",
    )
    .eq("business_id", businessId)
    .maybeSingle();

  if (error) {
    if (process.env.NODE_ENV === "development") {
      console.warn("[Bizora] fetchListingContactForAdmin failed:", error.message);
    }
    return { contact: null, error: "Unable to load contact details." };
  }

  if (!data) {
    return { contact: null, error: null };
  }

  return {
    contact: {
      businessId: data.business_id,
      contactName: data.contact_name,
      mobileE164: data.mobile_e164,
      email: data.email,
      contactType: data.contact_type,
      sharingAuthorised: data.sharing_authorised,
    },
    error: null,
  };
}

/**
 * Upsert contact for a specific business id. Caller must enforce ownership.
 * Never copies account profile phone automatically.
 */
export async function upsertListingContact(
  businessId: string,
  fields: ParsedListingContact,
): Promise<{ ok: true } | { ok: false; message: string }> {
  if (!isUuid(businessId)) {
    return { ok: false, message: "Listing not found." };
  }

  const supabase = await createSupabaseServerClient();
  if (!supabase) {
    return { ok: false, message: "We couldn't save contact details right now." };
  }

  const payload = {
    business_id: businessId,
    contact_name: fields.contactName,
    mobile_e164: fields.mobileE164,
    email: fields.email,
    contact_type: fields.contactType,
    sharing_authorised: fields.sharingAuthorised,
    updated_at: new Date().toISOString(),
  };

  const { error } = await supabase
    .from("listing_seller_contacts")
    .upsert(payload, { onConflict: "business_id" });

  if (error) {
    if (process.env.NODE_ENV === "development") {
      console.warn("[Bizora] upsertListingContact failed:", error.message);
    }
    return { ok: false, message: "We couldn't save contact details right now." };
  }

  return { ok: true };
}

/**
 * Copy contact from published listing onto a revision (or any target id).
 * No-op when source has no contact row.
 */
export async function cloneListingContact(
  sourceBusinessId: string,
  targetBusinessId: string,
): Promise<{ ok: true } | { ok: false; message: string }> {
  if (!isUuid(sourceBusinessId) || !isUuid(targetBusinessId)) {
    return { ok: false, message: "Listing not found." };
  }
  if (sourceBusinessId === targetBusinessId) {
    return { ok: true };
  }

  const supabase = await createSupabaseServerClient();
  if (!supabase) {
    return { ok: false, message: "We couldn't copy contact details right now." };
  }

  const { data: source, error } = await supabase
    .from("listing_seller_contacts")
    .select(
      "contact_name, mobile_e164, email, contact_type, sharing_authorised",
    )
    .eq("business_id", sourceBusinessId)
    .maybeSingle();

  if (error) {
    if (process.env.NODE_ENV === "development") {
      console.warn("[Bizora] cloneListingContact read failed:", error.message);
    }
    return { ok: false, message: "We couldn't copy contact details right now." };
  }

  if (!source) {
    return { ok: true };
  }

  const { error: writeError } = await supabase
    .from("listing_seller_contacts")
    .upsert(
      {
        business_id: targetBusinessId,
        contact_name: source.contact_name,
        mobile_e164: source.mobile_e164,
        email: source.email,
        contact_type: source.contact_type,
        sharing_authorised: source.sharing_authorised,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "business_id" },
    );

  if (writeError) {
    if (process.env.NODE_ENV === "development") {
      console.warn("[Bizora] cloneListingContact write failed:", writeError.message);
    }
    return { ok: false, message: "We couldn't copy contact details right now." };
  }

  return { ok: true };
}
