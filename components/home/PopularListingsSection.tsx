import { ListingSection } from "@/components/home/ListingSection";
import { fetchBusinesses } from "@/lib/repositories/businesses.repository";

const HOME_POPULAR_LIMIT = 6;

const SECTION_PROPS = {
  id: "popular" as const,
  title: "Popular Businesses",
  subtitle: "Most viewed and enquired listings on Bizora right now.",
  viewAllHref: "/listings?sort=featured",
};

/**
 * MVP "Popular" is not analytics-based (no views/enquiry counts).
 * Definition: published businesses ordered by is_premium DESC, created_at DESC.
 */
export async function PopularListingsSection() {
  const { listings, error } = await fetchBusinesses({
    page: 1,
    pageSize: HOME_POPULAR_LIMIT,
    sort: "featured",
  });

  if (error) {
    return (
      <ListingSection
        {...SECTION_PROPS}
        errorHeading="Unable to load popular businesses"
        errorMessage={error}
      />
    );
  }

  if (listings.length === 0) {
    return (
      <ListingSection
        {...SECTION_PROPS}
        emptyMessage="No published listings yet"
      />
    );
  }

  return <ListingSection {...SECTION_PROPS} listings={listings} />;
}

export function PopularListingsSectionFallback() {
  return <ListingSection {...SECTION_PROPS} isLoading />;
}
