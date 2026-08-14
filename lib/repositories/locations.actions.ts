"use server";

import {
  fetchCities,
  fetchDistricts,
  fetchLocalities,
} from "@/lib/repositories/locations.repository";

export async function loadDistrictsAction(stateId: string) {
  return fetchDistricts(stateId);
}

export async function loadCitiesAction(districtId: string) {
  return fetchCities(districtId);
}

export async function loadLocalitiesAction(cityId: string) {
  return fetchLocalities(cityId);
}
