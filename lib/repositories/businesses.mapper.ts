import type { BusinessWithRelations } from "@/lib/repositories/businesses.types";
import { LISTING_PLACEHOLDER_IMAGE } from "@/lib/constants/images";
import { formatIndianCurrency } from "@/lib/format/currency";
import type { Listing } from "@/lib/listings";

function buildLocationLabel(business: BusinessWithRelations): string {
  const locality = business.locality?.name;
  const city = business.city?.name;
  const district = business.city?.district?.name;
  const state = business.city?.district?.state?.name;

  const parts = [locality, city, district, state].filter(Boolean);
  const unique = [...new Set(parts)];

  return unique.length > 0 ? unique.join(", ") : "India";
}

function pickPrimaryImageUrl(business: BusinessWithRelations): string {
  const images = business.business_images ?? [];
  if (images.length === 0) {
    return LISTING_PLACEHOLDER_IMAGE;
  }

  const sorted = [...images].sort((a, b) => a.sort_order - b.sort_order);
  const primary = sorted.find((image) => image.is_primary) ?? sorted[0];
  return primary?.image_url || LISTING_PLACEHOLDER_IMAGE;
}

export function mapBusinessToListing(business: BusinessWithRelations): Listing {
  return {
    id: business.id,
    title: business.title,
    location: buildLocationLabel(business),
    price: formatIndianCurrency(
      typeof business.asking_price === "string"
        ? Number(business.asking_price)
        : business.asking_price,
    ),
    description: business.description ?? "",
    image: pickPrimaryImageUrl(business),
    category: business.category?.name ?? "Business",
    premium: business.is_premium,
  };
}
