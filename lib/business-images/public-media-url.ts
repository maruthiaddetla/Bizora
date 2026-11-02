import { canServeListingImageViaPublicProxy } from "@/lib/business-images/public-media-policy";
import { isExternalImageUrl } from "@/lib/business-images/resolve-url";

/**
 * Stable same-origin URL for publicly cacheable listing images.
 * Cache key is the image UUID — no seller path or signed token in the URL.
 */
export function publicListingMediaPath(imageId: string): string {
  return `/api/media/listing/${imageId}`;
}

export type ResolvePublicListingImageOptions = {
  /** Required for Storage-backed rows — proxy only when published. */
  listingStatus?: string | null;
};

/**
 * Prefer stable proxy URLs for published Storage-backed rows; keep external seed URLs as-is.
 * Returns null when the caller must use a signed URL instead (non-published or missing id).
 */
export function resolvePublicListingImageUrl(
  image: {
    id?: string;
    storage_path?: string | null;
    image_url: string;
  },
  options?: ResolvePublicListingImageOptions,
): string | null {
  if (isExternalImageUrl(image.image_url) && !image.storage_path) {
    return image.image_url;
  }

  if (!canServeListingImageViaPublicProxy(options?.listingStatus)) {
    return null;
  }

  if (image.id && (image.storage_path || !isExternalImageUrl(image.image_url))) {
    return publicListingMediaPath(image.id);
  }

  return null;
}
