import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { CommercialSpaceForm } from "@/components/listings/CommercialSpaceForm";
import { ListingForm } from "@/components/listings/ListingForm";
import { Footer } from "@/components/home/Footer";
import { Navbar } from "@/components/home/Navbar";
import { Button } from "@/components/ui/Button";
import { requireUser } from "@/lib/auth/session";
import {
  canSellerOpenEdit,
  isOwnerEditableStatus,
  isPublishedEditRevision,
} from "@/lib/listing-creation/editability";
import { commercialDefaultsFromRow } from "@/lib/listing-creation/commercial-form-defaults";
import { listingDefaultsFromRow } from "@/lib/listing-creation/form-defaults";
import { ensurePublishedEditRevision, ensureRevisionImagesForEdit } from "@/lib/listing-creation/revision";
import {
  initialImagesForEditForm,
  resolveEditPhotosTarget,
} from "@/lib/listing-creation/edit-photos";
import { listBusinessImagesForOwner } from "@/lib/business-images/actions";
import { fetchOwnedBusinessById } from "@/lib/repositories/businesses.repository";
import {
  fetchBusinessCategories,
  fetchCommercialCategories,
} from "@/lib/repositories/categories.repository";
import {
  fetchCitiesByState,
  fetchStates,
} from "@/lib/repositories/locations.repository";

export const metadata: Metadata = {
  title: "Edit listing",
  description: "Edit your listing on Bizora.",
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

  // Published listings are edited via a sibling revision so the live listing
  // stays visible until admin approval.
  if (business.status === "published") {
    const revision = await ensurePublishedEditRevision(business.id, user.id);
    if (!revision.ok) {
      return (
        <>
          <Navbar />
          <main className="flex flex-1 flex-col items-center justify-center px-4 py-24 text-center">
            <h1 className="text-2xl font-bold text-foreground">
              Unable to edit listing
            </h1>
            <p className="mt-3 max-w-md text-muted">{revision.message}</p>
            <Button href="/dashboard" className="mt-8">
              Back to dashboard
            </Button>
          </main>
          <Footer />
        </>
      );
    }
    redirect(`/dashboard/listings/${revision.revisionId}/edit`);
  }

  if (!canSellerOpenEdit(business.status) || !isOwnerEditableStatus(business.status)) {
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

  const isCommercial = business.listing_type === "commercial_space";
  const isRevision = isPublishedEditRevision(business);
  const photosTarget = resolveEditPhotosTarget(business);

  // Dashboard may deep-link to a revision id. Backfill images from the
  // published parent before the Photos section reads business_images.
  if (photosTarget.publishedIdForBackfill) {
    const ensured = await ensureRevisionImagesForEdit(business.id, user.id);
    if (!ensured.ok) {
      return (
        <>
          <Navbar />
          <main className="flex flex-1 flex-col items-center justify-center px-4 py-24 text-center">
            <h1 className="text-2xl font-bold text-foreground">
              Unable to load photos
            </h1>
            <p className="mt-3 max-w-md text-muted">{ensured.message}</p>
            <Button href="/dashboard" className="mt-8">
              Back to dashboard
            </Button>
          </main>
          <Footer />
        </>
      );
    }
  }

  const [
    businessCategories,
    commercialCategories,
    states,
    cities,
    imagesResult,
  ] = await Promise.all([
    fetchBusinessCategories(),
    fetchCommercialCategories(),
    fetchStates(),
    business.state_id
      ? fetchCitiesByState(business.state_id)
      : Promise.resolve([]),
    listBusinessImagesForOwner(photosTarget.photosListingId),
  ]);

  const initialImages = initialImagesForEditForm(imagesResult);

  console.info("[Bizora] edit page photos props:", {
    routeListingId: id,
    photosListingId: photosTarget.photosListingId,
    publishedIdForBackfill: photosTarget.publishedIdForBackfill,
    isRevision: photosTarget.isRevision,
    initialImageCount: initialImages.length,
    initialImageIds: initialImages.map((image) => image.id),
  });

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
            {isRevision && (
              <p className="mt-2 text-sm text-muted">
                You are editing a published listing. Changes go to review first —
                buyers keep seeing the current live version until approval.
              </p>
            )}
            {business.status === "pending" && !isRevision && (
              <p className="mt-2 text-sm text-muted">
                This listing is under review. Saving updates keeps it in review;
                submit again when your changes are ready.
              </p>
            )}
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
              initialCities={cities}
              defaults={commercialDefaultsFromRow(business)}
              rejectionReason={business.rejection_reason}
              initialImages={initialImages}
            />
          ) : (
            <ListingForm
              mode="edit"
              categories={businessCategories}
              states={states}
              initialCities={cities}
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
