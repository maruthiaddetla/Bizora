import { describe, expect, it } from "vitest";
import {
  initialImagesForEditForm,
  resolveEditPhotosTarget,
  sellerDashboardEditHref,
} from "@/lib/listing-creation/edit-photos";
import {
  buildRevisionImageClones,
  revisionNeedsImageBackfill,
} from "@/lib/listing-creation/revision-images";
import type { BusinessImageView } from "@/lib/business-images/types";

const publishedId = "4866c038-57d4-4ad0-b8b7-d0ddb89d05c4";
const revisionId = "9e88ad39-95fc-4be7-ab5b-afdf2dd360a6";
const sellerId = "c8e07786-76e8-41f3-a62c-310133d6b83a";

/**
 * Reproduces the real Edit runtime path for a published listing that already
 * has photos, including the case where an empty pre-fix revision exists and
 * the dashboard deep-links to the revision id.
 */
describe("published Edit → photos on edit form (runtime path)", () => {
  it("dashboard Edit for published listings always uses the published id", () => {
    expect(
      sellerDashboardEditHref({ id: publishedId, status: "published" }),
    ).toBe(`/dashboard/listings/${publishedId}/edit`);
  });

  it("when Edit opens a revision row, photos must load for REVISION_ID after backfill", () => {
    const target = resolveEditPhotosTarget({
      id: revisionId,
      status: "draft",
      supersedes_id: publishedId,
    });

    expect(target.isRevision).toBe(true);
    expect(target.photosListingId).toBe(revisionId);
    expect(target.publishedIdForBackfill).toBe(publishedId);
  });

  it("published listing with existing images → empty revision → backfill → form receives images", () => {
    const publishedImages = [
      {
        image_url: `${sellerId}/${publishedId}/2dd35167-ce41-42b0-b958-af487bb86363.png`,
        storage_path: `${sellerId}/${publishedId}/2dd35167-ce41-42b0-b958-af487bb86363.png`,
        sort_order: 0,
        is_primary: true,
      },
    ];

    // Pre-020 / failed-clone state observed in production:
    const revisionImageCountBefore = 0;
    expect(
      revisionNeedsImageBackfill({
        revisionImageCount: revisionImageCountBefore,
        publishedImageCount: publishedImages.length,
      }),
    ).toBe(true);

    const clonedRows = buildRevisionImageClones(revisionId, publishedImages);
    expect(clonedRows).toHaveLength(1);
    expect(clonedRows[0].business_id).toBe(revisionId);
    expect(clonedRows[0].storage_path).toBe(publishedImages[0].storage_path);
    expect(clonedRows[0].is_primary).toBe(true);

    // What listBusinessImagesForOwner(revisionId) returns after backfill,
    // then mapped into ListingForm / BusinessPhotosManager props:
    const loadedForForm: BusinessImageView[] = [
      {
        id: "bdecfb0f-6579-43ae-bf1d-909ba58fa835",
        businessId: revisionId,
        sortOrder: 0,
        isPrimary: true,
        displayUrl: "https://example.supabase.co/storage/v1/object/sign/...",
        storagePath: publishedImages[0].storage_path,
      },
    ];

    const photosTarget = resolveEditPhotosTarget({
      id: revisionId,
      status: "draft",
      supersedes_id: publishedId,
    });
    expect(photosTarget.photosListingId).toBe(revisionId);

    const initialImages = initialImagesForEditForm({
      ok: true,
      images: loadedForForm,
    });

    expect(initialImages).toHaveLength(1);
    expect(initialImages[0].businessId).toBe(revisionId);
    expect(initialImages[0].storagePath).toContain(`/${publishedId}/`);
    expect(initialImages[0].isPrimary).toBe(true);
  });

  it("does not pass empty photos to the form when the owner query succeeds with rows", () => {
    const initialImages = initialImagesForEditForm({
      ok: true,
      images: [
        {
          id: "img-1",
          businessId: revisionId,
          sortOrder: 0,
          isPrimary: true,
          displayUrl: "https://cdn.example/photo.jpg",
          storagePath: `${sellerId}/${publishedId}/img-1.jpg`,
        },
      ],
    });
    expect(initialImages).not.toEqual([]);
    expect(initialImages[0].displayUrl).toContain("http");
  });

  it("shows empty Photos state only when the revision truly has no images", () => {
    expect(initialImagesForEditForm({ ok: true, images: [] })).toEqual([]);
    expect(initialImagesForEditForm({ ok: false })).toEqual([]);
  });
});
