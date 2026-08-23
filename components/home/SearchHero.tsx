"use client";

import {
  Briefcase,
  Building2,
  ChevronDown,
  Grid2x2,
  Search,
  Wallet,
} from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import {
  EMPTY_LOCATION,
  LocationSelector,
  type LocationSelection,
} from "@/components/home/LocationSelector";
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

const BUSINESS_BUDGETS = [
  { label: "All Budget", min: undefined, max: undefined },
  { label: "Under ₹50L", min: undefined, max: 5_000_000 },
  { label: "₹50L – ₹2Cr", min: 5_000_000, max: 20_000_000 },
  { label: "₹2Cr – ₹10Cr", min: 20_000_000, max: 100_000_000 },
  { label: "₹10Cr+", min: 100_000_000, max: undefined },
] as const;

const COMMERCIAL_BUDGETS = [
  { label: "All Budget", min: undefined, max: undefined },
  { label: "Under ₹50k/mo", min: undefined, max: 50_000 },
  { label: "₹50k – ₹1.5L/mo", min: 50_000, max: 150_000 },
  { label: "₹1.5L – ₹5L/mo", min: 150_000, max: 500_000 },
  { label: "₹5L+/mo", min: 500_000, max: undefined },
] as const;

const fieldSelectClass =
  "h-9 w-full min-w-0 appearance-none rounded-md border-0 bg-transparent pr-6 text-sm font-medium text-navy focus:outline-none focus:ring-0";

const fieldCellClass =
  "flex min-w-0 items-center gap-2 rounded-lg border border-border px-2.5 lg:rounded-none lg:border-0 lg:border-r lg:border-border lg:px-3";

export function SearchHero({
  businessCategories,
  commercialCategories,
  states,
}: SearchHeroProps) {
  const router = useRouter();
  const [marketplace, setMarketplace] = useState<ListingType>("business");
  const [location, setLocation] = useState<LocationSelection>(EMPTY_LOCATION);
  const [categoryId, setCategoryId] = useState("");
  const [budgetIndex, setBudgetIndex] = useState(0);

  const categories =
    marketplace === "commercial_space"
      ? commercialCategories
      : businessCategories;
  const budgets =
    marketplace === "commercial_space" ? COMMERCIAL_BUDGETS : BUSINESS_BUDGETS;

  function switchMarketplace(next: ListingType) {
    setMarketplace(next);
    setCategoryId("");
    setBudgetIndex(0);
  }

  function handleSearchSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const budget = budgets[budgetIndex] ?? budgets[0];

    const filters: BusinessSearchFilters = {
      listingType: marketplace,
      categoryIds: categoryId ? [categoryId] : undefined,
      stateId: location.stateId ?? undefined,
      districtId: location.districtId ?? undefined,
      cityId: location.cityId ?? undefined,
      localityId: location.localityId ?? undefined,
      minPrice: budget.min,
      maxPrice: budget.max,
      page: 1,
    };

    router.push(buildSearchHref(filters));
  }

  return (
    <section className="relative z-10 bg-surface">
      <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
        <Image
          src="/images/hero-hyderabad.jpg"
          alt=""
          fill
          priority
          className="object-cover object-[center_35%] opacity-40"
          sizes="100vw"
        />
        <div className="absolute inset-0 bg-white/82" />
      </div>

      <div className="relative mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-7 lg:px-8 lg:py-8">
        <div className="mx-auto max-w-2xl text-center">
          <h1 className="text-[2rem] font-bold leading-tight tracking-tight text-navy sm:text-[2.75rem] sm:leading-[1.15] lg:text-[3.25rem]">
            Buy a Business.
            <br />
            <span className="text-primary">Find the Right Space.</span>
          </h1>
          <p className="mx-auto mt-2 max-w-xl text-sm text-muted sm:text-base">
            Discover businesses for sale and commercial spaces in Hyderabad.
          </p>
        </div>

        <div className="mx-auto mt-3 flex max-w-lg justify-center">
          <div className="inline-flex h-10 w-full items-center rounded-full border border-border bg-white/95 p-0.5 shadow-sm sm:w-auto">
            <button
              type="button"
              onClick={() => switchMarketplace("business")}
              className={[
                "inline-flex h-8 flex-1 items-center justify-center gap-1.5 rounded-full px-3.5 text-sm font-semibold transition-colors sm:flex-none sm:px-4",
                marketplace === "business"
                  ? "bg-navy text-white"
                  : "text-primary hover:bg-primary-light",
              ].join(" ")}
            >
              <Briefcase className="h-3.5 w-3.5" aria-hidden />
              <span className="sm:hidden">Businesses</span>
              <span className="hidden sm:inline">Businesses for Sale</span>
            </button>
            <button
              type="button"
              onClick={() => switchMarketplace("commercial_space")}
              className={[
                "inline-flex h-8 flex-1 items-center justify-center gap-1.5 rounded-full px-3.5 text-sm font-semibold transition-colors sm:flex-none sm:px-4",
                marketplace === "commercial_space"
                  ? "bg-navy text-white"
                  : "text-primary hover:bg-primary-light",
              ].join(" ")}
            >
              <Building2 className="h-3.5 w-3.5" aria-hidden />
              <span className="sm:hidden">Spaces</span>
              <span className="hidden sm:inline">Commercial Spaces</span>
            </button>
          </div>
        </div>

        <form
          onSubmit={handleSearchSubmit}
          className="mx-auto mt-3 max-w-5xl rounded-xl border border-border bg-white p-1.5 shadow-md shadow-navy/5"
        >
          <div className="grid grid-cols-1 gap-1.5 sm:grid-cols-2 lg:grid-cols-[1.15fr_1.15fr_1fr_auto] lg:items-stretch lg:gap-0">
            <div className={`${fieldCellClass} h-11`}>
              <LocationSelector
                states={states}
                value={location}
                onChange={setLocation}
                triggerClassName="h-9 rounded-md border-0 bg-transparent px-0 shadow-none hover:border-transparent focus:border-transparent focus:ring-0"
              />
            </div>

            <label className={`${fieldCellClass} h-11`}>
              <Grid2x2
                className="h-3.5 w-3.5 shrink-0 text-primary"
                aria-hidden
              />
              <span className="relative min-w-0 flex-1">
                <span className="sr-only">Category</span>
                <select
                  value={categoryId}
                  onChange={(e) => setCategoryId(e.target.value)}
                  className={fieldSelectClass}
                  aria-label="Category"
                >
                  <option value="">All Categories</option>
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
                <ChevronDown
                  className="pointer-events-none absolute right-0 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted"
                  aria-hidden
                />
              </span>
            </label>

            <label className={`${fieldCellClass} h-11`}>
              <Wallet
                className="h-3.5 w-3.5 shrink-0 text-primary"
                aria-hidden
              />
              <span className="relative min-w-0 flex-1">
                <span className="sr-only">Budget</span>
                <select
                  value={budgetIndex}
                  onChange={(e) => setBudgetIndex(Number(e.target.value))}
                  className={fieldSelectClass}
                  aria-label="Budget"
                >
                  {budgets.map((budget, index) => (
                    <option key={budget.label} value={index}>
                      {budget.label}
                    </option>
                  ))}
                </select>
                <ChevronDown
                  className="pointer-events-none absolute right-0 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted"
                  aria-hidden
                />
              </span>
            </label>

            <button
              type="submit"
              className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-cta px-4 text-sm font-semibold text-white transition-colors hover:bg-cta-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cta focus-visible:ring-offset-2 sm:col-span-2 lg:col-span-1 lg:min-w-[108px]"
            >
              <Search className="h-4 w-4" aria-hidden />
              Search
            </button>
          </div>
        </form>
      </div>
    </section>
  );
}
