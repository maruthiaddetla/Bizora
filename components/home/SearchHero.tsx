"use client";

import { ArrowRight, Search } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { CategoryMultiSelect } from "@/components/home/CategoryMultiSelect";
import {
  EMPTY_LOCATION,
  LocationSelector,
  type LocationSelection,
} from "@/components/home/LocationSelector";
import { MarketplaceSelector } from "@/components/listings/ListingTypeSelector";
import { Button } from "@/components/ui/Button";
import type { CategoryOption } from "@/lib/repositories/categories.repository";
import type { LocationOption } from "@/lib/repositories/locations.repository";
import type { ListingType } from "@/lib/listing-types";
import {
  buildSearchHref,
  type BusinessSearchFilters,
} from "@/lib/search/params";

type SearchHeroProps = {
  businessCategories: CategoryOption[];
  commercialCategories: CategoryOption[];
  states: LocationOption[];
};

export function SearchHero({
  businessCategories,
  commercialCategories,
  states,
}: SearchHeroProps) {
  const router = useRouter();
  const [marketplace, setMarketplace] = useState<ListingType>("business");
  const [keyword, setKeyword] = useState("");
  const [location, setLocation] = useState<LocationSelection>(EMPTY_LOCATION);
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<string[]>([]);

  const categories =
    marketplace === "commercial_space"
      ? commercialCategories
      : businessCategories;

  function handleSearchSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const filters: BusinessSearchFilters = {
      listingType: marketplace,
      q: keyword.trim() || undefined,
      categoryIds:
        selectedCategoryIds.length > 0 ? selectedCategoryIds : undefined,
      stateId: location.stateId ?? undefined,
      districtId: location.districtId ?? undefined,
      cityId: location.cityId ?? undefined,
      localityId: location.localityId ?? undefined,
      page: 1,
    };

    router.push(buildSearchHref(filters));
  }

  function switchMarketplace(next: ListingType) {
    setMarketplace(next);
    setSelectedCategoryIds([]);
  }

  return (
    <section className="relative bg-gradient-to-br from-hero-from via-[#121a2e] to-hero-to">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 overflow-hidden"
      >
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-accent/10" />
      </div>

      <div className="relative mx-auto max-w-7xl px-4 pb-16 pt-12 sm:px-6 sm:pb-20 sm:pt-16 lg:px-8">
        <div className="mx-auto max-w-3xl text-center">
          <h1 className="text-4xl font-semibold tracking-tight text-white sm:text-5xl md:text-6xl">
            Buy a Business.
            <br />
            <span className="text-slate-300">Find the Right Space.</span>
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-base text-slate-400 sm:text-lg">
            Discover businesses for sale and commercial premises for rent or
            lease — all in one marketplace.
          </p>
          <div className="mt-8">
            <MarketplaceSelector />
          </div>
        </div>

        <div className="relative z-20 mx-auto mt-10 max-w-4xl rounded-2xl border border-white/10 bg-white p-4 shadow-2xl shadow-black/20 sm:p-5">
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => switchMarketplace("business")}
              className={[
                "flex-1 rounded-lg px-4 py-2.5 text-sm font-semibold transition-colors",
                marketplace === "business"
                  ? "bg-primary text-white"
                  : "bg-surface text-muted hover:text-foreground",
              ].join(" ")}
            >
              Businesses
            </button>
            <button
              type="button"
              onClick={() => switchMarketplace("commercial_space")}
              className={[
                "flex-1 rounded-lg px-4 py-2.5 text-sm font-semibold transition-colors",
                marketplace === "commercial_space"
                  ? "bg-primary text-white"
                  : "bg-surface text-muted hover:text-foreground",
              ].join(" ")}
            >
              Commercial Spaces
            </button>
          </div>

          <form className="mt-4 space-y-3" onSubmit={handleSearchSubmit}>
            <label className="relative block">
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
                  marketplace === "commercial_space"
                    ? "Shop, office, warehouse, location..."
                    : "Industry, keyword, or business type..."
                }
                className="h-12 w-full rounded-xl border border-border bg-white pl-12 pr-4 text-sm text-foreground placeholder:text-muted/70 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </label>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <LocationSelector
                states={states}
                value={location}
                onChange={setLocation}
              />
              <CategoryMultiSelect
                options={categories}
                selectedIds={selectedCategoryIds}
                onChange={setSelectedCategoryIds}
              />
            </div>

            <Button type="submit" size="lg" className="h-12 w-full sm:w-auto">
              Search
              <ArrowRight className="h-4 w-4" aria-hidden />
            </Button>
          </form>

          <div className="mt-4 flex flex-wrap gap-2 border-t border-border pt-4">
            {categories.slice(0, 5).map((category) => (
              <Link
                key={category.id}
                href={buildSearchHref({
                  listingType: marketplace,
                  categoryIds: [category.id],
                  page: 1,
                })}
                className="rounded-full border border-border px-3 py-1 text-xs font-medium text-muted hover:border-primary/30 hover:text-primary"
              >
                {category.name}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
