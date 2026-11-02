import { describe, expect, it } from "vitest";
import {
  buildAvatarStoragePath,
  extensionForAvatarMime,
  staleAvatarObjectPaths,
} from "@/lib/profile/avatar-storage";

describe("avatar storage helpers", () => {
  const userId = "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa";

  it("uses matching extension and content-type path for WebP avatars", () => {
    expect(extensionForAvatarMime("image/webp")).toBe("webp");
    expect(buildAvatarStoragePath(userId, "image/webp")).toBe(
      `${userId}/avatar.webp`,
    );
  });

  it("keeps JPEG and PNG avatar extensions correct", () => {
    expect(buildAvatarStoragePath(userId, "image/jpeg")).toBe(
      `${userId}/avatar.jpg`,
    );
    expect(buildAvatarStoragePath(userId, "image/png")).toBe(
      `${userId}/avatar.png`,
    );
  });

  it("only lists prior avatar variants for deletion after a successful new upload", () => {
    const keep = `${userId}/avatar.webp`;
    expect(
      staleAvatarObjectPaths(userId, keep, [
        "avatar.jpg",
        "avatar.webp",
        "avatar.png",
      ]),
    ).toEqual([`${userId}/avatar.jpg`, `${userId}/avatar.png`]);
  });
});
