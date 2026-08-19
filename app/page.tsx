import { Suspense } from "react";
import { ArticlesSection } from "@/components/home/ArticlesSection";
import { CtaBanner } from "@/components/home/CtaBanner";
import { Footer } from "@/components/home/Footer";
import { LearnCards } from "@/components/home/LearnCards";
import {
  LatestListingsSection,
  LatestListingsSectionFallback,
} from "@/components/home/LatestListingsSection";
import {
  PopularListingsSection,
  PopularListingsSectionFallback,
} from "@/components/home/PopularListingsSection";
import {
  PremiumListingsSection,
  PremiumListingsSectionFallback,
} from "@/components/home/PremiumListingsSection";
import { Navbar } from "@/components/home/Navbar";
import { SearchHero } from "@/components/home/SearchHero";
import { TrustBar } from "@/components/home/TrustBar";
import { fetchActiveCategories } from "@/lib/repositories/categories.repository";
import { fetchStates } from "@/lib/repositories/locations.repository";

/** Fetch Supabase listing at request time (not build-time only) */
export const dynamic = "force-dynamic";

export default async function Home() {
  const [categories, states] = await Promise.all([
    fetchActiveCategories(),
    fetchStates(),
  ]);

  return (
    <>
      <Navbar />
      <main>
        <SearchHero categories={categories} states={states} />
        <TrustBar />
        <Suspense fallback={<PremiumListingsSectionFallback />}>
          <PremiumListingsSection />
        </Suspense>
        <LearnCards />
        <Suspense fallback={<LatestListingsSectionFallback />}>
          <LatestListingsSection />
        </Suspense>
        <Suspense fallback={<PopularListingsSectionFallback />}>
          <PopularListingsSection />
        </Suspense>
        <ArticlesSection />
        <CtaBanner />
      </main>
      <Footer />
    </>
  );
}
