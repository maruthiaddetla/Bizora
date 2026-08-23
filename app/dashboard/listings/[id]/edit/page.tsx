import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CommercialSpaceForm } from "@/components/listings/CommercialSpaceForm";
import { ListingForm } from "@/components/listings/ListingForm";
import { Footer } from "@/components/home/Footer";
import { Navbar } from "@/components/home/Navbar";
import { Button } from "@/components/ui/Button";
import { requireUser } from "@/lib/auth/session";
import { commercialDefaultsFromRow } from "@/lib/listing-creation/commercial-form-defaults";
import { listingDefaultsFromRow } from "@/lib/listing-creation/form-defaults";
import { listBusinessImagesForOwner } from "@/lib/business-images/actions";
import { fetchOwnedBusinessById } from "@/lib/repositories/businesses.repository";
import {
  fetchBusinessCategories,
  fetchCommercialCategories,
} from "@/lib/repositories/categories.repository";
import {
  fetchCities,
  fetchDistricts,
  fetchLocalities,
  fetchStates,
} from "@/lib/repositories/locations.repository";

export const metadata: Metadata = {
  title: "Edit listing",
  description: "Edit your listing draft on Bizora.",
  robots: { index: false, follow: false },
};

type PageProps = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ saved?: string; error?: string }>;
};

export default async function EditListingPage({
  params,
  searchParams,
}: PageProps) {
  const { id } = await params;
  const query = await searchParams;
  const { user } = await requireUser(`/dashboard/listings/${id}/edit`);

  const { business, error } = await fetchOwnedBusinessById(id, user.id);

  if (error) {
    return (
      <>
        <Navbar />
        <main className="flex flex-1 flex-col items-center justify-center px-4 py-24 text-center">
          <h1 className="text-2xl font-bold text-foreground">
            Unable to load listing
          </h1>
          <p className="mt-3 max-w-md text-muted">
            We couldn&apos;t load this listing right now. Please try again
            shortly.
          </p>
          <Button href="/dashboard" className="mt-8">
            Back to dashboard
          </Button>
        </main>
        <Footer />
      </>
    );
  }

  if (!business) {
    notFound();
  }

  const isCommercial = business.listing_type === "commercial_space";

  const canEdit =
    business.status === "draft" || business.status === "rejected";

  if (!canEdit) {
    return (
      <>
        <Navbar />
        <main className="flex-1 bg-surface">
          <div className="mx-auto max-w-xl px-4 py-12 sm:px-6 lg:px-8">
            <div className="rounded-2xl border border-border bg-white p-6 shadow-sm sm:p-8">
              <h1 className="text-2xl font-bold text-foreground">
                Editing unavailable
              </h1>
              <p className="mt-3 text-muted">
                This listing is{" "}
                <span className="font-medium">{business.status}</span> and
                cannot be edited.
              </p>
              <div className="mt-6 flex flex-wrap gap-3">
                <Button href={`/dashboard/listings/${business.id}/preview`}>
                  Preview
                </Button>
                <Button href="/dashboard" variant="secondary">
                  Back to dashboard
                </Button>
              </div>
            </div>
          </div>
        </main>
        <Footer />
      </>
    );
  }

  const [
    businessCategories,
    commercialCategories,
    states,
    districts,
    cities,
    localities,
    imagesResult,
  ] = await Promise.all([
    fetchBusinessCategories(),
    fetchCommercialCategories(),
    fetchStates(),
    business.state_id ? fetchDistricts(business.state_id) : Promise.resolve([]),
    business.district_id
      ? fetchCities(business.district_id)
      : Promise.resolve([]),
    business.city_id ? fetchLocalities(business.city_id) : Promise.resolve([]),
    listBusinessImagesForOwner(business.id),
  ]);

  const initialImages =
    imagesResult.ok && imagesResult.images ? imagesResult.images : [];

  return (
    <>
      <Navbar />
      <main className="flex-1 bg-surface">
        <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 sm:py-10 lg:px-8">
          <div className="mb-6">
            <p className="text-sm text-muted">
              <Link
                href="/dashboard"
                className="font-medium text-primary hover:text-primary-hover"
              >
                Dashboard
              </Link>
              <span className="mx-2">/</span>
              Edit {isCommercial ? "commercial space" : "business"}
            </p>
            <h1 className="mt-2 text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
              Edit listing
            </h1>
          </div>

          {query.saved === "1" && (
            <div
              role="status"
              className="mb-6 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900"
            >
              Draft saved. Add photos below, then submit for review when ready.
            </div>
          )}

          {query.error === "submit" && (
            <div
              role="alert"
              className="mb-6 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950"
            >
              Your draft was saved, but submission needs a few more details.
            </div>
          )}

          {isCommercial ? (
            <CommercialSpaceForm
              mode="edit"
              categories={commercialCategories}
              states={states}
              initialDistricts={districts}
              initialCities={cities}
              initialLocalities={localities}
              defaults={commercialDefaultsFromRow(business)}
              rejectionReason={business.rejection_reason}
              initialImages={initialImages}
            />
          ) : (
            <ListingForm
              mode="edit"
              categories={businessCategories}
              states={states}
              initialDistricts={districts}
              initialCities={cities}
              initialLocalities={localities}
              defaults={listingDefaultsFromRow(business)}
              rejectionReason={business.rejection_reason}
              initialImages={initialImages}
            />
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}
