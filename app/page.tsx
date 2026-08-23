import { Suspense } from "react";
import { ExploreCategoriesSection } from "@/components/home/ExploreCategoriesSection";
import {
  FeaturedCommercialSpacesSection,
  FeaturedCommercialSpacesSectionFallback,
} from "@/components/home/FeaturedCommercialSpacesSection";
import { Footer } from "@/components/home/Footer";
import {
  PremiumListingsSection,
  PremiumListingsSectionFallback,
} from "@/components/home/PremiumListingsSection";
import { Navbar } from "@/components/home/Navbar";
import { SearchHero } from "@/components/home/SearchHero";
import { SellerCtaSection } from "@/components/home/SellerCtaSection";
import { TrustBar } from "@/components/home/TrustBar";
import { getCurrentUser } from "@/lib/auth/session";
import {
  fetchBusinessCategories,
  fetchCommercialCategories,
} from "@/lib/repositories/categories.repository";
import { fetchStates } from "@/lib/repositories/locations.repository";

/** Fetch Supabase listing at request time (not build-time only) */
export const dynamic = "force-dynamic";

export default async function Home() {
  const [businessCategories, commercialCategories, states, user] =
    await Promise.all([
      fetchBusinessCategories(),
      fetchCommercialCategories(),
      fetchStates(),
      getCurrentUser(),
    ]);

  const isAuthenticated = Boolean(user);

  return (
    <>
      <Navbar />
      <main>
        <SearchHero
          businessCategories={businessCategories}
          commercialCategories={commercialCategories}
          states={states}
        />
        <Suspense fallback={<PremiumListingsSectionFallback />}>
          <PremiumListingsSection />
        </Suspense>
        <Suspense fallback={<FeaturedCommercialSpacesSectionFallback />}>
          <FeaturedCommercialSpacesSection />
        </Suspense>
        <ExploreCategoriesSection />
        <TrustBar />
        <SellerCtaSection isAuthenticated={isAuthenticated} />
      </main>
      <Footer />
    </>
  );
}
