import { describe, expect, it } from "vitest";
import {
  publicListingMediaPath,
  resolvePublicListingImageUrl,
} from "@/lib/business-images/public-media-url";

const IMAGE_ID = "11111111-1111-4111-8111-111111111111";

describe("public listing media URLs", () => {
  it("builds a stable same-origin path from image id", () => {
    expect(publicListingMediaPath(IMAGE_ID)).toBe(
      `/api/media/listing/${IMAGE_ID}`,
    );
  });

  it("uses the proxy for published Storage-backed rows", () => {
    expect(
      resolvePublicListingImageUrl(
        {
          id: IMAGE_ID,
          storage_path: `user/biz/${IMAGE_ID}.webp`,
          image_url: `user/biz/${IMAGE_ID}.webp`,
        },
        { listingStatus: "published" },
      ),
    ).toBe(`/api/media/listing/${IMAGE_ID}`);
  });

  it("keeps external seed URLs as-is regardless of status", () => {
    expect(
      resolvePublicListingImageUrl(
        {
          id: IMAGE_ID,
          image_url: "https://images.unsplash.com/photo-1?w=800",
        },
        { listingStatus: "draft" },
      ),
    ).toBe("https://images.unsplash.com/photo-1?w=800");
  });

  it("does not invent a proxy URL without an image id", () => {
    expect(
      resolvePublicListingImageUrl(
        {
          storage_path: "user/biz/img.webp",
          image_url: "user/biz/img.webp",
        },
        { listingStatus: "published" },
      ),
    ).toBeNull();
  });

  it("refuses the public proxy for draft, pending, rejected, sold, leased and withdrawn", () => {
    const storageImage = {
      id: IMAGE_ID,
      storage_path: `user/biz/${IMAGE_ID}.jpg`,
      image_url: `user/biz/${IMAGE_ID}.jpg`,
    };

    for (const status of [
      "draft",
      "pending",
      "rejected",
      "sold",
      "leased",
      "withdrawn",
    ]) {
      expect(
        resolvePublicListingImageUrl(storageImage, { listingStatus: status }),
      ).toBeNull();
    }
  });

  it("remains compatible with jpeg, png and webp storage paths when published", () => {
    for (const ext of ["jpg", "png", "webp"] as const) {
      expect(
        resolvePublicListingImageUrl(
          {
            id: IMAGE_ID,
            storage_path: `user/biz/${IMAGE_ID}.${ext}`,
            image_url: `user/biz/${IMAGE_ID}.${ext}`,
          },
          { listingStatus: "published" },
        ),
      ).toBe(`/api/media/listing/${IMAGE_ID}`);
    }
  });
});
