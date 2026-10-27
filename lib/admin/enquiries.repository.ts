import { formatListingContactPhone } from "@/lib/listing-contacts/phone";
import { LISTING_CONTACT_TYPE_OPTIONS } from "@/lib/listing-contacts/types";
import type { ListingContactType } from "@/lib/supabase/database.types";
import type { EnquiryStatus } from "@/lib/supabase/database.types";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const FETCH_ERROR =
  "We couldn't load enquiries right now. Please try again shortly.";

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function isUuid(value: string): boolean {
  return UUID_PATTERN.test(value);
}

function contactTypeLabel(type: ListingContactType | null): string | null {
  if (!type) return null;
  return (
    LISTING_CONTACT_TYPE_OPTIONS.find((option) => option.value === type)
      ?.label ?? type
  );
}

export type AdminEnquiryListItem = {
  id: string;
  businessId: string;
  businessTitle: string;
  buyerName: string;
  status: EnquiryStatus;
  createdAt: string;
  hasSellerContact: boolean;
  sharingAuthorised: boolean;
};

export type AdminEnquiryContactShareView = {
  id: string;
  sharedAt: string;
  sharedByName: string;
  note: string | null;
};

export type AdminEnquiryDetail = {
  id: string;
  businessId: string;
  businessTitle: string;
  buyerId: string;
  buyerName: string;
  buyerPhone: string | null;
  buyerEmail: string | null;
  message: string;
  status: EnquiryStatus;
  sellerResponse: string | null;
  createdAt: string;
  updatedAt: string;
  adminNotes: string;
  sellerContact: {
    contactName: string | null;
    mobileDisplay: string | null;
    email: string | null;
    contactType: ListingContactType | null;
    contactTypeLabel: string | null;
    sharingAuthorised: boolean;
    exists: boolean;
  };
  contactShares: AdminEnquiryContactShareView[];
};

export async function fetchAdminEnquiries(): Promise<{
  enquiries: AdminEnquiryListItem[];
  error: string | null;
}> {
  const supabase = await createSupabaseServerClient();
  if (!supabase) {
    return { enquiries: [], error: FETCH_ERROR };
  }

  const { data, error } = await supabase
    .from("enquiries")
    .select(
      `
      id,
      business_id,
      status,
      created_at,
      business:businesses ( title ),
      buyer:profiles!enquiries_buyer_id_fkey ( full_name )
    `,
    )
    .order("created_at", { ascending: false })
    .limit(200);

  if (error) {
    if (process.env.NODE_ENV === "development") {
      console.warn("[Bizora] fetchAdminEnquiries failed:", error.message);
    }
    return { enquiries: [], error: FETCH_ERROR };
  }

  const rows = data ?? [];
  const businessIds = [
    ...new Set(rows.map((row) => row.business_id).filter(Boolean)),
  ];

  const contactByBusiness = new Map<
    string,
    { sharing_authorised: boolean }
  >();

  if (businessIds.length > 0) {
    const { data: contacts } = await supabase
      .from("listing_seller_contacts")
      .select("business_id, sharing_authorised")
      .in("business_id", businessIds);

    for (const contact of contacts ?? []) {
      contactByBusiness.set(contact.business_id, {
        sharing_authorised: contact.sharing_authorised,
      });
    }
  }

  return {
    enquiries: rows.map((row) => {
      const contact = contactByBusiness.get(row.business_id);
      const business = row.business as { title: string } | null;
      const buyer = row.buyer as { full_name: string | null } | null;
      return {
        id: row.id,
        businessId: row.business_id,
        businessTitle: business?.title ?? "Listing",
        buyerName: buyer?.full_name?.trim() || "Buyer",
        status: row.status as EnquiryStatus,
        createdAt: row.created_at,
        hasSellerContact: Boolean(contact),
        sharingAuthorised: contact?.sharing_authorised ?? false,
      };
    }),
    error: null,
  };
}

export async function fetchAdminEnquiryDetail(
  enquiryId: string,
): Promise<{ enquiry: AdminEnquiryDetail | null; error: string | null }> {
  if (!isUuid(enquiryId)) {
    return { enquiry: null, error: null };
  }

  const supabase = await createSupabaseServerClient();
  if (!supabase) {
    return { enquiry: null, error: FETCH_ERROR };
  }

  const { data, error } = await supabase
    .from("enquiries")
    .select(
      `
      id,
      business_id,
      buyer_id,
      message,
      status,
      seller_response,
      created_at,
      updated_at,
      business:businesses ( title ),
      buyer:profiles!enquiries_buyer_id_fkey ( full_name, phone )
    `,
    )
    .eq("id", enquiryId)
    .maybeSingle();

  if (error) {
    if (process.env.NODE_ENV === "development") {
      console.warn("[Bizora] fetchAdminEnquiryDetail failed:", error.message);
    }
    return { enquiry: null, error: FETCH_ERROR };
  }

  if (!data) {
    return { enquiry: null, error: null };
  }

  const [{ data: contact }, { data: notes }, { data: shares }] =
    await Promise.all([
      supabase
        .from("listing_seller_contacts")
        .select(
          "contact_name, mobile_e164, email, contact_type, sharing_authorised",
        )
        .eq("business_id", data.business_id)
        .maybeSingle(),
      supabase
        .from("enquiry_admin_notes")
        .select("notes")
        .eq("enquiry_id", enquiryId)
        .maybeSingle(),
      supabase
        .from("enquiry_contact_shares")
        .select("id, shared_at, note, shared_by")
        .eq("enquiry_id", enquiryId)
        .order("shared_at", { ascending: false }),
    ]);

  const adminIds = [
    ...new Set((shares ?? []).map((share) => share.shared_by).filter(Boolean)),
  ];
  const adminNameById = new Map<string, string>();
  if (adminIds.length > 0) {
    const { data: admins } = await supabase
      .from("profiles")
      .select("id, full_name")
      .in("id", adminIds);
    for (const admin of admins ?? []) {
      adminNameById.set(admin.id, admin.full_name?.trim() || "Admin");
    }
  }

  const business = data.business as { title: string } | null;
  const buyer = data.buyer as {
    full_name: string | null;
    phone: string | null;
  } | null;

  return {
    enquiry: {
      id: data.id,
      businessId: data.business_id,
      businessTitle: business?.title ?? "Listing",
      buyerId: data.buyer_id,
      buyerName: buyer?.full_name?.trim() || "Buyer",
      buyerPhone: buyer?.phone ?? null,
      // Auth email is not on profiles; leave null rather than inventing.
      buyerEmail: null,
      message: data.message,
      status: data.status as EnquiryStatus,
      sellerResponse: data.seller_response,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
      adminNotes: notes?.notes ?? "",
      sellerContact: {
        contactName: contact?.contact_name ?? null,
        mobileDisplay: contact?.mobile_e164
          ? formatListingContactPhone(contact.mobile_e164)
          : null,
        email: contact?.email ?? null,
        contactType: contact?.contact_type ?? null,
        contactTypeLabel: contactTypeLabel(contact?.contact_type ?? null),
        sharingAuthorised: contact?.sharing_authorised ?? false,
        exists: Boolean(contact),
      },
      contactShares: (shares ?? []).map((share) => ({
        id: share.id,
        sharedAt: share.shared_at,
        sharedByName: adminNameById.get(share.shared_by) ?? "Admin",
        note: share.note,
      })),
    },
    error: null,
  };
}
