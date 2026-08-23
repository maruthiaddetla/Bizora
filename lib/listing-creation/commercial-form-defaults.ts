import type { CommercialSpaceFormDefaults } from "@/components/listings/CommercialSpaceFormDefaults";

function numberToFormValue(value: number | null | undefined): string {
  if (value == null) return "";
  return String(value);
}

export function commercialDefaultsFromRow(row: {
  id: string;
  title: string;
  description: string | null;
  category_id: string | null;
  state_id: string | null;
  district_id: string | null;
  city_id: string | null;
  locality_id: string | null;
  space_type: string | null;
  listing_purpose: string | null;
  monthly_rent: number | null;
  security_deposit: number | null;
  area_sqft: number | null;
  floor: string | null;
  parking_spaces: number | null;
  furnished: string | null;
  lease_term_months: number | null;
  available_from: string | null;
  business_usage: string | null;
}): CommercialSpaceFormDefaults {
  return {
    listingId: row.id,
    title: row.title,
    description: row.description ?? "",
    categoryId: row.category_id,
    stateId: row.state_id,
    districtId: row.district_id,
    cityId: row.city_id,
    localityId: row.locality_id,
    spaceType: row.space_type,
    listingPurpose: row.listing_purpose,
    monthlyRent: numberToFormValue(row.monthly_rent),
    securityDeposit: numberToFormValue(row.security_deposit),
    areaSqft: numberToFormValue(row.area_sqft),
    floor: row.floor ?? "",
    parkingSpaces: numberToFormValue(row.parking_spaces),
    furnished: row.furnished,
    leaseTermMonths: numberToFormValue(row.lease_term_months),
    availableFrom: row.available_from ?? "",
    businessUsage: row.business_usage ?? "",
  };
}
