import type { BusinessRow } from "@/lib/supabase/database.types";

export type BusinessImageRelation = {
  image_url: string;
  sort_order: number;
  is_primary: boolean;
};

export type StateRelation = {
  name: string;
};

export type DistrictRelation = {
  name: string;
  state: StateRelation | null;
};

export type CityRelation = {
  name: string;
  district: DistrictRelation | null;
};

export type LocalityRelation = {
  name: string;
};

export type CategoryRelation = {
  name: string;
  slug: string;
};

/** Row returned by the featured-business Supabase select with joins */
export type BusinessWithRelations = BusinessRow & {
  category: CategoryRelation | null;
  city: CityRelation | null;
  locality: LocalityRelation | null;
  business_images: BusinessImageRelation[] | null;
};

export const FEATURED_PREMIUM_BUSINESS_SELECT = `
  *,
  category:categories ( name, slug ),
  city:cities (
    name,
    district:districts (
      name,
      state:states ( name )
    )
  ),
  locality:localities ( name ),
  business_images ( image_url, sort_order, is_primary )
`;
