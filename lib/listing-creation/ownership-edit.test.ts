import { describe, expect, it } from "vitest";

/**
 * Pure helpers mirroring ownership checks used by listing update actions.
 * Server actions always load with `.eq("id", listingId).eq("seller_id", user.id)`.
 */
function canOwnerUpdateListing(params: {
  listingSellerId: string;
  callerUserId: string;
  status: string;
}): { allowed: boolean; reason?: string } {
  if (params.listingSellerId !== params.callerUserId) {
    return { allowed: false, reason: "not_owner" };
  }
  if (
    params.status !== "draft" &&
    params.status !== "rejected" &&
    params.status !== "pending"
  ) {
    return { allowed: false, reason: "status" };
  }
  return { allowed: true };
}

function resolvePublishedEditTarget(params: {
  status: string;
  listingId: string;
  existingRevisionId?: string | null;
}): { editListingId: string; needsRevision: boolean } {
  if (params.status !== "published") {
    return { editListingId: params.listingId, needsRevision: false };
  }
  if (params.existingRevisionId) {
    return {
      editListingId: params.existingRevisionId,
      needsRevision: false,
    };
  }
  return { editListingId: params.listingId, needsRevision: true };
}

describe("owner vs non-owner listing edits", () => {
  const ownerId = "11111111-1111-1111-1111-111111111111";
  const otherId = "22222222-2222-2222-2222-222222222222";
  const listingId = "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa";

  it("allows the owner to edit their draft listing", () => {
    expect(
      canOwnerUpdateListing({
        listingSellerId: ownerId,
        callerUserId: ownerId,
        status: "draft",
      }),
    ).toEqual({ allowed: true });
  });

  it("allows the owner to edit a pending listing", () => {
    expect(
      canOwnerUpdateListing({
        listingSellerId: ownerId,
        callerUserId: ownerId,
        status: "pending",
      }),
    ).toEqual({ allowed: true });
  });

  it("rejects a non-owner even when the listing id is known", () => {
    expect(
      canOwnerUpdateListing({
        listingSellerId: ownerId,
        callerUserId: otherId,
        status: "draft",
      }),
    ).toEqual({ allowed: false, reason: "not_owner" });
  });

  it("does not allow direct updates to a published row", () => {
    expect(
      canOwnerUpdateListing({
        listingSellerId: ownerId,
        callerUserId: ownerId,
        status: "published",
      }),
    ).toEqual({ allowed: false, reason: "status" });
  });

  it("routes published edits through a revision listing id", () => {
    expect(
      resolvePublishedEditTarget({
        status: "published",
        listingId,
        existingRevisionId: null,
      }),
    ).toEqual({ editListingId: listingId, needsRevision: true });

    expect(
      resolvePublishedEditTarget({
        status: "published",
        listingId,
        existingRevisionId: "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb",
      }),
    ).toEqual({
      editListingId: "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb",
      needsRevision: false,
    });

    expect(
      resolvePublishedEditTarget({
        status: "draft",
        listingId,
      }),
    ).toEqual({ editListingId: listingId, needsRevision: false });
  });
});
