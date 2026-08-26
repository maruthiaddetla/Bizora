"use client";

import { useId, useState, useTransition } from "react";
import { loadCitiesByStateAction } from "@/lib/repositories/locations.actions";
import type {
  CityOption,
  LocationOption,
} from "@/lib/repositories/locations.repository";

export type ListingLocationValue = {
  stateId: string | null;
  /** Auto-derived from the selected city for DB integrity; not shown in the UI. */
  districtId: string | null;
  cityId: string | null;
  /** Optional free-text locality / area name. */
  locality: string;
};

type ListingLocationFieldsProps = {
  states: LocationOption[];
  initialCities?: CityOption[];
  value: ListingLocationValue;
  onChange: (value: ListingLocationValue) => void;
  errors?: Partial<
    Record<"stateId" | "districtId" | "cityId" | "locality", string>
  >;
};

const selectClass =
  "h-11 w-full rounded-lg border border-border bg-white px-3 text-sm text-foreground transition-colors focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 disabled:cursor-not-allowed disabled:bg-surface disabled:text-muted";

const inputClass =
  "h-11 w-full rounded-lg border border-border bg-white px-3 text-sm text-foreground placeholder:text-muted/70 transition-colors focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20";

export function ListingLocationFields({
  states,
  initialCities = [],
  value,
  onChange,
  errors,
}: ListingLocationFieldsProps) {
  const [cities, setCities] = useState(initialCities);
  const [isPending, startTransition] = useTransition();
  const baseId = useId();

  function handleStateChange(stateId: string) {
    onChange({
      stateId: stateId || null,
      districtId: null,
      cityId: null,
      locality: value.locality,
    });

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
        <input
          id={`${baseId}-locality`}
          name="locality"
          type="text"
          className={inputClass}
          value={value.locality}
          onChange={(event) =>
            onChange({
              ...value,
              locality: event.target.value,
            })
          }
          placeholder="e.g. Banjara Hills, Madhapur, Kukatpally"
          maxLength={120}
          aria-invalid={Boolean(errors?.locality)}
        />
        {errors?.locality && (
          <p className="mt-1 text-sm text-red-700">{errors.locality}</p>
        )}
      </div>
    </div>
  );
}
