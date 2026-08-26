import Image from "next/image";
import { Footer } from "@/components/home/Footer";
import { Navbar } from "@/components/home/Navbar";
import { Button } from "@/components/ui/Button";
import {
  closedListingBrowseHref,
  closedListingHeadline,
} from "@/lib/listing-lifecycle/helpers";
import type { ClosedListingPublicView } from "@/lib/repositories/closed-listings.repository";

type ClosedListingPageProps = {
  listing: ClosedListingPublicView;
};

export function ClosedListingPage({ listing }: ClosedListingPageProps) {
  const headline = closedListingHeadline(listing.status);
  const browseHref = closedListingBrowseHref(listing.listingType);
  const statusNote =
    listing.status === "sold"
      ? "This listing has been marked as sold."
      : listing.status === "leased"
        ? "This listing has been marked as leased."
        : "This listing has been withdrawn.";

  return (
    <>
      <Navbar />
      <main className="bg-surface">
        <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
          <div className="overflow-hidden rounded-2xl border border-border bg-white shadow-sm">
            <div className="relative h-48 w-full bg-surface sm:h-56">
              <Image
                src={listing.image}
                alt=""
                fill
                className="object-cover opacity-80"
                sizes="(max-width: 768px) 100vw, 768px"
                priority
              />
              <div className="absolute inset-0 bg-navy/45" aria-hidden />
              <div className="absolute inset-0 flex items-center justify-center p-4">
                <p className="rounded-full bg-white px-4 py-1.5 text-sm font-bold tracking-wide text-navy">
                  {headline}
                </p>
              </div>
            </div>

            <div className="p-6 text-center sm:p-8">
              <h1 className="text-2xl font-bold tracking-tight text-navy sm:text-3xl">
                {listing.title}
              </h1>
              {(listing.category || listing.location) && (
                <p className="mt-2 text-sm text-muted">
                  {[listing.category, listing.location]
                    .filter(Boolean)
                    .join(" · ")}
                </p>
              )}
              <p className="mx-auto mt-4 max-w-md text-base text-muted">
                This listing is no longer available.
              </p>
              <p className="mt-2 text-sm text-muted">{statusNote}</p>
              <Button href={browseHref} size="lg" className="mt-8">
                Browse Available Listings
              </Button>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
