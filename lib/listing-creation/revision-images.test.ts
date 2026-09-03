import { describe, expect, it } from "vitest";
import {
  buildRevisionImageClones,
  revisionNeedsImageBackfill,
  shouldRemoveStorageObject,
} from "@/lib/listing-creation/revision-images";

const publishedId = "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa";
const revisionId = "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb";
const sellerId = "cccccccc-cccc-cccc-cccc-cccccccccccc";

describe("revision image cloning", () => {
  it("copies published images onto the revision with order and primary preserved", () => {
    const clones = buildRevisionImageClones(revisionId, [
      {
        image_url: "placeholder",
        storage_path: `${sellerId}/${publishedId}/img1.jpg`,
        sort_order: 0,
        is_primary: true,
      },
      {
        image_url: "placeholder",
        storage_path: `${sellerId}/${publishedId}/img2.jpg`,
        sort_order: 1,
        is_primary: false,
      },
    ]);

    expect(clones).toHaveLength(2);
    expect(clones[0]).toEqual({
      business_id: revisionId,
      image_url: "placeholder",
      storage_path: `${sellerId}/${publishedId}/img1.jpg`,
      sort_order: 0,
      is_primary: true,
    });
    expect(clones[1].business_id).toBe(revisionId);
    expect(clones[1].is_primary).toBe(false);
    expect(clones[1].sort_order).toBe(1);
  });

  it("retains images for submit-without-change by cloning all source rows", () => {
    const source = [
      {
        image_url: "a",
        storage_path: `${sellerId}/${publishedId}/a.jpg`,
        sort_order: 0,
        is_primary: true,
      },
      {
        image_url: "b",
        storage_path: `${sellerId}/${publishedId}/b.jpg`,
        sort_order: 1,
        is_primary: false,
      },
    ];
    const clones = buildRevisionImageClones(revisionId, source);
    expect(clones.map((row) => row.storage_path)).toEqual(
      source.map((row) => row.storage_path),
    );
  });

  it("supports add-image by keeping prior clones intact when building from source", () => {
    const existingOnRevision = buildRevisionImageClones(revisionId, [
      {
        image_url: "old",
        storage_path: `${sellerId}/${publishedId}/old.jpg`,
        sort_order: 0,
        is_primary: true,
      },
    ]);
    const afterAdd = [
      ...existingOnRevision,
      {
        business_id: revisionId,
        image_url: "placeholder",
        storage_path: `${sellerId}/${revisionId}/new.jpg`,
        sort_order: 1,
        is_primary: false,
      },
    ];
    expect(afterAdd).toHaveLength(2);
    expect(afterAdd[0].storage_path).toContain(`/${publishedId}/`);
    expect(afterAdd[1].storage_path).toContain(`/${revisionId}/`);
  });

  it("preserves primary when cloning, and allows a later primary change on revision only", () => {
    const clones = buildRevisionImageClones(revisionId, [
      {
        image_url: "one",
        storage_path: `${sellerId}/${publishedId}/1.jpg`,
        sort_order: 0,
        is_primary: true,
      },
      {
        image_url: "two",
        storage_path: `${sellerId}/${publishedId}/2.jpg`,
        sort_order: 1,
        is_primary: false,
      },
    ]);

    const reordered = clones.map((row, index) => ({
      ...row,
      sort_order: index === 0 ? 1 : 0,
      is_primary: index === 1,
    }));

    expect(reordered.find((row) => row.is_primary)?.storage_path).toContain(
      "2.jpg",
    );
    // Published paths are unchanged references; published rows are separate.
    expect(clones[0].is_primary).toBe(true);
  });
});

describe("revision image backfill", () => {
  it("backfills when Edit opens a revision that has no photos yet", () => {
    expect(
      revisionNeedsImageBackfill({
        revisionImageCount: 0,
        publishedImageCount: 3,
      }),
    ).toBe(true);
  });

  it("does not backfill when revision already has photos", () => {
    expect(
      revisionNeedsImageBackfill({
        revisionImageCount: 2,
        publishedImageCount: 3,
      }),
    ).toBe(false);
  });

  it("does not backfill when published has no photos", () => {
    expect(
      revisionNeedsImageBackfill({
        revisionImageCount: 0,
        publishedImageCount: 0,
      }),
    ).toBe(false);
  });
});

describe("shared storage deletion safety", () => {
  it("does not delete storage still referenced by the published listing", () => {
    expect(
      shouldRemoveStorageObject({
        storagePath: `${sellerId}/${publishedId}/img.jpg`,
        listingId: revisionId,
        remainingReferences: 1,
      }),
    ).toBe(false);
  });

  it("does not delete published-owned paths from a revision listing id", () => {
    expect(
      shouldRemoveStorageObject({
        storagePath: `${sellerId}/${publishedId}/img.jpg`,
        listingId: revisionId,
        remainingReferences: 0,
      }),
    ).toBe(false);
  });

  it("deletes storage only for objects owned by the listing being edited", () => {
    expect(
      shouldRemoveStorageObject({
        storagePath: `${sellerId}/${revisionId}/new.jpg`,
        listingId: revisionId,
        remainingReferences: 0,
      }),
    ).toBe(true);
  });
});
