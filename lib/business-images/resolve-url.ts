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

type ImageSource = {
  storage_path?: string | null;
  image_url: string;
};

/**
 * Resolve a displayable URL for an image row.
 * External (seed) URLs returned as-is; Storage paths become signed URLs.
 */
export async function resolveBusinessImageDisplayUrl(
  image: ImageSource,
): Promise<string | null> {
  const [url] = await resolveBusinessImageDisplayUrls([image]);
  return url;
}

/**
 * Batch-resolve display URLs with one Supabase client and one Storage sign call
 * when multiple Storage paths are present.
 */
export async function resolveBusinessImageDisplayUrls(
  images: ImageSource[],
): Promise<(string | null)[]> {
  if (images.length === 0) return [];

  const results: (string | null)[] = new Array(images.length).fill(null);
  const storageIndexes: number[] = [];
  const storagePaths: string[] = [];

  for (let i = 0; i < images.length; i += 1) {
    const image = images[i];
    if (isExternalImageUrl(image.image_url) && !image.storage_path) {
      results[i] = image.image_url;
      continue;
    }

    const path = getStoragePathFromImage(image);
    if (!path) {
      results[i] = isExternalImageUrl(image.image_url) ? image.image_url : null;
      continue;
    }

    storageIndexes.push(i);
    storagePaths.push(path);
  }

  if (storagePaths.length === 0) {
    return results;
  }

  const supabase = await createSupabaseServerClient();
  if (!supabase) return results;

  if (storagePaths.length === 1) {
    const { data, error } = await supabase.storage
      .from(BUSINESS_IMAGES_BUCKET)
      .createSignedUrl(storagePaths[0], SIGNED_URL_TTL_SECONDS);

    if (error || !data?.signedUrl) {
      if (process.env.NODE_ENV === "development") {
        console.warn("[Bizora] signed URL failed:", error?.message);
      }
      return results;
    }

    results[storageIndexes[0]] = data.signedUrl;
    return results;
  }

  const { data, error } = await supabase.storage
    .from(BUSINESS_IMAGES_BUCKET)
    .createSignedUrls(storagePaths, SIGNED_URL_TTL_SECONDS);

  if (error || !data) {
    if (process.env.NODE_ENV === "development") {
      console.warn("[Bizora] batch signed URLs failed:", error?.message);
    }
    return results;
  }

  for (let i = 0; i < data.length; i += 1) {
    const item = data[i];
    const targetIndex = storageIndexes[i];
    if (item?.signedUrl) {
      results[targetIndex] = item.signedUrl;
    } else if (process.env.NODE_ENV === "development" && item?.error) {
      console.warn("[Bizora] signed URL failed:", item.error);
    }
  }

  return results;
}
