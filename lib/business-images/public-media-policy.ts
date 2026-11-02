/**
 * Public listing media proxy policy.
 * Only published listings may be served via the stable public URL.
 * All other statuses use short-lived signed URLs (not publicly cacheable via our proxy).
 */

/** Browser/CDN cache for published proxy responses — start conservative at 24h. */
export const PUBLIC_LISTING_MEDIA_CACHE_MAX_AGE_SECONDS = 60 * 60 * 24;

/** Align next/image optimizer TTL with the public proxy window. */
export const PUBLIC_LISTING_MEDIA_MINIMUM_CACHE_TTL_SECONDS =
  PUBLIC_LISTING_MEDIA_CACHE_MAX_AGE_SECONDS;

export function canServeListingImageViaPublicProxy(
  status: string | null | undefined,
): boolean {
  return status === "published";
}

/** Cache-Control for successful published proxy responses. */
export function publicListingMediaCacheControl(): string {
  return `public, max-age=${PUBLIC_LISTING_MEDIA_CACHE_MAX_AGE_SECONDS}, stale-while-revalidate=3600`;
}

/** Ensure error / non-public responses are not stored by shared caches. */
export function privateUncachedMediaCacheControl(): string {
  return "private, no-store";
}

/**
 * Decide delivery mode for a listing image set.
 * Explicit "signed" always wins; "public" is only honoured for published listings.
 */
export function resolveListingImageDelivery(params: {
  listingStatus: string | null | undefined;
  delivery?: "public" | "signed";
}): "public" | "signed" {
  if (params.delivery === "signed") return "signed";
  if (params.delivery === "public") {
    return canServeListingImageViaPublicProxy(params.listingStatus)
      ? "public"
      : "signed";
  }
  return canServeListingImageViaPublicProxy(params.listingStatus)
    ? "public"
    : "signed";
}
