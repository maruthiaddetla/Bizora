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
import {
  FURNISHED_LABELS,
  FURNISHED_OPTIONS,
  SPACE_TYPE_LABELS,
  SPACE_TYPES,
} from "@/lib/listing-types";
import type { CategoryOption } from "@/lib/repositories/categories.repository";
import type {
  CityOption,
  LocationOption,
} from "@/lib/repositories/locations.repository";
import {
  buildSearchHref,
  type BusinessSearchFilters,
} from "@/lib/search/params";

type ListingsFiltersProps = {
  initialFilters: BusinessSearchFilters;
  listingType: "business" | "commercial_space";
  categories: CategoryOption[];
  states: LocationOption[];
  initialCities: CityOption[];
  initialLocalities: LocationOption[];
};

export function ListingsFilters({
  initialFilters,
  listingType,
  categories,
  states,
  initialCities,
  initialLocalities,
}: ListingsFiltersProps) {
  const router = useRouter();
  const isCommercial = listingType === "commercial_space";
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
  const [spaceType, setSpaceType] = useState(initialFilters.spaceType ?? "");
  const [furnished, setFurnished] = useState(initialFilters.furnished ?? "");
  const [minArea, setMinArea] = useState(
    initialFilters.minArea != null ? String(initialFilters.minArea) : "",
  );
  const [maxArea, setMaxArea] = useState(
    initialFilters.maxArea != null ? String(initialFilters.maxArea) : "",
  );
  const [minParking, setMinParking] = useState(
    initialFilters.minParking != null ? String(initialFilters.minParking) : "",
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
      listingType,
      q: keyword.trim() || undefined,
      categoryIds: categoryIds.length > 0 ? categoryIds : undefined,
      stateId: location.stateId ?? undefined,
      // Preserve legacy ?district= filters until the user changes location.
      districtId: location.cityId ? undefined : location.districtId ?? undefined,
      cityId: location.cityId ?? undefined,
      localityId: location.localityId ?? undefined,
      minPrice: parsePrice(minPrice),
      maxPrice: parsePrice(maxPrice),
      spaceType: spaceType || undefined,
      furnished: furnished || undefined,
      minArea: parsePrice(minArea),
      maxArea: parsePrice(maxArea),
      minParking: parsePrice(minParking),
      sort: initialFilters.sort,
      premiumOnly: initialFilters.premiumOnly,
      page: 1,
    };

    router.push(buildSearchHref(nextFilters));
  }

  const priceMinLabel = isCommercial ? "Min monthly rent (₹)" : "Min asking price (₹)";
  const priceMaxLabel = isCommercial ? "Max monthly rent (₹)" : "Max asking price (₹)";

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
            placeholder={
              isCommercial
                ? "Shop, office, warehouse..."
                : "Keyword, industry, or business type..."
            }
            className="h-12 w-full rounded-xl border border-border bg-white pl-12 pr-4 text-sm text-foreground placeholder:text-muted/70 transition-colors focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
        </label>

        <div className="lg:col-span-4">
          <LocationFilterSelect
            states={states}
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

        {isCommercial && (
          <>
            <label className="block lg:col-span-3">
              <span className="mb-1.5 block text-xs font-medium text-muted">
                Space type
              </span>
              <select
                value={spaceType}
                onChange={(e) => setSpaceType(e.target.value)}
                className="h-12 w-full rounded-xl border border-border bg-white px-4 text-sm"
              >
                <option value="">Any</option>
                {SPACE_TYPES.map((type) => (
                  <option key={type} value={type}>
                    {SPACE_TYPE_LABELS[type]}
                  </option>
                ))}
              </select>
            </label>
            <label className="block lg:col-span-3">
              <span className="mb-1.5 block text-xs font-medium text-muted">
                Furnishing
              </span>
              <select
                value={furnished}
                onChange={(e) => setFurnished(e.target.value)}
                className="h-12 w-full rounded-xl border border-border bg-white px-4 text-sm"
              >
                <option value="">Any</option>
                {FURNISHED_OPTIONS.map((option) => (
                  <option key={option} value={option}>
                    {FURNISHED_LABELS[option]}
                  </option>
                ))}
              </select>
            </label>
            <label className="block lg:col-span-2">
              <span className="mb-1.5 block text-xs font-medium text-muted">
                Min area (sq.ft)
              </span>
              <input
                type="number"
                min={0}
                value={minArea}
                onChange={(e) => setMinArea(e.target.value)}
                className="h-12 w-full rounded-xl border border-border bg-white px-4 text-sm"
              />
            </label>
            <label className="block lg:col-span-2">
              <span className="mb-1.5 block text-xs font-medium text-muted">
                Max area (sq.ft)
              </span>
              <input
                type="number"
                min={0}
                value={maxArea}
                onChange={(e) => setMaxArea(e.target.value)}
                className="h-12 w-full rounded-xl border border-border bg-white px-4 text-sm"
              />
            </label>
            <label className="block lg:col-span-2">
              <span className="mb-1.5 block text-xs font-medium text-muted">
                Min parking
              </span>
              <input
                type="number"
                min={0}
                value={minParking}
                onChange={(e) => setMinParking(e.target.value)}
                className="h-12 w-full rounded-xl border border-border bg-white px-4 text-sm"
              />
            </label>
          </>
        )}

        <label className="block lg:col-span-3">
          <span className="mb-1.5 block text-xs font-medium text-muted">
            {priceMinLabel}
          </span>
          <input
            type="number"
            min={0}
            inputMode="numeric"
            value={minPrice}
            onChange={(e) => setMinPrice(e.target.value)}
            className="h-12 w-full rounded-xl border border-border bg-white px-4 text-sm text-foreground placeholder:text-muted/70 transition-colors focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
        </label>

        <label className="block lg:col-span-3">
          <span className="mb-1.5 block text-xs font-medium text-muted">
            {priceMaxLabel}
          </span>
          <input
            type="number"
            min={0}
            inputMode="numeric"
            value={maxPrice}
            onChange={(e) => setMaxPrice(e.target.value)}
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
