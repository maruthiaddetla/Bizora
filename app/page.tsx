import { Suspense } from "react";
import { ArticlesSection } from "@/components/home/ArticlesSection";
import { CtaBanner } from "@/components/home/CtaBanner";
import { Footer } from "@/components/home/Footer";
import { LearnCards } from "@/components/home/LearnCards";
import { ListingSection } from "@/components/home/ListingSection";
import {
  PremiumListingsSection,
  PremiumListingsSectionFallback,
} from "@/components/home/PremiumListingsSection";
import { Navbar } from "@/components/home/Navbar";
import { SearchHero } from "@/components/home/SearchHero";
import { TrustBar } from "@/components/home/TrustBar";
import { latestListings, popularListings } from "@/lib/listings";

/** Fetch Supabase listing at request time (not build-time only) */
export const dynamic = "force-dynamic";

export default function Home() {
  return (
    <>
      <Navbar />
      <main>
        <SearchHero />
        <TrustBar />
        <Suspense fallback={<PremiumListingsSectionFallback />}>
          <PremiumListingsSection />
        </Suspense>
        <LearnCards />
        <ListingSection
          id="latest"
          title="Latest Listings"
          subtitle="Fresh opportunities added this week."
          listings={latestListings}
          viewAllHref="/listings?sort=latest"
          className="bg-surface"
        />
        <ListingSection
          id="popular"
          title="Popular Businesses"
          subtitle="Most viewed and enquired listings on Bizora right now."
          listings={popularListings}
          viewAllHref="/listings?sort=popular"
        />
        <ArticlesSection />
        <CtaBanner />
      </main>
      <Footer />
    </>
  );
}
