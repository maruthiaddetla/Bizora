export const BUSINESS_IMAGES_BUCKET = "business-images";
export const MAX_BUSINESS_IMAGES = 8;
export const MAX_BUSINESS_IMAGE_BYTES = 5 * 1024 * 1024; // 5 MB

/** Client-side resize before Storage upload (longest edge). */
export const BUSINESS_IMAGE_UPLOAD_MAX_EDGE_PX = 1800;

export const ALLOWED_BUSINESS_IMAGE_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
] as const;

export type AllowedBusinessImageMime =
  (typeof ALLOWED_BUSINESS_IMAGE_MIME_TYPES)[number];

/**
 * Signed URL lifetime for private/owner/admin display, closed listings, and avatars.
 * Longer TTL reduces Next.js Image cache-key churn when signed URLs are used.
 * Published listing photos use /api/media/listing/[id] (stable, 24h public cache).
 */
export const SIGNED_URL_TTL_SECONDS = 60 * 60 * 24 * 7; // 7 days
