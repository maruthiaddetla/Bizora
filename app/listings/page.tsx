import { ListingCard } from "@/components/home/ListingCard";
import { Footer } from "@/components/home/Footer";
import { Navbar } from "@/components/home/Navbar";
import {
  ActiveFilters,
  buildActiveFilterChips,
} from "@/components/search/ActiveFilters";
import { ListingsFilters } from "@/components/search/ListingsFilters";
import { ListingsMarketplaceTabs } from "@/components/search/ListingsMarketplaceTabs";
import { ListingsPagination } from "@/components/search/ListingsPagination";
import { Button } from "@/components/ui/Button";
import { fetchBusinesses } from "@/lib/repositories/businesses.repository";
import {
  fetchBusinessCategories,
  fetchCategoriesByIds,
  fetchCommercialCategories,
} from "@/lib/repositories/categories.repository";
import {
  fetchCities,
  fetchDistricts,
  fetchLocalities,
  fetchLocationNameById,
  fetchStates,
} from "@/lib/repositories/locations.repository";
import {
  parseSearchParams,
  resolveSearchFilters,
  serializeSearchParams,
} from "@/lib/search/params";

export const dynamic = "force-dynamic";

type PageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export async function generateMetadata({ searchParams }: PageProps) {
  const params = await searchParams;
  const filters = parseSearchParams(params);
  const resolved = resolveSearchFilters(filters);
  const isCommercial = resolved.listingType === "commercial_space";

  if (filters.q) {
    return {
      title: isCommercial
        ? `Commercial spaces matching "${filters.q}"`
        : `Businesses matching "${filters.q}"`,
      description: isCommercial
        ? `Browse commercial spaces matching "${filters.q}".`
        : `Browse published businesses for sale matching "${filters.q}".`,
    };
  }

  return {
    title: isCommercial
      ? "Commercial Spaces for Rent & Lease"
      : "Businesses for Sale",
    description: isCommercial
      ? "Browse commercial spaces for rent and lease across India."
      : "Browse published businesses for sale across India.",
    openGraph: {
      title: isCommercial
        ? "Commercial Spaces — Bizora"
        : "Businesses for Sale — Bizora",
    },
  };
}

export default async function ListingsPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const filters = parseSearchParams(params);
  const resolved = resolveSearchFilters(filters);
  const isCommercial = resolved.listingType === "commercial_space";

  const [
    result,
    businessCategories,
    commercialCategories,
    states,
    initialDistricts,
    initialCities,
    initialLocalities,
    selectedCategories,
    stateName,
    districtName,
    cityName,
    localityName,
  ] = await Promise.all([
    fetchBusinesses(filters),
    fetchBusinessCategories(),
    fetchCommercialCategories(),
    fetchStates(),
    resolved.stateId ? fetchDistricts(resolved.stateId) : Promise.resolve([]),
    resolved.districtId ? fetchCities(resolved.districtId) : Promise.resolve([]),
    resolved.cityId ? fetchLocalities(resolved.cityId) : Promise.resolve([]),
    resolved.categoryIds?.length
      ? fetchCategoriesByIds(resolved.categoryIds)
      : Promise.resolve([]),
    fetchLocationNameById("states", resolved.stateId),
    fetchLocationNameById("districts", resolved.districtId),
    fetchLocationNameById("cities", resolved.cityId),
    fetchLocationNameById("localities", resolved.localityId),
  ]);

  const categories = isCommercial ? commercialCategories : businessCategories;

  const activeChips = buildActiveFilterChips(filters, {
    categories: selectedCategories,
    stateName,
    districtName,
    cityName,
    localityName,
  });

  const formKey = serializeSearchParams(filters).toString();
  const heading = filters.q
    ? isCommercial
      ? `Commercial spaces matching "${filters.q}"`
      : `Businesses matching "${filters.q}"`
    : isCommercial
      ? "Commercial Spaces"
      : "Businesses for Sale";

  const entityLabel = isCommercial ? "commercial space" : "business";
  const summary =
    result.error == null
      ? result.total === 1
        ? `1 ${entityLabel} found`
        : `${result.total.toLocaleString("en-IN")} ${entityLabel}${result.total === 1 ? "" : "es"} found`
      : null;

  return (
    <>
      <Navbar />
      <main className="bg-surface">
        <div className="border-b border-border bg-white">
          <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-10 lg:px-8">
            <ListingsMarketplaceTabs
              activeType={resolved.listingType}
              filters={filters}
            />
            <h1 className="mt-6 text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
              {heading}
            </h1>
            {summary && (
              <p className="mt-2 text-base text-muted">{summary}</p>
            )}

            <div className="mt-6">
              <ListingsFilters
                key={formKey}
                listingType={resolved.listingType}
                initialFilters={filters}
                categories={categories}
                states={states}
                initialDistricts={initialDistricts}
                initialCities={initialCities}
                initialLocalities={initialLocalities}
              />
            </div>

            {activeChips.length > 0 && (
              <div className="mt-4">
                <ActiveFilters chips={activeChips} />
              </div>
            )}
          </div>
        </div>

        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-10 lg:px-8">
          {result.error ? (
            <div
              className="rounded-2xl border border-red-200 bg-red-50 px-6 py-10 text-center"
              role="alert"
            >
              <p className="font-medium text-red-900">Unable to load listings</p>
              <p className="mt-2 text-sm text-red-700">{result.error}</p>
              <Button
                href={isCommercial ? "/listings?type=commercial_space" : "/listings"}
                size="md"
                className="mt-6"
              >
                Try again
              </Button>
            </div>
          ) : result.listings.length === 0 ? (
            <div className="rounded-2xl border border-border bg-white px-6 py-14 text-center">
              <h2 className="text-xl font-semibold text-foreground">
                No {isCommercial ? "commercial spaces" : "businesses"} found
              </h2>
              <p className="mx-auto mt-2 max-w-md text-muted">
                Try adjusting your search criteria or removing some filters.
              </p>
              <Button
                href={isCommercial ? "/listings?type=commercial_space" : "/listings"}
                size="md"
                className="mt-6"
              >
                Clear all filters
              </Button>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {result.listings.map((listing) => (
                  <ListingCard key={listing.id} listing={listing} />
                ))}
              </div>

              <ListingsPagination
                filters={filters}
                page={result.page}
                hasMore={result.hasMore}
                total={result.total}
                pageSize={result.pageSize}
              />
            </>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}
