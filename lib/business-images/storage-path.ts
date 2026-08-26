import type { AllowedBusinessImageMime } from "@/lib/business-images/constants";

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const EXT_BY_MIME: Record<AllowedBusinessImageMime, "jpg" | "png" | "webp"> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

const MIME_BY_EXT: Record<string, AllowedBusinessImageMime> = {
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
};

export function isBusinessImageUuid(value: string): boolean {
  return UUID_PATTERN.test(value);
}

export function extensionForBusinessImageMime(
  mime: AllowedBusinessImageMime,
): "jpg" | "png" | "webp" {
  return EXT_BY_MIME[mime];
}

export function buildBusinessImageStoragePath(params: {
  userId: string;
  businessId: string;
  imageId: string;
  extension: "jpg" | "png" | "webp";
}): string {
  const { userId, businessId, imageId, extension } = params;
  return `${userId}/${businessId}/${imageId}.${extension}`;
}

export type ParsedBusinessImageStoragePath = {
  userId: string;
  businessId: string;
  imageId: string;
  extension: "jpg" | "png" | "webp";
  mime: AllowedBusinessImageMime;
};

/**
 * Validates owner-scoped storage path shape:
 * `{auth.uid()}/{businessId}/{imageId}.{jpg|png|webp}`
 */
export function parseBusinessImageStoragePath(
  storagePath: string,
  expected: { userId: string; businessId: string; imageId: string },
): ParsedBusinessImageStoragePath | null {
  const parts = storagePath.split("/");
  if (parts.length !== 3) return null;

  const [userId, businessId, fileName] = parts;
  if (userId !== expected.userId) return null;
  if (businessId !== expected.businessId) return null;
  if (!isBusinessImageUuid(businessId)) return null;

  const dot = fileName.lastIndexOf(".");
  if (dot <= 0) return null;
  const imageId = fileName.slice(0, dot);
  const rawExt = fileName.slice(dot + 1).toLowerCase();
  if (imageId !== expected.imageId) return null;
  if (!isBusinessImageUuid(imageId)) return null;

  if (rawExt !== "jpg" && rawExt !== "png" && rawExt !== "webp") {
    return null;
  }

  const mime = MIME_BY_EXT[rawExt];
  if (!mime) return null;

  return {
    userId,
    businessId,
    imageId,
    extension: rawExt,
    mime,
  };
}
