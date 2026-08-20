import { ListingSection } from "@/components/home/ListingSection";
import { fetchBusinesses } from "@/lib/repositories/businesses.repository";

const HOME_LATEST_LIMIT = 6;

const SECTION_PROPS = {
  id: "latest" as const,
  title: "Latest Listings",
  subtitle: "Fresh opportunities added this week.",
  viewAllHref: "/listings?sort=newest",
  className: "bg-surface",
};

export async function LatestListingsSection() {
  const { listings, error } = await fetchBusinesses({
    page: 1,
    pageSize: HOME_LATEST_LIMIT,
    sort: "newest",
  });

  if (error) {
    return (
      <ListingSection
        {...SECTION_PROPS}
        errorHeading="Unable to load latest listings"
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

export function LatestListingsSectionFallback() {
  return <ListingSection {...SECTION_PROPS} isLoading />;
}
