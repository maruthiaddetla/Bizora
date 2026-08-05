import { ArticlesSection } from "@/components/home/ArticlesSection";
import { CtaBanner } from "@/components/home/CtaBanner";
import { Footer } from "@/components/home/Footer";
import { LearnCards } from "@/components/home/LearnCards";
import { ListingSection } from "@/components/home/ListingSection";
import { Navbar } from "@/components/home/Navbar";
import { SearchHero } from "@/components/home/SearchHero";
import { TrustBar } from "@/components/home/TrustBar";
import {
  latestListings,
  popularListings,
  premiumListings,
} from "@/lib/listings";

export default function Home() {
  return (
    <>
      <Navbar />
      <main>
        <SearchHero />
        <TrustBar />
        <ListingSection
          id="premium"
          title="Premium Opportunities"
          subtitle="Hand-picked listings with verified financials and serious seller intent."
          listings={premiumListings}
          viewAllHref="/listings?premium=true"
        />
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
