/**
 * Temporary sample data for homepage search UI.
 * Replace with Supabase-backed location and category tables.
 */

export type LocationSelection = {
  state: string | null;
  district: string | null;
  city: string | null;
  locality: string | null;
};

export type SampleCity = {
  name: string;
  localities: string[];
};

export type SampleDistrict = {
  name: string;
  cities: SampleCity[];
};

export type SampleState = {
  name: string;
  districts: SampleDistrict[];
};

export const SAMPLE_COUNTRY = "India";

export const SAMPLE_LOCATION_TREE: SampleState[] = [
  {
    name: "Telangana",
    districts: [
      {
        name: "Hyderabad",
        cities: [
          { name: "Hyderabad", localities: ["Gachibowli", "Madhapur"] },
          { name: "Secunderabad", localities: [] },
        ],
      },
    ],
  },
  {
    name: "Andhra Pradesh",
    districts: [
      {
        name: "Visakhapatnam",
        cities: [{ name: "Visakhapatnam", localities: [] }],
      },
      {
        name: "Krishna",
        cities: [{ name: "Vijayawada", localities: [] }],
      },
    ],
  },
];

export const SEARCH_CATEGORIES = [
  "Restaurant & Food",
  "Retail",
  "Healthcare",
  "Education",
  "Manufacturing",
  "IT & Technology",
  "Services",
  "Beauty & Wellness",
  "Automotive",
  "Construction",
] as const;

export type SearchCategory = (typeof SEARCH_CATEGORIES)[number];

/** Chips shown below the search box — subset of SEARCH_CATEGORIES */
export const POPULAR_SEARCH_CATEGORIES: SearchCategory[] = [
  "Restaurant & Food",
  "Retail",
  "Healthcare",
  "Manufacturing",
  "IT & Technology",
];

export const EMPTY_LOCATION: LocationSelection = {
  state: null,
  district: null,
  city: null,
  locality: null,
};

export function formatLocationSelection(selection: LocationSelection): string {
  const parts = [
    selection.locality,
    selection.city,
    selection.district,
    selection.state,
    SAMPLE_COUNTRY,
  ].filter(Boolean);
  return parts.length > 1 ? parts.join(", ") : "Select location";
}

export function isLocationEmpty(selection: LocationSelection): boolean {
  return !selection.state;
}
