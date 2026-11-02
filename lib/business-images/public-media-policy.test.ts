import { describe, expect, it } from "vitest";
import {
  PUBLIC_LISTING_MEDIA_CACHE_MAX_AGE_SECONDS,
  canServeListingImageViaPublicProxy,
  privateUncachedMediaCacheControl,
  publicListingMediaCacheControl,
  resolveListingImageDelivery,
} from "@/lib/business-images/public-media-policy";

describe("public media proxy policy", () => {
  it("allows only published listings through the public proxy", () => {
    expect(canServeListingImageViaPublicProxy("published")).toBe(true);

    for (const status of [
      "draft",
      "pending",
      "rejected",
      "sold",
      "leased",
      "withdrawn",
      null,
      undefined,
      "",
    ]) {
      expect(canServeListingImageViaPublicProxy(status)).toBe(false);
    }
  });

  it("forces signed delivery for non-published even when public is requested", () => {
    expect(
      resolveListingImageDelivery({
        listingStatus: "draft",
        delivery: "public",
      }),
    ).toBe("signed");
    expect(
      resolveListingImageDelivery({
        listingStatus: "sold",
        delivery: "public",
      }),
    ).toBe("signed");
    expect(
      resolveListingImageDelivery({
        listingStatus: "published",
        delivery: "public",
      }),
    ).toBe("public");
  });

  it("honours explicit signed delivery for published listings (owner/admin)", () => {
    expect(
      resolveListingImageDelivery({
        listingStatus: "published",
        delivery: "signed",
      }),
    ).toBe("signed");
  });

  it("defaults delivery from listing status", () => {
    expect(
      resolveListingImageDelivery({ listingStatus: "published" }),
    ).toBe("public");
    expect(resolveListingImageDelivery({ listingStatus: "pending" })).toBe(
      "signed",
    );
  });

  it("uses a 24-hour public cache TTL and private no-store for non-public responses", () => {
    expect(PUBLIC_LISTING_MEDIA_CACHE_MAX_AGE_SECONDS).toBe(60 * 60 * 24);
    expect(publicListingMediaCacheControl()).toContain("public");
    expect(publicListingMediaCacheControl()).toContain("max-age=86400");
    expect(publicListingMediaCacheControl()).not.toContain("immutable");
    expect(privateUncachedMediaCacheControl()).toBe("private, no-store");
  });
});
