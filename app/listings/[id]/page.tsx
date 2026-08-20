import { BadgeCheck, ChevronRight, Sparkles } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { DetailSection } from "@/components/listing/DetailSection";
import { EnquiryForm, StickyEnquiryCard, type ContactSellerMode } from "@/components/listing/EnquiryForm";
import { FinancialMetrics } from "@/components/listing/FinancialMetrics";
import { ImageGallery } from "@/components/listing/ImageGallery";
import { ListingActions } from "@/components/listing/ListingActions";
import { ListingCard } from "@/components/home/ListingCard";
import { Footer } from "@/components/home/Footer";
import { Navbar } from "@/components/home/Navbar";
import { Button } from "@/components/ui/Button";
import { getCurrentProfile, getCurrentUser } from "@/lib/auth/session";
import {
  fetchBusinessById,
  fetchSimilarBusinesses,
} from "@/lib/repositories/businesses.repository";
import { isBusinessFavorited } from "@/lib/repositories/favorites.repository";

export const dynamic = "force-dynamic";

type PageProps = {
  params: Promise<{ id: string }>;
};

export async function generateMetadata({ params }: PageProps) {
  const { id } = await params;
  const { business } = await fetchBusinessById(id);

  if (!business) {
    return { title: "Business not found" };
  }

  const description =
    business.description?.slice(0, 160) ??
    `${business.title} for sale on Bizora.`;

  return {
    title: business.title,
    description,
    openGraph: {
      title: `${business.title} — Bizora`,
      description,
    },
  };
}

function BusinessDetailError() {
  return (
    <>
      <Navbar />
      <main className="flex flex-1 flex-col items-center justify-center px-4 py-24 text-center">
        <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
          Unable to load this business
        </h1>
        <p className="mt-4 max-w-md text-muted">
          We couldn&apos;t load this listing right now. Please try again shortly.
        </p>
        <Button href="/" size="lg" className="mt-8">
          Browse Businesses
        </Button>
      </main>
      <Footer />
    </>
  );
}

export default async function BusinessDetailPage({ params }: PageProps) {
  const { id } = await params;
  const { business, error } = await fetchBusinessById(id);

  if (error) {
    return <BusinessDetailError />;
  }

  if (!business) {
    notFound();
  }

  const similar = await fetchSimilarBusinesses(
    business.id,
    business.categoryId,
    3,
  );

  const user = await getCurrentUser();
  const profile = user ? await getCurrentProfile() : null;
  const signInHref = `/sign-in?next=${encodeURIComponent(`/listings/${id}`)}`;
  const initialFavorited = user
    ? await isBusinessFavorited(user.id, business.id)
    : false;

  let enquiryMode: ContactSellerMode = "form";
  if (!business.sellerId) {
    enquiryMode = "unavailable";
  } else if (!user) {
    enquiryMode = "sign-in";
  } else if (user.id === business.sellerId) {
    enquiryMode = "own-listing";
  }

  const enquiryFormProps = {
    businessId: business.id,
    businessTitle: business.title,
    mode: enquiryMode,
    buyerName: profile?.full_name,
    buyerEmail: user?.email,
  };

  return (
    <>
      <Navbar />
      <main className="bg-white">
        <div className="border-b border-border bg-surface/50">
          <nav
            aria-label="Breadcrumb"
            className="mx-auto flex max-w-7xl items-center gap-1.5 overflow-hidden px-4 py-3 text-sm text-muted sm:px-6 lg:px-8"
          >
            <Link
              href="/"
              className="shrink-0 rounded-sm transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            >
              Home
            </Link>
            <ChevronRight className="h-3.5 w-3.5 shrink-0" aria-hidden />
            <Link
              href="/listings"
              className="shrink-0 rounded-sm transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            >
              Listings
            </Link>
            <ChevronRight className="h-3.5 w-3.5 shrink-0" aria-hidden />
            <span
              className="truncate font-medium text-foreground"
              aria-current="page"
            >
              {business.title}
            </span>
          </nav>
        </div>

        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8 lg:py-10">
          <div className="mb-6 flex flex-col gap-4 sm:mb-8 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0 flex-1">
              <div className="mb-2 flex flex-wrap items-center gap-2">
                {business.isPremium && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-1 text-xs font-semibold text-amber-800">
                    <Sparkles className="h-3 w-3" aria-hidden />
                    Premium
                  </span>
                )}
                {business.isVerified && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-accent-light px-2.5 py-1 text-xs font-semibold text-accent">
                    <BadgeCheck className="h-3 w-3" aria-hidden />
                    Verified
                  </span>
                )}
                {business.category && (
                  <span className="rounded-full bg-primary-light px-2.5 py-1 text-xs font-medium text-primary">
                    {business.category}
                  </span>
                )}
              </div>
              <h1 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl lg:text-4xl">
                {business.title}
              </h1>
            </div>
            <ListingActions
              title={business.title}
              businessId={business.id}
              initialFavorited={initialFavorited}
              isAuthenticated={Boolean(user)}
              signInHref={signInHref}
            />
          </div>

          <ImageGallery images={business.images} title={business.title} />

          <div className="mt-8 grid gap-10 lg:mt-12 lg:grid-cols-[1fr_380px] lg:gap-12 xl:grid-cols-[1fr_400px]">
            <div className="min-w-0 space-y-10 sm:space-y-12">
              <FinancialMetrics
                price={business.askingPrice}
                location={business.location}
                category={business.category}
                revenue={business.annualRevenue}
                ebitda={business.ebitda}
                netProfit={business.annualProfit}
                establishedYear={business.establishedYear}
                employees={business.employees}
              />

              {business.description && (
                <DetailSection id="overview" title="Business overview">
                  <p className="text-base leading-relaxed break-words text-muted sm:leading-7">
                    {business.description}
                  </p>
                </DetailSection>
              )}

              {business.reasonForSale && (
                <DetailSection id="reason" title="Reason for sale">
                  <p className="text-base leading-relaxed break-words text-muted sm:leading-7">
                    {business.reasonForSale}
                  </p>
                </DetailSection>
              )}

              <div
                id="contact-seller"
                className="scroll-mt-24 rounded-2xl border border-border bg-surface p-6 lg:hidden"
              >
                <h2 className="text-lg font-semibold text-foreground">
                  Contact Seller
                </h2>
                <div className="mt-4">
                  {enquiryMode === "sign-in" ? (
                    <div className="space-y-4">
                      <EnquiryForm {...enquiryFormProps} compact />
                      <Button href={signInHref} size="lg" className="w-full">
                        Sign In to Enquire
                      </Button>
                    </div>
                  ) : (
                    <EnquiryForm {...enquiryFormProps} />
                  )}
                </div>
              </div>
            </div>

            <div className="hidden lg:block">
              <StickyEnquiryCard
                {...enquiryFormProps}
                signInHref={signInHref}
                price={business.askingPrice}
              />
            </div>
          </div>
        </div>

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
              {business.category && (
                <p className="mt-2 text-muted">
                  Other {business.category.toLowerCase()} businesses you may be
                  interested in.
                </p>
              )}
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
