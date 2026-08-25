"use server";

import {
  fetchCitiesByState,
  fetchLocalities,
} from "@/lib/repositories/locations.repository";

export async function loadCitiesByStateAction(stateId: string) {
  return fetchCitiesByState(stateId);
}

export async function loadLocalitiesAction(cityId: string) {
  return fetchLocalities(cityId);
}
