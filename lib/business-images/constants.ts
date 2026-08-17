export const BUSINESS_IMAGES_BUCKET = "business-images";
export const MAX_BUSINESS_IMAGES = 8;
export const MAX_BUSINESS_IMAGE_BYTES = 5 * 1024 * 1024; // 5 MB

export const ALLOWED_BUSINESS_IMAGE_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
] as const;

export type AllowedBusinessImageMime =
  (typeof ALLOWED_BUSINESS_IMAGE_MIME_TYPES)[number];

export const SIGNED_URL_TTL_SECONDS = 60 * 60; // 1 hour
