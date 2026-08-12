import { ListingSection } from "@/components/home/ListingSection";
import { fetchPremiumBusinesses } from "@/lib/repositories/businesses.repository";

const SECTION_PROPS = {
  id: "premium" as const,
  title: "Premium Opportunities",
  subtitle:
    "Hand-picked listings with verified financials and serious seller intent.",
  viewAllHref: "/listings?premium=true",
};

export async function PremiumListingsSection() {
  const { listings, error } = await fetchPremiumBusinesses(6);

  if (error) {
    return (
      <ListingSection
        {...SECTION_PROPS}
        errorMessage={error}
      />
    );
  }

  if (listings.length === 0) {
    return (
      <ListingSection
        {...SECTION_PROPS}
        emptyMessage="No premium opportunities available"
      />
    );
  }

  return <ListingSection {...SECTION_PROPS} listings={listings} />;
}

/** Shown while the Supabase request is in flight */
export function PremiumListingsSectionFallback() {
  return <ListingSection {...SECTION_PROPS} isLoading />;
}
