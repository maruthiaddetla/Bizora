import type { AllowedProfileAvatarMime } from "@/lib/profile/constants";

export function extensionForAvatarMime(
  mime: AllowedProfileAvatarMime,
): "jpg" | "png" | "webp" {
  if (mime === "image/png") return "png";
  if (mime === "image/webp") return "webp";
  return "jpg";
}

/** Stable per-user avatar object path; extension matches upload MIME. */
export function buildAvatarStoragePath(
  userId: string,
  mime: AllowedProfileAvatarMime,
): string {
  return `${userId}/avatar.${extensionForAvatarMime(mime)}`;
}

/**
 * After a successful upload to `keepPath`, remove other objects in the user folder
 * (typically prior extension variants). Never includes `keepPath`.
 */
export function staleAvatarObjectPaths(
  userId: string,
  keepPath: string,
  listedFileNames: string[],
): string[] {
  return listedFileNames
    .map((name) => `${userId}/${name}`)
    .filter((objectPath) => objectPath !== keepPath);
}
