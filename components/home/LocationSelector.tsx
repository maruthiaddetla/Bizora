"use client";

import { ChevronDown, MapPin, X } from "lucide-react";
import { useEffect, useId, useRef, useState } from "react";
import {
  EMPTY_LOCATION,
  SAMPLE_COUNTRY,
  SAMPLE_LOCATION_TREE,
  formatLocationSelection,
  type LocationSelection,
} from "@/lib/search-sample-data";

type LocationSelectorProps = {
  value: LocationSelection;
  onChange: (value: LocationSelection) => void;
};

const selectClass =
  "h-10 w-full rounded-lg border border-border bg-white px-3 text-sm text-foreground transition-colors focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20";

export function LocationSelector({ value, onChange }: LocationSelectorProps) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const listboxId = useId();

  const selectedState = SAMPLE_LOCATION_TREE.find((s) => s.name === value.state);
  const selectedDistrict = selectedState?.districts.find(
    (d) => d.name === value.district,
  );
  const selectedCity = selectedDistrict?.cities.find((c) => c.name === value.city);
  const localities = selectedCity?.localities ?? [];

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

  function update(partial: Partial<LocationSelection>) {
    onChange({ ...value, ...partial });
  }

  function handleStateChange(stateName: string) {
    onChange({
      state: stateName || null,
      district: null,
      city: null,
      locality: null,
    });
  }

  function handleDistrictChange(districtName: string) {
    onChange({
      ...value,
      district: districtName || null,
      city: null,
      locality: null,
    });
  }

  function handleCityChange(cityName: string) {
    onChange({
      ...value,
      city: cityName || null,
      locality: null,
    });
  }

  function handleClear() {
    onChange(EMPTY_LOCATION);
    setOpen(false);
  }

  const summary = formatLocationSelection(value);

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
        className="flex h-12 w-full min-w-0 items-center gap-2 rounded-xl border border-border bg-white px-3 text-left text-sm transition-colors hover:border-slate-300 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 sm:px-4"
      >
        <MapPin className="h-4 w-4 shrink-0 text-muted" aria-hidden />
        <span
          className={`min-w-0 flex-1 truncate ${value.state ? "text-foreground" : "text-muted/70"}`}
        >
          {summary}
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
          <p className="mb-3 text-xs text-muted">
            Sample location data — will be replaced by Supabase
          </p>

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
                value={SAMPLE_COUNTRY}
                disabled
                className={`${selectClass} cursor-not-allowed bg-surface text-muted`}
              >
                <option value={SAMPLE_COUNTRY}>{SAMPLE_COUNTRY}</option>
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
                value={value.state ?? ""}
                onChange={(e) => handleStateChange(e.target.value)}
                className={selectClass}
              >
                <option value="">Select state</option>
                {SAMPLE_LOCATION_TREE.map((state) => (
                  <option key={state.name} value={state.name}>
                    {state.name}
                  </option>
                ))}
              </select>
            </div>

            {selectedState && (
              <div>
                <label
                  htmlFor={`${listboxId}-district`}
                  className="mb-1 block text-xs font-medium text-muted"
                >
                  District
                </label>
                <select
                  id={`${listboxId}-district`}
                  value={value.district ?? ""}
                  onChange={(e) => handleDistrictChange(e.target.value)}
                  className={selectClass}
                >
                  <option value="">Select district</option>
                  {selectedState.districts.map((district) => (
                    <option key={district.name} value={district.name}>
                      {district.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {selectedDistrict && (
              <div>
                <label
                  htmlFor={`${listboxId}-city`}
                  className="mb-1 block text-xs font-medium text-muted"
                >
                  City
                </label>
                <select
                  id={`${listboxId}-city`}
                  value={value.city ?? ""}
                  onChange={(e) => handleCityChange(e.target.value)}
                  className={selectClass}
                >
                  <option value="">Select city</option>
                  {selectedDistrict.cities.map((city) => (
                    <option key={city.name} value={city.name}>
                      {city.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {selectedCity && localities.length > 0 && (
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
                  value={value.locality ?? ""}
                  onChange={(e) =>
                    update({ locality: e.target.value || null })
                  }
                  className={selectClass}
                >
                  <option value="">Select locality (optional)</option>
                  {localities.map((locality) => (
                    <option key={locality} value={locality}>
                      {locality}
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
              className="text-xs font-medium text-muted transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-sm"
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
