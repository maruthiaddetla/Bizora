"use client";

import { Search } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { CategoryFilterSelect } from "@/components/search/CategoryFilterSelect";
import {
  LocationFilterSelect,
  type LocationFilterValue,
} from "@/components/search/LocationFilterSelect";
import { Button } from "@/components/ui/Button";
import type { CategoryOption } from "@/lib/repositories/categories.repository";
import type { LocationOption } from "@/lib/repositories/locations.repository";
import {
  buildSearchHref,
  type BusinessSearchFilters,
} from "@/lib/search/params";

type ListingsFiltersProps = {
  initialFilters: BusinessSearchFilters;
  categories: CategoryOption[];
  states: LocationOption[];
  initialDistricts: LocationOption[];
  initialCities: LocationOption[];
  initialLocalities: LocationOption[];
};

export function ListingsFilters({
  initialFilters,
  categories,
  states,
  initialDistricts,
  initialCities,
  initialLocalities,
}: ListingsFiltersProps) {
  const router = useRouter();
  const [keyword, setKeyword] = useState(initialFilters.q ?? "");
  const [categoryIds, setCategoryIds] = useState<string[]>(
    initialFilters.categoryIds ?? [],
  );
  const [location, setLocation] = useState<LocationFilterValue>({
    stateId: initialFilters.stateId ?? null,
    districtId: initialFilters.districtId ?? null,
    cityId: initialFilters.cityId ?? null,
    localityId: initialFilters.localityId ?? null,
  });
  const [minPrice, setMinPrice] = useState(
    initialFilters.minPrice != null ? String(initialFilters.minPrice) : "",
  );
  const [maxPrice, setMaxPrice] = useState(
    initialFilters.maxPrice != null ? String(initialFilters.maxPrice) : "",
  );

  function parsePrice(value: string): number | undefined {
    const trimmed = value.trim();
    if (!trimmed) return undefined;
    const parsed = Number(trimmed);
    if (!Number.isFinite(parsed) || parsed < 0) return undefined;
    return parsed;
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const nextFilters: BusinessSearchFilters = {
      q: keyword.trim() || undefined,
      categoryIds: categoryIds.length > 0 ? categoryIds : undefined,
      stateId: location.stateId ?? undefined,
      districtId: location.districtId ?? undefined,
      cityId: location.cityId ?? undefined,
      localityId: location.localityId ?? undefined,
      minPrice: parsePrice(minPrice),
      maxPrice: parsePrice(maxPrice),
      page: 1,
    };

    router.push(buildSearchHref(nextFilters));
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-2xl border border-border bg-white p-4 shadow-sm sm:p-5"
    >
      <div className="grid grid-cols-1 gap-3 lg:grid-cols-12">
        <label className="relative block lg:col-span-4">
          <span className="sr-only">Search keywords</span>
          <Search
            className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted"
            aria-hidden
          />
          <input
            type="search"
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            placeholder="Keyword, industry, or business type..."
            className="h-12 w-full rounded-xl border border-border bg-white pl-12 pr-4 text-sm text-foreground placeholder:text-muted/70 transition-colors focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
        </label>

        <div className="lg:col-span-4">
          <LocationFilterSelect
            states={states}
            initialDistricts={initialDistricts}
            initialCities={initialCities}
            initialLocalities={initialLocalities}
            value={location}
            onChange={setLocation}
          />
        </div>

        <div className="lg:col-span-4">
          <CategoryFilterSelect
            options={categories}
            selectedIds={categoryIds}
            onChange={setCategoryIds}
          />
        </div>

        <label className="block lg:col-span-3">
          <span className="mb-1.5 block text-xs font-medium text-muted">
            Min asking price (₹)
          </span>
          <input
            type="number"
            min={0}
            inputMode="numeric"
            value={minPrice}
            onChange={(e) => setMinPrice(e.target.value)}
            placeholder="e.g. 5000000"
            className="h-12 w-full rounded-xl border border-border bg-white px-4 text-sm text-foreground placeholder:text-muted/70 transition-colors focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
        </label>

        <label className="block lg:col-span-3">
          <span className="mb-1.5 block text-xs font-medium text-muted">
            Max asking price (₹)
          </span>
          <input
            type="number"
            min={0}
            inputMode="numeric"
            value={maxPrice}
            onChange={(e) => setMaxPrice(e.target.value)}
            placeholder="e.g. 20000000"
            className="h-12 w-full rounded-xl border border-border bg-white px-4 text-sm text-foreground placeholder:text-muted/70 transition-colors focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
        </label>

        <div className="flex items-end lg:col-span-6">
          <Button type="submit" size="lg" className="h-12 w-full sm:w-auto sm:min-w-[160px]">
            Search
          </Button>
        </div>
      </div>
    </form>
  );
}
