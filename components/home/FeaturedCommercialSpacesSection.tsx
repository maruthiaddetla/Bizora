import { ListingSection } from "@/components/home/ListingSection";
import { fetchFeaturedCommercialSpaces } from "@/lib/repositories/businesses.repository";

const SECTION_PROPS = {
  id: "featured-commercial" as const,
  title: "Featured Commercial Spaces",
  viewAllHref: "/listings?type=commercial_space",
  columns: 4 as const,
};

export async function FeaturedCommercialSpacesSection() {
  const { listings, error } = await fetchFeaturedCommercialSpaces(4);

  if (error) {
    return (
      <ListingSection
        {...SECTION_PROPS}
        className="bg-surface"
        errorHeading="Unable to load commercial spaces"
        errorMessage={error}
      />
    );
  }

  if (listings.length === 0) {
    return (
      <ListingSection
        {...SECTION_PROPS}
        className="bg-surface"
        emptyMessage="No commercial spaces listed yet — check back soon or list your space."
      />
    );
  }

  return (
    <ListingSection {...SECTION_PROPS} listings={listings} className="bg-surface" />
  );
}

export function FeaturedCommercialSpacesSectionFallback() {
  return (
    <ListingSection {...SECTION_PROPS} isLoading className="bg-surface" />
  );
}
