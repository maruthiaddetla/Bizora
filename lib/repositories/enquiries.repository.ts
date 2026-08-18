import type { EnquiryDetailView, EnquiryView } from "@/lib/repositories/enquiries.types";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const ENQUIRY_FETCH_ERROR =
  "We couldn't load enquiries right now. Please try again shortly.";

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const ENQUIRY_WITH_RELATIONS_SELECT = `
  id,
  business_id,
  buyer_id,
  seller_id,
  message,
  status,
  seller_response,
  created_at,
  updated_at,
  responded_at,
  business:businesses ( title ),
  buyer:profiles!enquiries_buyer_id_fkey ( full_name ),
  seller:profiles!enquiries_seller_id_fkey ( full_name )
`;

type EnquiryRowWithRelations = {
  id: string;
  business_id: string;
  buyer_id: string;
  seller_id: string;
  message: string;
  status: EnquiryView["status"];
  seller_response: string | null;
  created_at: string;
  updated_at: string;
  responded_at: string | null;
  business: { title: string } | null;
  buyer: { full_name: string | null } | null;
  seller: { full_name: string | null } | null;
};

function isUuid(value: string): boolean {
  return UUID_PATTERN.test(value);
}

function mapEnquiryRow(row: EnquiryRowWithRelations): EnquiryView {
  return {
    id: row.id,
    businessId: row.business_id,
    businessTitle: row.business?.title ?? "Business",
    buyerId: row.buyer_id,
    buyerName: row.buyer?.full_name?.trim() || "Buyer",
    sellerId: row.seller_id,
    sellerName: row.seller?.full_name?.trim() || "Seller",
    message: row.message,
    status: row.status,
    sellerResponse: row.seller_response,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    respondedAt: row.responded_at,
  };
}

export async function fetchBuyerEnquiries(
  buyerId: string,
): Promise<{ enquiries: EnquiryView[]; error: string | null }> {
  if (!isUuid(buyerId)) {
    return { enquiries: [], error: ENQUIRY_FETCH_ERROR };
  }

  const supabase = await createSupabaseServerClient();
  if (!supabase) {
    return { enquiries: [], error: ENQUIRY_FETCH_ERROR };
  }

  const { data, error } = await supabase
    .from("enquiries")
    .select(ENQUIRY_WITH_RELATIONS_SELECT)
    .eq("buyer_id", buyerId)
    .order("created_at", { ascending: false });

  if (error) {
    if (process.env.NODE_ENV === "development") {
      console.warn("[Bizora] fetchBuyerEnquiries failed:", error.message);
    }
    return { enquiries: [], error: ENQUIRY_FETCH_ERROR };
  }

  return {
    enquiries: (data ?? []).map((row) =>
      mapEnquiryRow(row as unknown as EnquiryRowWithRelations),
    ),
    error: null,
  };
}

export async function fetchSellerEnquiries(
  sellerId: string,
): Promise<{ enquiries: EnquiryView[]; error: string | null }> {
  if (!isUuid(sellerId)) {
    return { enquiries: [], error: ENQUIRY_FETCH_ERROR };
  }

  const supabase = await createSupabaseServerClient();
  if (!supabase) {
    return { enquiries: [], error: ENQUIRY_FETCH_ERROR };
  }

  const { data, error } = await supabase
    .from("enquiries")
    .select(ENQUIRY_WITH_RELATIONS_SELECT)
    .eq("seller_id", sellerId)
    .order("created_at", { ascending: false });

  if (error) {
    if (process.env.NODE_ENV === "development") {
      console.warn("[Bizora] fetchSellerEnquiries failed:", error.message);
    }
    return { enquiries: [], error: ENQUIRY_FETCH_ERROR };
  }

  return {
    enquiries: (data ?? []).map((row) =>
      mapEnquiryRow(row as unknown as EnquiryRowWithRelations),
    ),
    error: null,
  };
}

export async function fetchEnquiryByIdForParticipant(
  enquiryId: string,
  userId: string,
): Promise<{ enquiry: EnquiryDetailView | null; error: string | null }> {
  if (!isUuid(enquiryId) || !isUuid(userId)) {
    return { enquiry: null, error: null };
  }

  const supabase = await createSupabaseServerClient();
  if (!supabase) {
    return { enquiry: null, error: ENQUIRY_FETCH_ERROR };
  }

  const { data, error } = await supabase
    .from("enquiries")
    .select(ENQUIRY_WITH_RELATIONS_SELECT)
    .eq("id", enquiryId)
    .or(`buyer_id.eq.${userId},seller_id.eq.${userId}`)
    .maybeSingle();

  if (error) {
    if (process.env.NODE_ENV === "development") {
      console.warn(
        "[Bizora] fetchEnquiryByIdForParticipant failed:",
        error.message,
      );
    }
    return { enquiry: null, error: ENQUIRY_FETCH_ERROR };
  }

  if (!data) {
    return { enquiry: null, error: null };
  }

  return {
    enquiry: mapEnquiryRow(data as unknown as EnquiryRowWithRelations),
    error: null,
  };
}

export async function fetchPublishedBusinessForEnquiry(
  businessId: string,
): Promise<{
  business: { id: string; seller_id: string | null; status: string } | null;
  error: string | null;
}> {
  if (!isUuid(businessId)) {
    return { business: null, error: null };
  }

  const supabase = await createSupabaseServerClient();
  if (!supabase) {
    return { business: null, error: ENQUIRY_FETCH_ERROR };
  }

  const { data, error } = await supabase
    .from("businesses")
    .select("id, seller_id, status")
    .eq("id", businessId)
    .eq("status", "published")
    .maybeSingle();

  if (error) {
    if (process.env.NODE_ENV === "development") {
      console.warn(
        "[Bizora] fetchPublishedBusinessForEnquiry failed:",
        error.message,
      );
    }
    return { business: null, error: ENQUIRY_FETCH_ERROR };
  }

  return { business: data, error: null };
}

export async function hasRecentEnquiry(
  buyerId: string,
  businessId: string,
  withinSeconds = 60,
): Promise<boolean> {
  const supabase = await createSupabaseServerClient();
  if (!supabase) return false;

  const since = new Date(Date.now() - withinSeconds * 1000).toISOString();

  const { count, error } = await supabase
    .from("enquiries")
    .select("id", { count: "exact", head: true })
    .eq("buyer_id", buyerId)
    .eq("business_id", businessId)
    .gte("created_at", since);

  if (error) return false;
  return (count ?? 0) > 0;
}
