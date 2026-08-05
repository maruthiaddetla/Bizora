import { ChevronRight, Sparkles } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { BulletList } from "@/components/listing/BulletList";
import { BusinessMap } from "@/components/listing/BusinessMap";
import { DetailSection } from "@/components/listing/DetailSection";
import { EnquiryForm } from "@/components/listing/EnquiryForm";
import { FinancialMetrics } from "@/components/listing/FinancialMetrics";
import { ImageGallery } from "@/components/listing/ImageGallery";
import { ListingActions } from "@/components/listing/ListingActions";
import { SellerCard } from "@/components/listing/SellerCard";
import { StickyEnquiryCard } from "@/components/listing/EnquiryForm";
import { ListingCard } from "@/components/home/ListingCard";
import { Footer } from "@/components/home/Footer";
import { Navbar } from "@/components/home/Navbar";
import {
  getAllListingIds,
  getBusinessDetail,
} from "@/lib/business-details";
import { getSimilarListings } from "@/lib/listings";

type PageProps = {
  params: Promise<{ id: string }>;
};

export function generateStaticParams() {
  return getAllListingIds().map((id) => ({ id }));
}

export async function generateMetadata({ params }: PageProps) {
  const { id } = await params;
  const business = getBusinessDetail(id);
  if (!business) return { title: "Listing Not Found — Bizora" };

  return {
    title: `${business.title} — Bizora`,
    description: business.overview.slice(0, 160),
  };
}

export default async function BusinessDetailPage({ params }: PageProps) {
  const { id } = await params;
  const business = getBusinessDetail(id);

  if (!business) notFound();

  const similar = getSimilarListings(id, 3);

  return (
    <>
      <Navbar />
      <main className="bg-white">
        {/* Breadcrumb */}
        <div className="border-b border-border bg-surface/50">
          <nav
            aria-label="Breadcrumb"
            className="mx-auto flex max-w-7xl items-center gap-1.5 px-4 py-3 text-sm text-muted sm:px-6 lg:px-8"
          >
            <Link
              href="/"
              className="transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-sm"
            >
              Home
            </Link>
            <ChevronRight className="h-3.5 w-3.5 shrink-0" aria-hidden />
            <Link
              href="/listings"
              className="transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-sm"
            >
              Listings
            </Link>
            <ChevronRight className="h-3.5 w-3.5 shrink-0" aria-hidden />
            <span className="truncate font-medium text-foreground" aria-current="page">
              {business.title}
            </span>
          </nav>
        </div>

        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8 lg:py-10">
          {/* Header */}
          <div className="mb-6 flex flex-col gap-4 sm:mb-8 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0 flex-1">
              <div className="mb-2 flex flex-wrap items-center gap-2">
                {business.premium && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-1 text-xs font-semibold text-amber-800">
                    <Sparkles className="h-3 w-3" aria-hidden />
                    Premium Listing
                  </span>
                )}
                <span className="rounded-full bg-primary-light px-2.5 py-1 text-xs font-medium text-primary">
                  {business.category}
                </span>
              </div>
              <h1 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl lg:text-4xl">
                {business.title}
              </h1>
            </div>
            <ListingActions title={business.title} />
          </div>

          {/* Gallery */}
          <ImageGallery images={business.images} title={business.title} />

          {/* Content grid */}
          <div className="mt-8 grid gap-10 lg:mt-12 lg:grid-cols-[1fr_380px] lg:gap-12 xl:grid-cols-[1fr_400px]">
            {/* Main column */}
            <div className="min-w-0 space-y-10 sm:space-y-12">
              <FinancialMetrics
                price={business.price!}
                location={business.location}
                industry={business.industry}
                revenue={business.revenue}
                ebitda={business.ebitda}
                netProfit={business.netProfit}
                establishedYear={business.establishedYear}
                employees={business.employees}
              />

              <DetailSection id="overview" title="Business overview">
                <p className="text-base leading-relaxed text-muted sm:leading-7">
                  {business.overview}
                </p>
              </DetailSection>

              <DetailSection id="reason" title="Reason for sale">
                <p className="text-base leading-relaxed text-muted sm:leading-7">
                  {business.reasonForSale}
                </p>
              </DetailSection>

              <DetailSection id="assets" title="Assets included">
                <BulletList items={business.assetsIncluded} />
              </DetailSection>

              <DetailSection id="facilities" title="Facilities">
                <BulletList items={business.facilities} />
              </DetailSection>

              <DetailSection id="growth" title="Growth opportunities">
                <BulletList items={business.growthOpportunities} />
              </DetailSection>

              <DetailSection id="location" title="Location">
                <BusinessMap
                  lat={business.coordinates.lat}
                  lng={business.coordinates.lng}
                  address={business.address}
                  title={business.title}
                />
              </DetailSection>

              <SellerCard seller={business.seller} address={business.address} />

              {/* Mobile enquiry */}
              <div className="rounded-2xl border border-border bg-surface p-6 lg:hidden">
                <h2 className="text-lg font-semibold text-foreground">
                  Send an enquiry
                </h2>
                <div className="mt-4">
                  <EnquiryForm businessTitle={business.title} />
                </div>
              </div>
            </div>

            {/* Sticky sidebar — desktop only */}
            <div className="hidden lg:block">
              <StickyEnquiryCard
                businessTitle={business.title}
                price={business.price!}
                sellerName={business.seller.name}
              />
            </div>
          </div>
        </div>

        {/* Similar listings */}
        {similar.length > 0 && (
          <section
            className="border-t border-border bg-surface py-14 sm:py-20"
            aria-labelledby="similar-heading"
          >
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
              <h2
                id="similar-heading"
                className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl"
              >
                Similar listings
              </h2>
              <p className="mt-2 text-muted">
                Other {business.category.toLowerCase()} businesses you may be
                interested in.
              </p>
              <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {similar.map((listing) => (
                  <ListingCard key={listing.id} listing={listing} />
                ))}
              </div>
            </div>
          </section>
        )}
      </main>
      <Footer />
    </>
  );
}
