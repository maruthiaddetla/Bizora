export const LISTING_TYPES = ["business", "commercial_space"] as const;
export type ListingType = (typeof LISTING_TYPES)[number];
export const DEFAULT_LISTING_TYPE: ListingType = "business";

export const SPACE_TYPES = [
  "retail_shop",
  "restaurant_cafe",
  "office",
  "warehouse",
  "industrial",
  "commercial_land",
  "other",
] as const;
export type SpaceType = (typeof SPACE_TYPES)[number];

export const LISTING_PURPOSES = ["rent", "lease"] as const;
export type ListingPurpose = (typeof LISTING_PURPOSES)[number];

export const FURNISHED_OPTIONS = [
  "furnished",
  "semi_furnished",
  "unfurnished",
  "not_applicable",
] as const;
export type FurnishedOption = (typeof FURNISHED_OPTIONS)[number];

export const COMMERCIAL_SPACES_PARENT_SLUG = "commercial-spaces";

export const SPACE_TYPE_LABELS: Record<SpaceType, string> = {
  retail_shop: "Retail / Shop",
  restaurant_cafe: "Restaurant / Café",
  office: "Office",
  warehouse: "Warehouse",
  industrial: "Industrial",
  commercial_land: "Commercial Land",
  other: "Other",
};

export const LISTING_PURPOSE_LABELS: Record<ListingPurpose, string> = {
  rent: "Rent",
  lease: "Lease",
};

export const FURNISHED_LABELS: Record<FurnishedOption, string> = {
  furnished: "Furnished",
  semi_furnished: "Semi-furnished",
  unfurnished: "Unfurnished",
  not_applicable: "Not applicable",
};

export const LISTING_TYPE_LABELS: Record<ListingType, string> = {
  business: "Business",
  commercial_space: "Commercial Space",
};

export function isListingType(value: string | undefined): value is ListingType {
  return value === "business" || value === "commercial_space";
}

export function isSpaceType(value: string | undefined): value is SpaceType {
  return SPACE_TYPES.includes(value as SpaceType);
}

export function isListingPurpose(
  value: string | undefined,
): value is ListingPurpose {
  return value === "rent" || value === "lease";
}

export function isFurnishedOption(
  value: string | undefined,
): value is FurnishedOption {
  return FURNISHED_OPTIONS.includes(value as FurnishedOption);
}

export function formatFloorLabel(floor: string | null | undefined): string | null {
  if (!floor?.trim()) return null;
  const normalized = floor.trim();
  if (/^\d+$/.test(normalized)) {
    const n = Number.parseInt(normalized, 10);
    if (n === 0) return "Ground Floor";
    if (n === 1) return "1st Floor";
    if (n === 2) return "2nd Floor";
    if (n === 3) return "3rd Floor";
    return `${n}th Floor`;
  }
  return normalized;
}
