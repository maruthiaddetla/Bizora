import type { EnquiryRow } from "@/lib/supabase/database.types";

export type EnquiryStatus = EnquiryRow["status"];

export type EnquiryView = {
  id: string;
  businessId: string;
  businessTitle: string;
  buyerId: string;
  buyerName: string;
  sellerId: string;
  sellerName: string;
  message: string;
  status: EnquiryStatus;
  sellerResponse: string | null;
  createdAt: string;
  updatedAt: string;
  respondedAt: string | null;
};

export type EnquiryDetailView = EnquiryView;
