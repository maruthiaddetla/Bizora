import { createSupabaseServerClient } from "@/lib/supabase/server";

export type LocationOption = {
  id: string;
  name: string;
};

/** City option with its parent district for internal FK resolution (not shown in UI). */
export type CityOption = LocationOption & {
  districtId: string;
};

export async function fetchStates(): Promise<LocationOption[]> {
  const supabase = await createSupabaseServerClient();
  if (!supabase) return [];

  const { data, error } = await supabase
    .from("states")
    .select("id, name")
    .order("name", { ascending: true });

  if (error || !data) {
    if (error && process.env.NODE_ENV === "development") {
      console.warn("[Bizora] fetchStates failed:", error.message);
    }
    return [];
  }

  return data;
}

export async function fetchDistricts(stateId: string): Promise<LocationOption[]> {
  if (!stateId) return [];

  const supabase = await createSupabaseServerClient();
  if (!supabase) return [];

  const { data, error } = await supabase
    .from("districts")
    .select("id, name")
    .eq("state_id", stateId)
    .order("name", { ascending: true });

  if (error || !data) {
    if (error && process.env.NODE_ENV === "development") {
      console.warn("[Bizora] fetchDistricts failed:", error.message);
    }
    return [];
  }

  return data;
}

export async function fetchCities(districtId: string): Promise<LocationOption[]> {
  if (!districtId) return [];

  const supabase = await createSupabaseServerClient();
  if (!supabase) return [];

  const { data, error } = await supabase
    .from("cities")
    .select("id, name")
    .eq("district_id", districtId)
    .order("name", { ascending: true });

  if (error || !data) {
    if (error && process.env.NODE_ENV === "development") {
      console.warn("[Bizora] fetchCities failed:", error.message);
    }
    return [];
  }

  return data;
}

/**
 * Cities for a state (via districts). Used by the user-facing State → City cascade.
 * District remains in the DB hierarchy but is not selected by the user.
 */
export async function fetchCitiesByState(
  stateId: string,
): Promise<CityOption[]> {
  if (!stateId) return [];

  const districts = await fetchDistricts(stateId);
  if (districts.length === 0) return [];

  const supabase = await createSupabaseServerClient();
  if (!supabase) return [];

  const { data, error } = await supabase
    .from("cities")
    .select("id, name, district_id")
    .in(
      "district_id",
      districts.map((district) => district.id),
    )
    .order("name", { ascending: true });

  if (error || !data) {
    if (error && process.env.NODE_ENV === "development") {
      console.warn("[Bizora] fetchCitiesByState failed:", error.message);
    }
    return [];
  }

  return data.map((row) => ({
    id: row.id,
    name: row.name,
    districtId: row.district_id,
  }));
}

/** Resolve a city's parent district_id for listing integrity / hidden form fields. */
export async function fetchCityWithDistrict(
  cityId: string,
): Promise<CityOption | null> {
  if (!cityId) return null;

  const supabase = await createSupabaseServerClient();
  if (!supabase) return null;

  const { data, error } = await supabase
    .from("cities")
    .select("id, name, district_id")
    .eq("id", cityId)
    .maybeSingle();

  if (error || !data) {
    if (error && process.env.NODE_ENV === "development") {
      console.warn("[Bizora] fetchCityWithDistrict failed:", error.message);
    }
    return null;
  }

  return {
    id: data.id,
    name: data.name,
    districtId: data.district_id,
  };
}

export async function fetchLocalities(cityId: string): Promise<LocationOption[]> {
  if (!cityId) return [];

  const supabase = await createSupabaseServerClient();
  if (!supabase) return [];

  const { data, error } = await supabase
    .from("localities")
    .select("id, name")
    .eq("city_id", cityId)
    .order("name", { ascending: true });

  if (error || !data) {
    if (error && process.env.NODE_ENV === "development") {
      console.warn("[Bizora] fetchLocalities failed:", error.message);
    }
    return [];
  }

  return data;
}

export async function fetchLocationNameById(
  table: "states" | "districts" | "cities" | "localities",
  id: string | undefined,
): Promise<string | undefined> {
  if (!id) return undefined;

  const supabase = await createSupabaseServerClient();
  if (!supabase) return undefined;

  const { data, error } = await supabase
    .from(table)
    .select("name")
    .eq("id", id)
    .maybeSingle();

  if (error || !data) {
    if (error && process.env.NODE_ENV === "development") {
      console.warn(`[Bizora] fetchLocationNameById(${table}) failed:`, error.message);
    }
    return undefined;
  }

  return data.name;
}
