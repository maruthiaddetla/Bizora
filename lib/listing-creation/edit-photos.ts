import type { BusinessImageView } from "@/lib/business-images/types";

/**
 * Resolves which listing id the Edit photos UI must query, and whether a
 * published→revision image backfill may be required first.
 *
 * Dashboard may link to either the published id or an existing revision id.
 */
export function resolveEditPhotosTarget(listing: {
  id: string;
  status: string;
  supersedes_id?: string | null;
}): {
  photosListingId: string;
  publishedIdForBackfill: string | null;
  isRevision: boolean;
} {
  const publishedParent = listing.supersedes_id ?? null;
  if (publishedParent) {
    return {
      photosListingId: listing.id,
      publishedIdForBackfill: publishedParent,
      isRevision: true,
    };
  }

  return {
    photosListingId: listing.id,
    publishedIdForBackfill: null,
    isRevision: false,
  };
}

/**
 * Maps listBusinessImagesForOwner result into ListingForm initialImages.
 * Empty / failed loads become [] so the Photos section shows the empty state.
 */
export function initialImagesForEditForm(result: {
  ok: boolean;
  images?: BusinessImageView[];
}): BusinessImageView[] {
  if (!result.ok || !result.images) return [];
  return result.images;
}

/**
 * Seller dashboard Edit href for a primary listing card.
 * Always uses the primary listing id (published/draft/…). For published rows
 * the edit page creates/finds the revision and backfills images before render.
 */
export function sellerDashboardEditHref(listing: {
  id: string;
  status: string;
}): string {
  return `/dashboard/listings/${listing.id}/edit`;
}
