import { createSupabaseServerClient } from "@/lib/supabase/server";

export type LocationOption = {
  id: string;
  name: string;
};

export async function fetchStates(): Promise<LocationOption[]> {
  const supabase = createSupabaseServerClient();
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

  const supabase = createSupabaseServerClient();
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

  const supabase = createSupabaseServerClient();
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

export async function fetchLocalities(cityId: string): Promise<LocationOption[]> {
  if (!cityId) return [];

  const supabase = createSupabaseServerClient();
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

  const supabase = createSupabaseServerClient();
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
