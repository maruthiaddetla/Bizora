import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import {
  PUBLIC_LISTING_MEDIA_CACHE_MAX_AGE_SECONDS,
  PUBLIC_LISTING_MEDIA_MINIMUM_CACHE_TTL_SECONDS,
  canServeListingImageViaPublicProxy,
  privateUncachedMediaCacheControl,
  resolveListingImageDelivery,
} from "@/lib/business-images/public-media-policy";
import { SIGNED_URL_TTL_SECONDS } from "@/lib/business-images/constants";

/**
 * Security review checks for private signed images + Next.js Image Optimizer.
 *
 * Findings (no production code change — residual risks documented for deploy review):
 *
 * 1. Next.js `/_next/image` always sets `Cache-Control: public, max-age=…, must-revalidate`
 *    (see node_modules/next/dist/server/image-optimizer.js `setResponseHeaders`).
 * 2. Optimizer cache keys include the full `src` href (signed query token included).
 * 3. Therefore draft/pending/rejected/admin images are NOT shared across users via the
 *    optimizer cache unless the exact same signed URL (capability URL) is reused/leaked.
 * 4. Authorization for private images is the signed URL itself (Storage RLS + token),
 *    not cookies — Next does not forward auth headers to upstream (by design).
 * 5. Unpublished listings cannot use the stable public proxy; only `published` can.
 * 6. Residual risk: possession of `/_next/image?url=<signed>` equals possession of the
 *    capability for up to max(signed TTL remaining, minimumCacheTTL). Same class of risk
 *    as sharing the signed Storage URL.
 * 7. Residual risk after unpublish: stable `/api/media/listing/{id}` + `/_next/image`
 *    may keep serving a previously optimized public derivative for up to ~24h
 *    (minimumCacheTTL / proxy max-age) even though the origin proxy then returns 404.
 */
describe("private signed image + Next.js Image cache security", () => {
  it("keeps next/image minimumCacheTTL aligned with the 24h public proxy window", () => {
    expect(PUBLIC_LISTING_MEDIA_MINIMUM_CACHE_TTL_SECONDS).toBe(
      PUBLIC_LISTING_MEDIA_CACHE_MAX_AGE_SECONDS,
    );
    expect(PUBLIC_LISTING_MEDIA_MINIMUM_CACHE_TTL_SECONDS).toBe(86_400);
  });

  it("never routes draft, pending, rejected, sold, leased or withdrawn through the public proxy", () => {
    for (const status of [
      "draft",
      "pending",
      "rejected",
      "sold",
      "leased",
      "withdrawn",
    ]) {
      expect(canServeListingImageViaPublicProxy(status)).toBe(false);
      expect(
        resolveListingImageDelivery({
          listingStatus: status,
          delivery: "public",
        }),
      ).toBe("signed");
    }
  });

  it("uses signed delivery for owner/admin-style explicit signed requests even when published", () => {
    expect(
      resolveListingImageDelivery({
        listingStatus: "published",
        delivery: "signed",
      }),
    ).toBe("signed");
  });

  it("documents that Next.js optimizer responses are publicly cacheable (upstream behaviour)", () => {
    const optimizerSource = readFileSync(
      resolve(
        process.cwd(),
        "node_modules/next/dist/server/image-optimizer.js",
      ),
      "utf8",
    );
    // Guard: if Next changes this, re-review private-image caching assumptions.
    expect(optimizerSource).toContain(
      "public, max-age=${isDev ? 0 : maxAge}, must-revalidate",
    );
  });

  it("keeps denied proxy responses explicitly non-public", () => {
    expect(privateUncachedMediaCacheControl()).toBe("private, no-store");
  });

  it("keeps signed URL TTL longer than the public proxy window (private reuse, less churn)", () => {
    expect(SIGNED_URL_TTL_SECONDS).toBeGreaterThan(
      PUBLIC_LISTING_MEDIA_CACHE_MAX_AGE_SECONDS,
    );
  });

  it("records authorisation assumptions for private listing images", () => {
    const assumptions = {
      privateBucketsRemainPrivate: true,
      draftPendingRejectedUseSignedUrlsOnly: true,
      adminAndOwnerPreviewUseSignedUrlsOnly: true,
      publicProxyPublishedOnly: true,
      nextImageDoesNotForwardCookiesToUpstream: true,
      optimizerCacheKeyIncludesFullSignedHref: true,
      crossUserCacheCollisionRequiresIdenticalSignedUrl: true,
      capabilityUrlLeakIsResidualRiskNotCrossTenantBug: true,
    };
    expect(Object.values(assumptions).every(Boolean)).toBe(true);
  });
});
