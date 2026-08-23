import {
  buildLocationLabel,
  getSortedImageUrls,
  mapBusinessToDetail,
} from "@/lib/repositories/businesses.mapper";
import type { BusinessWithRelations } from "@/lib/repositories/businesses.types";
import type {
  AdminListingDetail,
  AdminListingQueueFilter,
  AdminListingQueueItem,
  AdminListingSummary,
} from "@/lib/repositories/admin.types";
import { formatIndianCurrency, toNumber } from "@/lib/format/currency";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { BusinessStatus } from "@/lib/supabase/database.types";

const ADMIN_FETCH_ERROR =
  "We couldn't load admin listings right now. Please try again shortly.";

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

type AdminBusinessRow = BusinessWithRelations & {
  seller: {
    id: string;
    full_name: string | null;
    phone: string | null;
    company_name: string | null;
  } | null;
};

const ADMIN_BUSINESS_SELECT = `
  *,
  category:categories ( name, slug ),
  state:states ( name ),
  district:districts ( name ),
  city:cities ( name ),
  locality:localities ( name ),
  business_images ( id, image_url, storage_path, sort_order, is_primary ),
  seller:profiles!businesses_seller_id_fkey ( id, full_name, phone, company_name )
`;

function isUuid(value: string): boolean {
  return UUID_PATTERN.test(value);
}

function emptySummary(): AdminListingSummary {
  return {
    pending: 0,
    published: 0,
    rejected: 0,
    total: 0,
    draft: 0,
    sold: 0,
  };
}

function sellerDisplayName(
  seller: AdminBusinessRow["seller"],
  fallback = "Unknown seller",
): string {
  const name = seller?.full_name?.trim();
  if (name) return name;
  return fallback;
}

export async function fetchAdminListingSummary(): Promise<{
  summary: AdminListingSummary;
  error: string | null;
}> {
  const supabase = await createSupabaseServerClient();
  if (!supabase) {
    return { summary: emptySummary(), error: ADMIN_FETCH_ERROR };
  }

  const { data, error } = await supabase.from("businesses").select("status");

  if (error) {
    if (process.env.NODE_ENV === "development") {
      console.warn("[Bizora] fetchAdminListingSummary failed:", error.message);
    }
    return { summary: emptySummary(), error: ADMIN_FETCH_ERROR };
  }

  const summary = emptySummary();
  summary.total = data?.length ?? 0;

  for (const row of data ?? []) {
    if (row.status === "pending") summary.pending += 1;
    else if (row.status === "published") summary.published += 1;
    else if (row.status === "rejected") summary.rejected += 1;
    else if (row.status === "draft") summary.draft += 1;
    else if (row.status === "sold") summary.sold += 1;
  }

  return { summary, error: null };
}

export async function fetchAdminListings(
  filter: AdminListingQueueFilter = "pending",
): Promise<{
  listings: AdminListingQueueItem[];
  error: string | null;
}> {
  const supabase = await createSupabaseServerClient();
  if (!supabase) {
    return { listings: [], error: ADMIN_FETCH_ERROR };
  }

  let query = supabase.from("businesses").select(ADMIN_BUSINESS_SELECT);

  if (filter !== "all") {
    query = query.eq("status", filter);
  }

  if (filter === "pending") {
    query = query.order("submitted_at", {
      ascending: false,
      nullsFirst: false,
    });
  } else {
    query = query.order("updated_at", { ascending: false });
  }

  const { data, error } = await query;

  if (error) {
    if (process.env.NODE_ENV === "development") {
      console.warn("[Bizora] fetchAdminListings failed:", error.message);
    }
    return { listings: [], error: ADMIN_FETCH_ERROR };
  }

  const rows = (data ?? []) as unknown as AdminBusinessRow[];

  const sorted =
    filter === "all"
      ? [...rows].sort((a, b) => {
          const rank = (status: BusinessStatus) => {
            if (status === "pending") return 0;
            if (status === "rejected") return 1;
            return 2;
          };
          const rankDiff = rank(a.status) - rank(b.status);
          if (rankDiff !== 0) return rankDiff;
          const aTime = a.submitted_at ? Date.parse(a.submitted_at) : 0;
          const bTime = b.submitted_at ? Date.parse(b.submitted_at) : 0;
          return bTime - aTime;
        })
      : rows;

  const listings: AdminListingQueueItem[] = await Promise.all(
    sorted.map(async (row) => {
      const images = await getSortedImageUrls(row);
      const listingType = row.listing_type ?? "business";
      const price =
        listingType === "commercial_space"
          ? row.monthly_rent
            ? `${formatIndianCurrency(toNumber(row.monthly_rent))} / mo`
            : undefined
          : formatIndianCurrency(toNumber(row.asking_price));

      return {
        id: row.id,
        title: row.title,
        price,
        category: row.category?.name ?? "Listing",
        location: buildLocationLabel(row),
        status: row.status,
        listingType,
        image: images[0],
        sellerName: sellerDisplayName(row.seller),
        submittedAt: row.submitted_at,
        updatedAt: row.updated_at,
      };
    }),
  );

  return { listings, error: null };
}

export async function fetchAdminBusinessById(id: string): Promise<{
  listing: AdminListingDetail | null;
  error: string | null;
}> {
  if (!isUuid(id)) {
    return { listing: null, error: null };
  }

  const supabase = await createSupabaseServerClient();
  if (!supabase) {
    return { listing: null, error: ADMIN_FETCH_ERROR };
  }

  const { data, error } = await supabase
    .from("businesses")
    .select(ADMIN_BUSINESS_SELECT)
    .eq("id", id)
    .maybeSingle();

  if (error) {
    if (process.env.NODE_ENV === "development") {
      console.warn("[Bizora] fetchAdminBusinessById failed:", error.message);
    }
    return { listing: null, error: ADMIN_FETCH_ERROR };
  }

  if (!data) {
    return { listing: null, error: null };
  }

  const row = data as unknown as AdminBusinessRow;
  const detail = await mapBusinessToDetail(row);

  return {
    listing: {
      ...detail,
      status: row.status,
      rejectionReason: row.rejection_reason,
      submittedAt: row.submitted_at,
      reviewedAt: row.reviewed_at,
      reviewedBy: row.reviewed_by,
      sellerId: row.seller_id,
      sellerName: sellerDisplayName(row.seller),
      sellerPhone: row.seller?.phone ?? null,
      sellerCompany: row.seller?.company_name ?? null,
      stateName: row.state?.name ?? null,
      districtName: row.district?.name ?? null,
      cityName: row.city?.name ?? null,
      localityName: row.locality?.name ?? null,
      askingPriceRaw: toNumber(row.asking_price) ?? null,
      annualRevenueRaw: toNumber(row.annual_revenue) ?? null,
      annualProfitRaw: toNumber(row.annual_profit) ?? null,
      ebitdaRaw: toNumber(row.ebitda) ?? null,
    },
    error: null,
  };
}
