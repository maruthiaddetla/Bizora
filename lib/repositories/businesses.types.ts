import type { BusinessRow } from "@/lib/supabase/database.types";
import type {
  FurnishedOption,
  ListingPurpose,
  ListingType,
  SpaceType,
} from "@/lib/listing-types";

export type BusinessImageRelation = {
  id?: string;
  image_url: string;
  storage_path?: string | null;
  sort_order: number;
  is_primary: boolean;
};

export type NamedRelation = {
  name: string;
};

export type CategoryRelation = {
  name: string;
  slug: string;
};

/** Row returned by business selects with location, category, and image joins */
export type BusinessWithRelations = BusinessRow & {
  category: CategoryRelation | null;
  state: NamedRelation | null;
  district: NamedRelation | null;
  city: NamedRelation | null;
  locality: NamedRelation | null;
  business_images: BusinessImageRelation[] | null;
};

export const BUSINESS_WITH_RELATIONS_SELECT = `
  *,
  category:categories ( name, slug ),
  state:states ( name ),
  district:districts ( name ),
  city:cities ( name ),
  locality:localities ( name ),
  business_images ( id, image_url, storage_path, sort_order, is_primary )
`;

export type BusinessDetailView = {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  location: string;
  category: string | null;
  categoryId: string | null;
  listingType: ListingType;
  askingPrice: string | undefined;
  annualRevenue: string | undefined;
  annualProfit: string | undefined;
  ebitda: string | undefined;
  establishedYear: number | null;
  employees: number | null;
  reasonForSale: string | null;
  images: string[];
  isPremium: boolean;
  isVerified: boolean;
  sellerId: string | null;
};

export type CommercialSpaceDetailView = BusinessDetailView & {
  listingType: "commercial_space";
  spaceType: SpaceType | null;
  spaceTypeLabel: string | null;
  listingPurpose: ListingPurpose | null;
  listingPurposeLabel: string | null;
  monthlyRent: string | undefined;
  securityDeposit: string | undefined;
  areaSqft: number | null;
  floor: string | null;
  floorLabel: string | null;
  parkingSpaces: number | null;
  furnished: FurnishedOption | null;
  furnishedLabel: string | null;
  leaseTermMonths: number | null;
  availableFrom: string | null;
  businessUsage: string | null;
};

export type ListingDetailView = BusinessDetailView | CommercialSpaceDetailView;

export function isCommercialSpaceDetail(
  detail: ListingDetailView,
): detail is CommercialSpaceDetailView {
  return detail.listingType === "commercial_space";
}

/** Seller dashboard listing row — separate from public Listing. */
export type SellerListingView = {
  id: string;
  title: string;
  price: string | undefined;
  location: string;
  category: string;
  image: string;
  status: BusinessRow["status"];
  listingType: ListingType;
  rejectionReason: string | null;
  updatedAt: string;
};

export type SellerListingSummary = {
  total: number;
  draft: number;
  pending: number;
  published: number;
  rejected: number;
  sold: number;
  business: number;
  commercialSpace: number;
};
