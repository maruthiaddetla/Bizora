import type {
  BusinessDetailView,
  BusinessWithRelations,
  CommercialSpaceDetailView,
  ListingDetailView,
  SellerListingView,
} from "@/lib/repositories/businesses.types";
import { resolveListingImageDelivery } from "@/lib/business-images/public-media-policy";
import { resolvePublicListingImageUrl } from "@/lib/business-images/public-media-url";
import { resolveBusinessImageDisplayUrls } from "@/lib/business-images/resolve-url";
import { LISTING_PLACEHOLDER_IMAGE } from "@/lib/constants/images";
import { formatIndianCurrency, toNumber } from "@/lib/format/currency";
import {
  formatFloorLabel,
  FURNISHED_LABELS,
  LISTING_PURPOSE_LABELS,
  SPACE_TYPE_LABELS,
  type FurnishedOption,
  type ListingPurpose,
  type ListingType,
  type SpaceType,
} from "@/lib/listing-types";
import type { Listing } from "@/lib/listings";

/** Locality, City, State — skips missing parts and duplicate names */
export function buildLocationLabel(business: BusinessWithRelations): string {
  const localityLabel =
    business.locality_name?.trim() || business.locality?.name || null;
  const parts = [
    localityLabel,
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
 * Resolve display URLs for public pages (stable media proxy) or signed URLs.
 * Public proxy is used only for published listings; all other statuses are signed.
 * Falls back to placeholder when none resolve.
 */
export async function getSortedImageUrls(
  business: BusinessWithRelations,
  options?: { delivery?: "public" | "signed" },
): Promise<string[]> {
  const rows = getSortedImageRows(business);
  const delivery = resolveListingImageDelivery({
    listingStatus: business.status,
    delivery: options?.delivery,
  });

  if (delivery === "public") {
    const missing: typeof rows = [];
    const urls: (string | null)[] = rows.map((row) => {
      const publicUrl = resolvePublicListingImageUrl(row, {
        listingStatus: business.status,
      });
      if (publicUrl) return publicUrl;
      missing.push(row);
      return null;
    });

    if (missing.length > 0) {
      const signed = await resolveBusinessImageDisplayUrls(missing);
      let signedIndex = 0;
      for (let i = 0; i < urls.length; i += 1) {
        if (urls[i] == null) {
          urls[i] = signed[signedIndex] ?? null;
          signedIndex += 1;
        }
      }
    }

    const resolved = urls.filter((url): url is string => Boolean(url));
    return resolved.length > 0 ? resolved : [LISTING_PLACEHOLDER_IMAGE];
  }

  const urls = (await resolveBusinessImageDisplayUrls(rows)).filter(
    (url): url is string => Boolean(url),
  );

  return urls.length > 0 ? urls : [LISTING_PLACEHOLDER_IMAGE];
}

function mapCommercialCardFields(
  business: BusinessWithRelations,
): Pick<
  Listing,
  | "listingType"
  | "monthlyRent"
  | "areaSqft"
  | "spaceType"
  | "spaceTypeLabel"
  | "floor"
  | "parkingSpaces"
  | "price"
> {
  const spaceType = business.space_type as SpaceType | null;
  return {
    listingType: "commercial_space",
    monthlyRent: business.monthly_rent
      ? `${formatIndianCurrency(toNumber(business.monthly_rent))} / month`
      : undefined,
    areaSqft: business.area_sqft,
    spaceType,
    spaceTypeLabel: spaceType ? SPACE_TYPE_LABELS[spaceType] : null,
    floor: formatFloorLabel(business.floor),
    parkingSpaces: business.parking_spaces,
    price: business.monthly_rent
      ? `${formatIndianCurrency(toNumber(business.monthly_rent))} / month`
      : undefined,
  };
}

function mapBusinessCardFields(
  business: BusinessWithRelations,
): Pick<
  Listing,
  "listingType" | "price" | "annualRevenue" | "annualProfit" | "employees"
> {
  return {
    listingType: "business",
    price: formatIndianCurrency(toNumber(business.asking_price)),
    annualRevenue: formatIndianCurrency(toNumber(business.annual_revenue)),
    annualProfit: formatIndianCurrency(toNumber(business.annual_profit)),
    employees: business.employees,
  };
}

/**
 * Batch-map businesses to card listings.
 * Published → stable public proxy URLs; other statuses → signed URLs.
 */
export async function mapBusinessesToListings(
  businesses: BusinessWithRelations[],
): Promise<Listing[]> {
  if (businesses.length === 0) return [];

  const rowGroups = businesses.map((business) => getSortedImageRows(business));
  const flatRows: Array<{
    row: (typeof rowGroups)[number][number];
    status: BusinessWithRelations["status"];
  }> = [];
  businesses.forEach((business, index) => {
    for (const row of rowGroups[index]) {
      flatRows.push({ row, status: business.status });
    }
  });

  const flatUrls: (string | null)[] = flatRows.map(({ row, status }) =>
    resolvePublicListingImageUrl(row, { listingStatus: status }),
  );
  const needSignIndexes: number[] = [];
  const needSignRows: (typeof rowGroups)[number] = [];
  flatUrls.forEach((url, index) => {
    if (!url) {
      needSignIndexes.push(index);
      needSignRows.push(flatRows[index].row);
    }
  });
  if (needSignRows.length > 0) {
    const signed = await resolveBusinessImageDisplayUrls(needSignRows);
    needSignIndexes.forEach((flatIndex, i) => {
      flatUrls[flatIndex] = signed[i] ?? null;
    });
  }

  let offset = 0;
  return businesses.map((business, index) => {
    const count = rowGroups[index].length;
    const urls = flatUrls
      .slice(offset, offset + count)
      .filter((url): url is string => Boolean(url));
    offset += count;

    const images = urls.length > 0 ? urls : [LISTING_PLACEHOLDER_IMAGE];
    const listingType = (business.listing_type ?? "business") as ListingType;
    const typeFields =
      listingType === "commercial_space"
        ? mapCommercialCardFields(business)
        : mapBusinessCardFields(business);

    return {
      id: business.id,
      title: business.title,
      location: buildLocationLabel(business),
      description: business.description ?? "",
      image: images[0],
      category: business.category?.name ?? "Listing",
      premium: business.is_premium,
      ...typeFields,
    };
  });
}

export async function mapBusinessToListing(
  business: BusinessWithRelations,
): Promise<Listing> {
  const [listing] = await mapBusinessesToListings([business]);
  return listing;
}

function mapBaseDetail(
  business: BusinessWithRelations,
  images: string[],
): BusinessDetailView {
  return {
    id: business.id,
    slug: business.slug,
    title: business.title,
    description: business.description,
    location: buildLocationLabel(business),
    category: business.category?.name ?? null,
    categoryId: business.category_id,
    listingType: (business.listing_type ?? "business") as ListingType,
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

export async function mapBusinessToDetail(
  business: BusinessWithRelations,
  options?: { delivery?: "public" | "signed" },
): Promise<ListingDetailView> {
  const images = await getSortedImageUrls(business, options);
  const base = mapBaseDetail(business, images);

  if (base.listingType === "commercial_space") {
    const spaceType = business.space_type as SpaceType | null;
    const listingPurpose = business.listing_purpose as ListingPurpose | null;
    const furnished = business.furnished as FurnishedOption | null;

    const commercial: CommercialSpaceDetailView = {
      ...base,
      listingType: "commercial_space",
      spaceType,
      spaceTypeLabel: spaceType ? SPACE_TYPE_LABELS[spaceType] : null,
      listingPurpose,
      listingPurposeLabel: listingPurpose
        ? LISTING_PURPOSE_LABELS[listingPurpose]
        : null,
      monthlyRent: formatIndianCurrency(toNumber(business.monthly_rent)),
      securityDeposit: formatIndianCurrency(toNumber(business.security_deposit)),
      areaSqft: business.area_sqft,
      floor: business.floor,
      floorLabel: formatFloorLabel(business.floor),
      parkingSpaces: business.parking_spaces,
      furnished,
      furnishedLabel: furnished ? FURNISHED_LABELS[furnished] : null,
      leaseTermMonths: business.lease_term_months,
      availableFrom: business.available_from,
      businessUsage: business.business_usage,
    };
    return commercial;
  }

  return base;
}

export async function mapBusinessToSellerListing(
  business: BusinessWithRelations,
  revision?: {
    id: string;
    status: BusinessWithRelations["status"];
    rejectionReason?: string | null;
  } | null,
): Promise<SellerListingView> {
  // Owner dashboard — always signed so draft/pending/rejected/closed never hit the public proxy.
  const images = await getSortedImageUrls(business, { delivery: "signed" });
  const listingType = (business.listing_type ?? "business") as ListingType;

  const price =
    listingType === "commercial_space"
      ? business.monthly_rent
        ? `${formatIndianCurrency(toNumber(business.monthly_rent))} / mo`
        : undefined
      : formatIndianCurrency(toNumber(business.asking_price));

  return {
    id: business.id,
    title: business.title,
    price,
    location: buildLocationLabel(business),
    category: business.category?.name ?? "Listing",
    image: images[0],
    status: business.status,
    listingType,
    rejectionReason:
      revision?.rejectionReason ?? business.rejection_reason ?? null,
    updatedAt: business.updated_at,
    revisionId: revision?.id ?? null,
    revisionStatus: revision?.status ?? null,
  };
}
