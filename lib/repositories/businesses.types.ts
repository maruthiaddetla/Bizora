import type { BusinessRow } from "@/lib/supabase/database.types";

export type BusinessImageRelation = {
  image_url: string;
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
  business_images ( image_url, sort_order, is_primary )
`;

export type BusinessDetailView = {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  location: string;
  category: string | null;
  categoryId: string | null;
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
};
