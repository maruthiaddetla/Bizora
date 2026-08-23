import { ListingSection } from "@/components/home/ListingSection";
import { fetchPremiumCommercialSpaces } from "@/lib/repositories/businesses.repository";

const SECTION_PROPS = {
  id: "commercial" as const,
  title: "Featured Commercial Spaces",
  subtitle: "Retail shops, offices, and commercial premises for business use.",
  viewAllHref: "/listings?type=commercial_space",
};

export async function FeaturedCommercialSpacesSection() {
  const { listings, error } = await fetchPremiumCommercialSpaces(6);

  if (error) {
    return (
      <ListingSection
        {...SECTION_PROPS}
        errorHeading="Unable to load commercial spaces"
        errorMessage={error}
      />
    );
  }

  if (listings.length === 0) {
    return (
      <ListingSection
        {...SECTION_PROPS}
        emptyMessage="No featured commercial spaces yet"
      />
    );
  }

  return <ListingSection {...SECTION_PROPS} listings={listings} />;
}

export function FeaturedCommercialSpacesSectionFallback() {
  return <ListingSection {...SECTION_PROPS} isLoading />;
}
