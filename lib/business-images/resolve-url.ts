import {
  BUSINESS_IMAGES_BUCKET,
  SIGNED_URL_TTL_SECONDS,
} from "@/lib/business-images/constants";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export function isExternalImageUrl(value: string | null | undefined): boolean {
  if (!value) return false;
  return /^https?:\/\//i.test(value);
}

export function getStoragePathFromImage(image: {
  storage_path?: string | null;
  image_url: string;
}): string | null {
  if (image.storage_path) return image.storage_path;
  if (!isExternalImageUrl(image.image_url)) return image.image_url;
  return null;
}

/**
 * Resolve a displayable URL for an image row.
 * External (seed) URLs returned as-is; Storage paths become signed URLs.
 */
export async function resolveBusinessImageDisplayUrl(image: {
  storage_path?: string | null;
  image_url: string;
}): Promise<string | null> {
  if (isExternalImageUrl(image.image_url) && !image.storage_path) {
    return image.image_url;
  }

  const path = getStoragePathFromImage(image);
  if (!path) {
    return isExternalImageUrl(image.image_url) ? image.image_url : null;
  }

  const supabase = await createSupabaseServerClient();
  if (!supabase) return null;

  const { data, error } = await supabase.storage
    .from(BUSINESS_IMAGES_BUCKET)
    .createSignedUrl(path, SIGNED_URL_TTL_SECONDS);

  if (error || !data?.signedUrl) {
    if (process.env.NODE_ENV === "development") {
      console.warn("[Bizora] signed URL failed:", error?.message);
    }
    return null;
  }

  return data.signedUrl;
}

export async function resolveBusinessImageDisplayUrls(
  images: Array<{ storage_path?: string | null; image_url: string }>,
): Promise<(string | null)[]> {
  return Promise.all(images.map((image) => resolveBusinessImageDisplayUrl(image)));
}
