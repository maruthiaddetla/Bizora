"use client";

import {
  ArrowRight,
  Search,
  ShieldCheck,
  SlidersHorizontal,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { CategoryMultiSelect } from "@/components/home/CategoryMultiSelect";
import {
  EMPTY_LOCATION,
  LocationSelector,
  type LocationSelection,
} from "@/components/home/LocationSelector";
import { Button } from "@/components/ui/Button";
import type { CategoryOption } from "@/lib/repositories/categories.repository";
import type { LocationOption } from "@/lib/repositories/locations.repository";
import {
  buildSearchHref,
  type BusinessSearchFilters,
} from "@/lib/search/params";

type SearchTab = "buy" | "sell" | "latest";

const tabs: { id: SearchTab; label: string }[] = [
  { id: "buy", label: "Buy a Business" },
  { id: "sell", label: "Sell a Business" },
  { id: "latest", label: "Latest Listings" },
];

/** Preferred popular chip slugs when present in active categories. */
const POPULAR_CATEGORY_SLUGS = [
  "restaurant",
  "manufacturing",
  "it-technology",
  "food-hospitality",
  "saas",
] as const;

function resolvePopularCategories(categories: CategoryOption[]): CategoryOption[] {
  const bySlug = new Map(categories.map((category) => [category.slug, category]));
  const preferred = POPULAR_CATEGORY_SLUGS.map((slug) => bySlug.get(slug)).filter(
    (category): category is CategoryOption => category != null,
  );
  if (preferred.length > 0) return preferred.slice(0, 5);
  return categories.slice(0, 5);
}

const trustLabels = [
  "Businesses across India",
  "Trusted buyers & sellers",
  "Secure & confidential",
];

type SearchHeroProps = {
  categories: CategoryOption[];
  states: LocationOption[];
};

export function SearchHero({ categories, states }: SearchHeroProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<SearchTab>("buy");
  const [keyword, setKeyword] = useState("");
  const [location, setLocation] = useState<LocationSelection>(EMPTY_LOCATION);
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<string[]>([]);

  const popularCategories = resolvePopularCategories(categories);
  function handleSearchSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const filters: BusinessSearchFilters = {
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

  return (
    <section className="relative bg-gradient-to-br from-hero-from via-[#121a2e] to-hero-to">
      {/* Decorative layers are clipped here so hero content (dropdowns) can overflow */}
      <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
        {/* Animated gradient wash */}
        <div className="animate-gradient-shift absolute inset-0 bg-gradient-to-br from-primary/15 via-transparent to-accent/10" />

        {/* Grid texture */}
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAxMCAwIEwgMCAwIDAgMTAiIGZpbGw9Im5vbmUiIHN0cm9rZT0icmdiYSgyNTUsMjU1LDI1NSwwLjAyNSkiIHN0cm9rZS13aWR0aD0iMSIvPjwvcGF0dGVybj48L2RlZnM+PHJlY3Qgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIgZmlsbD0idXJsKCNncmlkKSIvPjwvc3ZnPg==')] opacity-80" />

        {/* Floating orbs */}
        <div className="animate-float absolute -right-20 top-10 h-[28rem] w-[28rem] rounded-full bg-primary/20 blur-[100px]" />
        <div className="animate-float-delayed absolute -bottom-32 -left-20 h-80 w-80 rounded-full bg-accent/15 blur-[90px]" />
        <div className="animate-pulse-glow absolute left-1/2 top-1/3 h-64 w-64 -translate-x-1/2 rounded-full bg-indigo-500/10 blur-[80px]" />
      </div>

      <div className="relative mx-auto max-w-7xl px-4 pb-16 pt-12 sm:px-6 sm:pb-20 sm:pt-16 lg:px-8 lg:pb-24 lg:pt-20">
        {/* Hero copy */}
        <div className="mx-auto max-w-3xl text-center">
          <div className="animate-fade-up mb-6 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-4 py-1.5 text-sm text-slate-300 backdrop-blur-md">
            <ShieldCheck className="h-3.5 w-3.5 text-accent" aria-hidden />
            Verified listings across India
          </div>

          <h1 className="animate-fade-up text-4xl font-semibold tracking-[-0.03em] text-white sm:text-5xl md:text-6xl md:leading-[1.05] lg:text-[3.75rem] [animation-delay:80ms]">
            India&apos;s Trusted
            <br />
            <span className="bg-gradient-to-r from-white via-slate-100 to-slate-400 bg-clip-text text-transparent">
              Business Marketplace
            </span>
          </h1>

          <p className="animate-fade-up mx-auto mt-6 max-w-2xl text-base leading-relaxed text-slate-400 sm:mt-7 sm:text-lg sm:leading-8 md:text-xl [animation-delay:160ms]">
            Discover verified businesses for sale, connect with genuine buyers
            and sellers, and complete deals with confidence.
          </p>

          <div className="animate-fade-up mt-9 flex flex-col items-center justify-center gap-3 sm:mt-10 sm:flex-row sm:gap-4 [animation-delay:240ms]">
            <Button
              href="/listings"
              size="lg"
              className="h-12 w-full min-w-[200px] px-7 text-base font-semibold sm:w-auto"
            >
              Browse Businesses
              <ArrowRight className="h-4 w-4" aria-hidden />
            </Button>
            <Button
              href="/sell"
              variant="secondary"
              size="lg"
              className="h-12 w-full min-w-[200px] border-white/15 bg-white/[0.06] px-7 text-base font-semibold text-white shadow-none backdrop-blur-sm hover:border-white/25 hover:bg-white/10 hover:text-white active:bg-white/[0.14] focus-visible:ring-white/50 sm:w-auto"
            >
              List Your Business
            </Button>
          </div>

          <div className="animate-fade-up mt-10 flex flex-wrap items-center justify-center gap-x-8 gap-y-3 text-sm sm:mt-12 [animation-delay:320ms]">
            {trustLabels.map((label, index) => (
              <span key={label} className="contents">
                <span className="font-semibold text-slate-300">{label}</span>
                {index < trustLabels.length - 1 && (
                  <span
                    className="hidden h-1 w-1 rounded-full bg-slate-600 sm:block"
                    aria-hidden
                  />
                )}
              </span>
            ))}
          </div>
        </div>

        {/* Search card */}
        <div className="animate-fade-up relative z-20 mx-auto mt-14 max-w-4xl rounded-2xl border border-white/10 bg-white p-2 shadow-2xl shadow-black/30 sm:mt-16 sm:rounded-3xl sm:p-3 lg:mt-20 [animation-delay:400ms]">
          <div className="flex gap-1 overflow-x-auto rounded-xl bg-surface p-1 sm:gap-2">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`shrink-0 rounded-lg px-4 py-2.5 text-sm font-semibold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 ${
                  activeTab === tab.id
                    ? "bg-white text-foreground shadow-sm"
                    : "text-muted hover:text-foreground"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {activeTab === "buy" && (
            <form
              className="mt-3 space-y-3 p-2 sm:p-3"
              onSubmit={handleSearchSubmit}
            >
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
                  placeholder="Industry, keyword, or business type..."
                  className="h-12 w-full rounded-xl border border-border bg-white pl-12 pr-4 text-sm text-foreground placeholder:text-muted/70 transition-colors focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
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

              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <Button type="submit" size="lg" className="h-12 w-full sm:w-auto sm:px-8">
                  Search
                  <ArrowRight className="h-4 w-4" aria-hidden />
                </Button>
                {(location.stateId || selectedCategoryIds.length > 0) && (
                  <button
                    type="button"
                    onClick={() => {
                      setLocation(EMPTY_LOCATION);
                      setSelectedCategoryIds([]);
                    }}
                    className="rounded-sm text-sm font-medium text-muted transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary sm:mt-3"
                  >
                    Clear filters
                  </button>
                )}
              </div>
            </form>
          )}

          {activeTab === "sell" && (
            <div className="mt-3 grid gap-4 p-2 sm:grid-cols-2 sm:p-4">
              <div className="rounded-xl border border-border bg-surface p-5">
                <h3 className="font-semibold text-foreground">List privately</h3>
                <p className="mt-2 text-sm text-muted">
                  Reach qualified buyers without public exposure. NDAs and vetting
                  built in.
                </p>
                <Button href="/sell" size="sm" className="mt-4">
                  Start Selling
                </Button>
              </div>
              <div className="rounded-xl border border-border bg-surface p-5">
                <h3 className="font-semibold text-foreground">Broker-assisted</h3>
                <p className="mt-2 text-sm text-muted">
                  Work with a verified broker to manage your listing and deal flow.
                </p>
                <Button href="/brokers" variant="secondary" size="sm" className="mt-4">
                  Find a Broker
                </Button>
              </div>
            </div>
          )}

          {activeTab === "latest" && (
            <div className="mt-3 p-2 sm:p-4">
              <p className="text-sm text-muted">
                Browse the newest verified listings added in the last 7 days.
              </p>
              <Button href="/listings?sort=latest" size="md" className="mt-4">
                View Latest Listings
                <ArrowRight className="h-4 w-4" aria-hidden />
              </Button>
            </div>
          )}

          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border px-2 pb-1 pt-3 sm:px-4">
            <div className="flex flex-wrap gap-2">
              {popularCategories.map((category) => (
                <Link
                  key={category.id}
                  href={buildSearchHref({
                    categoryIds: [category.id],
                    page: 1,
                  })}
                  className="rounded-full border border-border bg-white px-3 py-1 text-xs font-medium text-muted transition-colors hover:border-primary/30 hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                >
                  {category.name}
                </Link>
              ))}
            </div>
            <Link
              href="/listings"
              className="inline-flex items-center gap-1.5 rounded-sm text-xs font-semibold text-primary hover:text-primary-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            >
              <SlidersHorizontal className="h-3.5 w-3.5" aria-hidden />
              Advanced Search
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
