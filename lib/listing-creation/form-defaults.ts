import type { ListingFormDefaults } from "@/components/listings/ListingFormDefaults";

function numberToFormValue(value: number | null | undefined): string {
  if (value == null) return "";
  return String(value);
}

export function listingDefaultsFromRow(row: {
  id: string;
  title: string;
  description: string | null;
  category_id: string | null;
  state_id: string | null;
  district_id: string | null;
  city_id: string | null;
  locality_id: string | null;
  asking_price: number | null;
  annual_revenue: number | null;
  annual_profit: number | null;
  ebitda: number | null;
  established_year: number | null;
  employees: number | null;
  reason_for_sale: string | null;
}): ListingFormDefaults {
  return {
    listingId: row.id,
    title: row.title,
    description: row.description ?? "",
    categoryId: row.category_id,
    stateId: row.state_id,
    districtId: row.district_id,
    cityId: row.city_id,
    localityId: row.locality_id,
    askingPrice: numberToFormValue(row.asking_price),
    annualRevenue: numberToFormValue(row.annual_revenue),
    annualProfit: numberToFormValue(row.annual_profit),
    ebitda: numberToFormValue(row.ebitda),
    establishedYear: numberToFormValue(row.established_year),
    employees: numberToFormValue(row.employees),
    reasonForSale: row.reason_for_sale ?? "",
  };
}
