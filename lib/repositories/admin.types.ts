import type { BusinessStatus } from "@/lib/supabase/database.types";
import type { BusinessDetailView } from "@/lib/repositories/businesses.types";

export type AdminListingSummary = {
  pending: number;
  published: number;
  rejected: number;
  total: number;
  draft: number;
  sold: number;
};

export type AdminListingQueueFilter =
  | "pending"
  | "published"
  | "rejected"
  | "all";

export type AdminListingQueueItem = {
  id: string;
  title: string;
  price: string | undefined;
  category: string;
  location: string;
  status: BusinessStatus;
  image: string;
  sellerName: string;
  submittedAt: string | null;
  updatedAt: string;
};

export type AdminListingDetail = BusinessDetailView & {
  status: BusinessStatus;
  rejectionReason: string | null;
  submittedAt: string | null;
  reviewedAt: string | null;
  reviewedBy: string | null;
  sellerId: string | null;
  sellerName: string;
  sellerPhone: string | null;
  sellerCompany: string | null;
  stateName: string | null;
  districtName: string | null;
  cityName: string | null;
  localityName: string | null;
  askingPriceRaw: number | null;
  annualRevenueRaw: number | null;
  annualProfitRaw: number | null;
  ebitdaRaw: number | null;
};
