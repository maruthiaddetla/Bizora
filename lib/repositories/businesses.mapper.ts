import type {
  BusinessDetailView,
  BusinessWithRelations,
  SellerListingView,
} from "@/lib/repositories/businesses.types";
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

export function getSortedImageUrls(business: BusinessWithRelations): string[] {
  const images = [...(business.business_images ?? [])].sort((a, b) => {
    if (a.is_primary !== b.is_primary) return a.is_primary ? -1 : 1;
    return a.sort_order - b.sort_order;
  });

  const urls = images
    .map((image) => image.image_url)
    .filter((url): url is string => Boolean(url));

  return urls.length > 0 ? urls : [LISTING_PLACEHOLDER_IMAGE];
}

export function mapBusinessToListing(business: BusinessWithRelations): Listing {
  const images = getSortedImageUrls(business);

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
}

export function mapBusinessToDetail(
  business: BusinessWithRelations,
): BusinessDetailView {
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
    images: getSortedImageUrls(business),
    isPremium: business.is_premium,
    isVerified: business.is_verified,
  };
}

export function mapBusinessToSellerListing(
  business: BusinessWithRelations,
): SellerListingView {
  const images = getSortedImageUrls(business);

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
