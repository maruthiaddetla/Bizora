"use client";

import { useId, useState, useTransition } from "react";
import {
  loadCitiesByStateAction,
  loadLocalitiesAction,
} from "@/lib/repositories/locations.actions";
import type {
  CityOption,
  LocationOption,
} from "@/lib/repositories/locations.repository";

export type ListingLocationValue = {
  stateId: string | null;
  /** Auto-derived from the selected city for DB integrity; not shown in the UI. */
  districtId: string | null;
  cityId: string | null;
  localityId: string | null;
};

type ListingLocationFieldsProps = {
  states: LocationOption[];
  initialCities?: CityOption[];
  initialLocalities?: LocationOption[];
  value: ListingLocationValue;
  onChange: (value: ListingLocationValue) => void;
  errors?: Partial<
    Record<"stateId" | "districtId" | "cityId" | "localityId", string>
  >;
};

const selectClass =
  "h-11 w-full rounded-lg border border-border bg-white px-3 text-sm text-foreground transition-colors focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 disabled:cursor-not-allowed disabled:bg-surface disabled:text-muted";

export function ListingLocationFields({
  states,
  initialCities = [],
  initialLocalities = [],
  value,
  onChange,
  errors,
}: ListingLocationFieldsProps) {
  const [cities, setCities] = useState(initialCities);
  const [localities, setLocalities] = useState(initialLocalities);
  const [isPending, startTransition] = useTransition();
  const baseId = useId();

  function handleStateChange(stateId: string) {
    onChange({
      stateId: stateId || null,
      districtId: null,
      cityId: null,
      localityId: null,
    });
    setLocalities([]);

    if (!stateId) {
      setCities([]);
      return;
    }

    startTransition(async () => {
      setCities(await loadCitiesByStateAction(stateId));
    });
  }

  function handleCityChange(cityId: string) {
    const city = cities.find((item) => item.id === cityId);
    onChange({
      ...value,
      districtId: city?.districtId ?? null,
      cityId: cityId || null,
      localityId: null,
    });

    if (!cityId) {
      setLocalities([]);
      return;
    }

    startTransition(async () => {
      setLocalities(await loadLocalitiesAction(cityId));
    });
  }

  const cityError = errors?.cityId ?? errors?.districtId;

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {/* District is derived from city and required by the DB; keep it in the form. */}
      <input type="hidden" name="districtId" value={value.districtId ?? ""} />

      <div>
        <label
          htmlFor={`${baseId}-state`}
          className="mb-1.5 block text-sm font-medium text-foreground"
        >
          State <span className="text-red-600">*</span>
        </label>
        <select
          id={`${baseId}-state`}
          name="stateId"
          className={selectClass}
          value={value.stateId ?? ""}
          onChange={(event) => handleStateChange(event.target.value)}
          aria-invalid={Boolean(errors?.stateId)}
        >
          <option value="">Select state</option>
          {states.map((state) => (
            <option key={state.id} value={state.id}>
              {state.name}
            </option>
          ))}
        </select>
        {errors?.stateId && (
          <p className="mt-1 text-sm text-red-700">{errors.stateId}</p>
        )}
      </div>

      <div>
        <label
          htmlFor={`${baseId}-city`}
          className="mb-1.5 block text-sm font-medium text-foreground"
        >
          City <span className="text-red-600">*</span>
        </label>
        <select
          id={`${baseId}-city`}
          name="cityId"
          className={selectClass}
          value={value.cityId ?? ""}
          onChange={(event) => handleCityChange(event.target.value)}
          disabled={!value.stateId || isPending}
          aria-invalid={Boolean(cityError)}
        >
          <option value="">Select city</option>
          {cities.map((city) => (
            <option key={city.id} value={city.id}>
              {city.name}
            </option>
          ))}
        </select>
        {cityError && <p className="mt-1 text-sm text-red-700">{cityError}</p>}
      </div>

      <div className="sm:col-span-2">
        <label
          htmlFor={`${baseId}-locality`}
          className="mb-1.5 block text-sm font-medium text-foreground"
        >
          Locality <span className="text-muted font-normal">(optional)</span>
        </label>
        <select
          id={`${baseId}-locality`}
          name="localityId"
          className={selectClass}
          value={value.localityId ?? ""}
          onChange={(event) =>
            onChange({
              ...value,
              localityId: event.target.value || null,
            })
          }
          disabled={!value.cityId || isPending}
          aria-invalid={Boolean(errors?.localityId)}
        >
          <option value="">Select locality</option>
          {localities.map((locality) => (
            <option key={locality.id} value={locality.id}>
              {locality.name}
            </option>
          ))}
        </select>
        {errors?.localityId && (
          <p className="mt-1 text-sm text-red-700">{errors.localityId}</p>
        )}
      </div>
    </div>
  );
}
