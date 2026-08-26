export type ListingFormDefaults = {
  listingId?: string;
  title?: string;
  description?: string;
  categoryId?: string | null;
  stateId?: string | null;
  districtId?: string | null;
  cityId?: string | null;
  /** Optional free-text locality; prefers locality_name, else legacy localities.name */
  locality?: string;
  askingPrice?: string;
  annualRevenue?: string;
  annualProfit?: string;
  ebitda?: string;
  establishedYear?: string;
  employees?: string;
  reasonForSale?: string;
};
