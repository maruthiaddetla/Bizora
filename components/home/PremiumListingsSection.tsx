import { ListingSection } from "@/components/home/ListingSection";
import { fetchFeaturedBusinesses } from "@/lib/repositories/businesses.repository";

const SECTION_PROPS = {
  id: "featured-businesses" as const,
  title: "Featured Businesses for Sale",
  viewAllHref: "/listings?type=business",
  columns: 4 as const,
};

export async function PremiumListingsSection() {
  const { listings, error } = await fetchFeaturedBusinesses(4);

  if (error) {
    return (
      <ListingSection
        {...SECTION_PROPS}
        className="bg-white"
        errorHeading="Unable to load featured businesses"
        errorMessage={error}
      />
    );
  }

  if (listings.length === 0) {
    return (
      <ListingSection
        {...SECTION_PROPS}
        className="bg-white"
        emptyMessage="No published businesses yet"
      />
    );
  }

  return <ListingSection {...SECTION_PROPS} listings={listings} className="bg-white" />;
}

export function PremiumListingsSectionFallback() {
  return <ListingSection {...SECTION_PROPS} isLoading className="bg-white" />;
}
