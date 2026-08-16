"use client";

import { useId, useState, useTransition } from "react";
import {
  loadCitiesAction,
  loadDistrictsAction,
  loadLocalitiesAction,
} from "@/lib/repositories/locations.actions";
import type { LocationOption } from "@/lib/repositories/locations.repository";

export type ListingLocationValue = {
  stateId: string | null;
  districtId: string | null;
  cityId: string | null;
  localityId: string | null;
};

type ListingLocationFieldsProps = {
  states: LocationOption[];
  initialDistricts?: LocationOption[];
  initialCities?: LocationOption[];
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
  initialDistricts = [],
  initialCities = [],
  initialLocalities = [],
  value,
  onChange,
  errors,
}: ListingLocationFieldsProps) {
  const [districts, setDistricts] = useState(initialDistricts);
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
    setCities([]);
    setLocalities([]);

    if (!stateId) {
      setDistricts([]);
      return;
    }

    startTransition(async () => {
      setDistricts(await loadDistrictsAction(stateId));
    });
  }

  function handleDistrictChange(districtId: string) {
    onChange({
      ...value,
      districtId: districtId || null,
      cityId: null,
      localityId: null,
    });
    setLocalities([]);

    if (!districtId) {
      setCities([]);
      return;
    }

    startTransition(async () => {
      setCities(await loadCitiesAction(districtId));
    });
  }

  function handleCityChange(cityId: string) {
    onChange({
      ...value,
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

  return (
    <div className="grid gap-4 sm:grid-cols-2">
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
          htmlFor={`${baseId}-district`}
          className="mb-1.5 block text-sm font-medium text-foreground"
        >
          District <span className="text-red-600">*</span>
        </label>
        <select
          id={`${baseId}-district`}
          name="districtId"
          className={selectClass}
          value={value.districtId ?? ""}
          onChange={(event) => handleDistrictChange(event.target.value)}
          disabled={!value.stateId || isPending}
          aria-invalid={Boolean(errors?.districtId)}
        >
          <option value="">Select district</option>
          {districts.map((district) => (
            <option key={district.id} value={district.id}>
              {district.name}
            </option>
          ))}
        </select>
        {errors?.districtId && (
          <p className="mt-1 text-sm text-red-700">{errors.districtId}</p>
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
          disabled={!value.districtId || isPending}
          aria-invalid={Boolean(errors?.cityId)}
        >
          <option value="">Select city</option>
          {cities.map((city) => (
            <option key={city.id} value={city.id}>
              {city.name}
            </option>
          ))}
        </select>
        {errors?.cityId && (
          <p className="mt-1 text-sm text-red-700">{errors.cityId}</p>
        )}
      </div>

      <div>
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
