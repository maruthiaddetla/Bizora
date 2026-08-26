import { describe, expect, it } from "vitest";
import {
  closedListingBrowseHref,
  closedListingHeadline,
  confirmCopyForCloseAction,
  NON_PUBLIC_AVAILABLE_STATUSES,
  primaryCloseActionForListingType,
  PUBLIC_AVAILABLE_STATUS,
  sanitizeClosedListingImage,
} from "@/lib/listing-lifecycle/helpers";
import { LISTING_PLACEHOLDER_IMAGE } from "@/lib/constants/images";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

describe("listing lifecycle helpers", () => {
  it("uses Mark as Sold for business listings", () => {
    expect(primaryCloseActionForListingType("business")).toBe("sold");
  });

  it("uses Mark as Leased for commercial listings", () => {
    expect(primaryCloseActionForListingType("commercial_space")).toBe("leased");
  });

  it("provides confirmation copy for sold/leased/withdrawn", () => {
    expect(confirmCopyForCloseAction("sold").confirmLabel).toBe("Confirm Sold");
    expect(confirmCopyForCloseAction("leased").confirmLabel).toBe(
      "Confirm Leased",
    );
    expect(confirmCopyForCloseAction("withdrawn").confirmLabel).toBe(
      "Confirm Withdraw",
    );
  });

  it("builds closed listing headlines", () => {
    expect(closedListingHeadline("sold")).toBe("SOLD");
    expect(closedListingHeadline("leased")).toBe("LEASED");
    expect(closedListingHeadline("withdrawn")).toBe("NO LONGER AVAILABLE");
  });

  it("routes browse CTA by listing type", () => {
    expect(closedListingBrowseHref("business")).toBe("/listings");
    expect(closedListingBrowseHref("commercial_space")).toBe(
      "/listings?type=commercial_space",
    );
  });

  it("sanitizes missing closed listing images", () => {
    expect(sanitizeClosedListingImage(null)).toBe(LISTING_PLACEHOLDER_IMAGE);
    expect(sanitizeClosedListingImage("https://example.com/a.jpg")).toBe(
      "https://example.com/a.jpg",
    );
  });

  it("keeps only published as publicly available", () => {
    expect(PUBLIC_AVAILABLE_STATUS).toBe("published");
    expect(NON_PUBLIC_AVAILABLE_STATUSES).toEqual(
      expect.arrayContaining([
        "draft",
        "pending",
        "rejected",
        "sold",
        "leased",
        "withdrawn",
      ]),
    );
  });
});

describe("public listing query availability filter", () => {
  it("filters public repository queries to published only", () => {
    const source = readFileSync(
      resolve(process.cwd(), "lib/repositories/businesses.repository.ts"),
      "utf8",
    );

    const publicFns = [
      "fetchFeaturedBusinesses",
      "fetchFeaturedCommercialSpaces",
      "fetchPremiumBusinesses",
      "fetchPremiumCommercialSpaces",
      "fetchBusinessById",
      "fetchSimilarBusinesses",
      "fetchBusinesses",
    ];

    for (const fn of publicFns) {
      expect(source).toContain(`export async function ${fn}`);
    }

    const publishedFilters = source.match(/\.eq\("status", "published"\)/g) ?? [];
    expect(publishedFilters.length).toBeGreaterThanOrEqual(publicFns.length);
  });

  it("does not broaden public SELECT RLS in TypeScript clients", () => {
    const closedRepo = readFileSync(
      resolve(process.cwd(), "lib/repositories/closed-listings.repository.ts"),
      "utf8",
    );
    expect(closedRepo).toContain('rpc("get_public_closed_listing"');
    expect(closedRepo).not.toContain('.from("businesses")');
  });

  it("uses RPC for seller/admin status transitions", () => {
    const sellerActions = readFileSync(
      resolve(process.cwd(), "lib/listing-lifecycle/actions.ts"),
      "utf8",
    );
    const adminActions = readFileSync(
      resolve(process.cwd(), "lib/admin/actions.ts"),
      "utf8",
    );
    expect(sellerActions).toContain('rpc("transition_listing_status"');
    expect(adminActions).toContain('rpc("transition_listing_status"');
    expect(sellerActions).not.toContain('.update({');
  });
});
