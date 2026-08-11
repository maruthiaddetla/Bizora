import { ListingSection } from "@/components/home/ListingSection";
import { fetchFeaturedPremiumBusiness } from "@/lib/repositories/businesses.repository";
import { premiumListings } from "@/lib/listings";

/**
 * First card: Supabase (when available).
 * Remaining cards: existing hardcoded data.
 */
export async function PremiumListingsSection() {
  const { listing, error } = await fetchFeaturedPremiumBusiness();

  const listings =
    listing !== null
      ? [listing, ...premiumListings.filter((item) => item.id !== listing.id).slice(0, 5)]
      : premiumListings;

  return (
    <>
      {error && process.env.NODE_ENV === "development" && (
        <p className="sr-only" role="status">
          Supabase fallback active: {error}
        </p>
      )}
      <ListingSection
        id="premium"
        title="Premium Opportunities"
        subtitle="Hand-picked listings with verified financials and serious seller intent."
        listings={listings}
        viewAllHref="/listings?premium=true"
      />
    </>
  );
}

/** Shown while the Supabase request is in flight */
export function PremiumListingsSectionFallback() {
  return (
    <ListingSection
      id="premium"
      title="Premium Opportunities"
      subtitle="Hand-picked listings with verified financials and serious seller intent."
      listings={premiumListings}
      viewAllHref="/listings?premium=true"
    />
  );
}
