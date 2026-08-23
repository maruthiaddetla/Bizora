"use client";

import { ChevronDown, MapPin } from "lucide-react";
import { useEffect, useId, useRef, useState, useTransition } from "react";
import {
  loadCitiesAction,
  loadDistrictsAction,
  loadLocalitiesAction,
} from "@/lib/repositories/locations.actions";
import type { LocationOption } from "@/lib/repositories/locations.repository";

export type LocationSelection = {
  stateId: string | null;
  districtId: string | null;
  cityId: string | null;
  localityId: string | null;
};

export const EMPTY_LOCATION: LocationSelection = {
  stateId: null,
  districtId: null,
  cityId: null,
  localityId: null,
};

type LocationSelectorProps = {
  states: LocationOption[];
  value: LocationSelection;
  onChange: (value: LocationSelection) => void;
  /** Optional classes for the closed trigger button (presentation only). */
  triggerClassName?: string;
};

const selectClass =
  "h-10 w-full rounded-lg border border-border bg-white px-3 text-sm text-foreground transition-colors focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20";

export function LocationSelector({
  states,
  value,
  onChange,
  triggerClassName = "",
}: LocationSelectorProps) {
  const [open, setOpen] = useState(false);
  const [districts, setDistricts] = useState<LocationOption[]>([]);
  const [cities, setCities] = useState<LocationOption[]>([]);
  const [localities, setLocalities] = useState<LocationOption[]>([]);
  const [isPending, startTransition] = useTransition();
  const containerRef = useRef<HTMLDivElement>(null);
  const listboxId = useId();

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  function summaryLabel() {
    const stateName = states.find((item) => item.id === value.stateId)?.name;
    const districtName = districts.find((item) => item.id === value.districtId)?.name;
    const cityName = cities.find((item) => item.id === value.cityId)?.name;
    const localityName = localities.find((item) => item.id === value.localityId)?.name;

    const parts = [localityName, cityName, districtName, stateName].filter(Boolean);
    return parts.length > 0 ? parts.join(", ") : "Select location";
  }

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
      const nextDistricts = await loadDistrictsAction(stateId);
      setDistricts(nextDistricts);
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
      const nextCities = await loadCitiesAction(districtId);
      setCities(nextCities);
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
      const nextLocalities = await loadLocalitiesAction(cityId);
      setLocalities(nextLocalities);
    });
  }

  function handleClear() {
    onChange(EMPTY_LOCATION);
    setDistricts([]);
    setCities([]);
    setLocalities([]);
    setOpen(false);
  }

  return (
    <div ref={containerRef} className="relative w-full min-w-0">
      <label className="sr-only" htmlFor={`${listboxId}-trigger`}>
        Location
      </label>
      <button
        id={`${listboxId}-trigger`}
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen((prev) => !prev)}
        className={
          triggerClassName
            ? [
                "flex w-full min-w-0 items-center gap-2 text-left text-sm transition-colors focus:outline-none",
                triggerClassName,
              ].join(" ")
            : "flex h-12 w-full min-w-0 items-center gap-2 rounded-xl border border-border bg-white px-3 text-left text-sm transition-colors hover:border-slate-300 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 sm:px-4"
        }
      >
        <MapPin className="h-4 w-4 shrink-0 text-muted" aria-hidden />
        <span
          className={`min-w-0 flex-1 truncate ${value.stateId ? "text-foreground" : "text-muted/70"}`}
        >
          {summaryLabel()}
        </span>
        <ChevronDown
          className={`h-4 w-4 shrink-0 text-muted transition-transform ${open ? "rotate-180" : ""}`}
          aria-hidden
        />
      </button>

      {open && (
        <div
          role="listbox"
          aria-label="Location selection"
          className="absolute left-0 right-0 z-50 mt-2 max-h-[min(24rem,70vh)] overflow-y-auto rounded-xl border border-border bg-white p-4 shadow-lg"
        >
          {isPending && (
            <p className="mb-2 text-xs text-muted">Updating locations…</p>
          )}

          <div className="space-y-3">
            <div>
              <label
                htmlFor={`${listboxId}-country`}
                className="mb-1 block text-xs font-medium text-muted"
              >
                Country
              </label>
              <select
                id={`${listboxId}-country`}
                value="India"
                disabled
                className={`${selectClass} cursor-not-allowed bg-surface text-muted`}
              >
                <option value="India">India</option>
              </select>
            </div>

            <div>
              <label
                htmlFor={`${listboxId}-state`}
                className="mb-1 block text-xs font-medium text-muted"
              >
                State
              </label>
              <select
                id={`${listboxId}-state`}
                value={value.stateId ?? ""}
                onChange={(e) => handleStateChange(e.target.value)}
                className={selectClass}
              >
                <option value="">Select state</option>
                {states.map((state) => (
                  <option key={state.id} value={state.id}>
                    {state.name}
                  </option>
                ))}
              </select>
            </div>

            {value.stateId && (
              <div>
                <label
                  htmlFor={`${listboxId}-district`}
                  className="mb-1 block text-xs font-medium text-muted"
                >
                  District
                </label>
                <select
                  id={`${listboxId}-district`}
                  value={value.districtId ?? ""}
                  onChange={(e) => handleDistrictChange(e.target.value)}
                  className={selectClass}
                >
                  <option value="">Select district</option>
                  {districts.map((district) => (
                    <option key={district.id} value={district.id}>
                      {district.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {value.districtId && (
              <div>
                <label
                  htmlFor={`${listboxId}-city`}
                  className="mb-1 block text-xs font-medium text-muted"
                >
                  City
                </label>
                <select
                  id={`${listboxId}-city`}
                  value={value.cityId ?? ""}
                  onChange={(e) => handleCityChange(e.target.value)}
                  className={selectClass}
                >
                  <option value="">Select city</option>
                  {cities.map((city) => (
                    <option key={city.id} value={city.id}>
                      {city.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {value.cityId && localities.length > 0 && (
              <div>
                <label
                  htmlFor={`${listboxId}-locality`}
                  className="mb-1 block text-xs font-medium text-muted"
                >
                  Locality{" "}
                  <span className="font-normal text-muted/80">(optional)</span>
                </label>
                <select
                  id={`${listboxId}-locality`}
                  value={value.localityId ?? ""}
                  onChange={(e) =>
                    onChange({
                      ...value,
                      localityId: e.target.value || null,
                    })
                  }
                  className={selectClass}
                >
                  <option value="">Select locality (optional)</option>
                  {localities.map((locality) => (
                    <option key={locality.id} value={locality.id}>
                      {locality.name}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          <div className="mt-4 flex items-center justify-between gap-2 border-t border-border pt-3">
            <button
              type="button"
              onClick={handleClear}
              className="rounded-sm text-xs font-medium text-muted transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            >
              Clear selection
            </button>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-primary-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
            >
              Done
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
