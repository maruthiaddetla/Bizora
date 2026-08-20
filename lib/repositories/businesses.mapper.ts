import type {
  BusinessDetailView,
  BusinessWithRelations,
  SellerListingView,
} from "@/lib/repositories/businesses.types";
import { resolveBusinessImageDisplayUrls } from "@/lib/business-images/resolve-url";
import { LISTING_PLACEHOLDER_IMAGE } from "@/lib/constants/images";
import { formatIndianCurrency, toNumber } from "@/lib/format/currency";
import type { Listing } from "@/lib/listings";

/** Locality, City, State — skips missing parts and duplicate names */
export function buildLocationLabel(business: BusinessWithRelations): string {
  const parts = [
    business.locality?.name,
    business.city?.name,
    business.state?.name,
  ].filter((part): part is string => Boolean(part));

  const unique: string[] = [];
  for (const part of parts) {
    if (!unique.includes(part)) unique.push(part);
  }

  return unique.length > 0 ? unique.join(", ") : "India";
}

export function getSortedImageRows(business: BusinessWithRelations) {
  return [...(business.business_images ?? [])].sort((a, b) => {
    if (a.is_primary !== b.is_primary) return a.is_primary ? -1 : 1;
    return a.sort_order - b.sort_order;
  });
}

/**
 * Resolve display URLs (external or signed Storage URLs).
 * Falls back to placeholder when none resolve.
 * Uses one Storage batch sign per business when multiple paths are present.
 */
export async function getSortedImageUrls(
  business: BusinessWithRelations,
): Promise<string[]> {
  const rows = getSortedImageRows(business);
  const urls = (await resolveBusinessImageDisplayUrls(rows)).filter(
    (url): url is string => Boolean(url),
  );

  return urls.length > 0 ? urls : [LISTING_PLACEHOLDER_IMAGE];
}

/**
 * Batch-map businesses to card listings with one Storage batch sign across
 * all images in the page result set.
 */
export async function mapBusinessesToListings(
  businesses: BusinessWithRelations[],
): Promise<Listing[]> {
  if (businesses.length === 0) return [];

  const rowGroups = businesses.map((business) => getSortedImageRows(business));
  const flatRows = rowGroups.flat();
  const flatUrls = await resolveBusinessImageDisplayUrls(flatRows);

  let offset = 0;
  return businesses.map((business, index) => {
    const count = rowGroups[index].length;
    const urls = flatUrls
      .slice(offset, offset + count)
      .filter((url): url is string => Boolean(url));
    offset += count;

    const images = urls.length > 0 ? urls : [LISTING_PLACEHOLDER_IMAGE];

    return {
      id: business.id,
      title: business.title,
      location: buildLocationLabel(business),
      price: formatIndianCurrency(toNumber(business.asking_price)),
      description: business.description ?? "",
      image: images[0],
      category: business.category?.name ?? "Business",
      premium: business.is_premium,
    };
  });
}

export async function mapBusinessToListing(
  business: BusinessWithRelations,
): Promise<Listing> {
  const [listing] = await mapBusinessesToListings([business]);
  return listing;
}

export async function mapBusinessToDetail(
  business: BusinessWithRelations,
): Promise<BusinessDetailView> {
  const images = await getSortedImageUrls(business);

  return {
    id: business.id,
    slug: business.slug,
    title: business.title,
    description: business.description,
    location: buildLocationLabel(business),
    category: business.category?.name ?? null,
    categoryId: business.category_id,
    askingPrice: formatIndianCurrency(toNumber(business.asking_price)),
    annualRevenue: formatIndianCurrency(toNumber(business.annual_revenue)),
    annualProfit: formatIndianCurrency(toNumber(business.annual_profit)),
    ebitda: formatIndianCurrency(toNumber(business.ebitda)),
    establishedYear: business.established_year,
    employees: business.employees,
    reasonForSale: business.reason_for_sale,
    images,
    isPremium: business.is_premium,
    isVerified: business.is_verified,
    sellerId: business.seller_id,
  };
}

export async function mapBusinessToSellerListing(
  business: BusinessWithRelations,
): Promise<SellerListingView> {
  const images = await getSortedImageUrls(business);

  return {
    id: business.id,
    title: business.title,
    price: formatIndianCurrency(toNumber(business.asking_price)),
    location: buildLocationLabel(business),
    category: business.category?.name ?? "Business",
    image: images[0],
    status: business.status,
    rejectionReason: business.rejection_reason,
    updatedAt: business.updated_at,
  };
}
