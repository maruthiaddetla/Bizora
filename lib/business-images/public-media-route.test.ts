import { beforeEach, describe, expect, it, vi } from "vitest";

const createSupabaseServerClient = vi.fn();

vi.mock("@/lib/supabase/server", () => ({
  createSupabaseServerClient: () => createSupabaseServerClient(),
}));

import { GET } from "@/app/api/media/listing/[imageId]/route";
import {
  privateUncachedMediaCacheControl,
  publicListingMediaCacheControl,
} from "@/lib/business-images/public-media-policy";

const PUBLISHED_IMAGE_ID = "11111111-1111-4111-8111-111111111111";
const DRAFT_IMAGE_ID = "22222222-2222-4222-8222-222222222222";

function mockQueryResult(row: unknown | null, error: unknown = null) {
  return {
    from: () => ({
      select: () => ({
        eq: () => ({
          maybeSingle: vi.fn().mockResolvedValue({ data: row, error }),
        }),
      }),
    }),
    storage: {
      from: () => ({
        download: vi.fn().mockResolvedValue({
          data: new Blob([new Uint8Array([0xff, 0xd8, 0xff, 0xd9])], {
            type: "image/jpeg",
          }),
          error: null,
        }),
      }),
    },
  };
}

describe("GET /api/media/listing/[imageId]", () => {
  beforeEach(() => {
    createSupabaseServerClient.mockReset();
  });

  it("returns 404 with private cache headers for invalid image ids", async () => {
    const response = await GET(new Request("http://localhost/api/media/listing/not-a-uuid"), {
      params: Promise.resolve({ imageId: "not-a-uuid" }),
    });
    expect(response.status).toBe(404);
    expect(response.headers.get("Cache-Control")).toBe(
      privateUncachedMediaCacheControl(),
    );
    expect(createSupabaseServerClient).not.toHaveBeenCalled();
  });

  it("serves published listing images with a 24h public cache", async () => {
    createSupabaseServerClient.mockResolvedValue(
      mockQueryResult({
        id: PUBLISHED_IMAGE_ID,
        storage_path: `owner/biz/${PUBLISHED_IMAGE_ID}.jpg`,
        image_url: `owner/biz/${PUBLISHED_IMAGE_ID}.jpg`,
        business: { status: "published" },
      }),
    );

    const response = await GET(
      new Request(`http://localhost/api/media/listing/${PUBLISHED_IMAGE_ID}`),
      { params: Promise.resolve({ imageId: PUBLISHED_IMAGE_ID }) },
    );

    expect(response.status).toBe(200);
    expect(response.headers.get("Content-Type")).toBe("image/jpeg");
    expect(response.headers.get("Cache-Control")).toBe(
      publicListingMediaCacheControl(),
    );
    const bytes = new Uint8Array(await response.arrayBuffer());
    expect(bytes.byteLength).toBeGreaterThan(0);
  });

  it("rejects draft, pending, rejected, sold, leased and withdrawn image ids", async () => {
    for (const status of [
      "draft",
      "pending",
      "rejected",
      "sold",
      "leased",
      "withdrawn",
    ]) {
      createSupabaseServerClient.mockResolvedValue(
        mockQueryResult({
          id: DRAFT_IMAGE_ID,
          storage_path: `owner/biz/${DRAFT_IMAGE_ID}.webp`,
          image_url: `owner/biz/${DRAFT_IMAGE_ID}.webp`,
          business: { status },
        }),
      );

      const response = await GET(
        new Request(`http://localhost/api/media/listing/${DRAFT_IMAGE_ID}`),
        { params: Promise.resolve({ imageId: DRAFT_IMAGE_ID }) },
      );

      expect(response.status).toBe(404);
      expect(response.headers.get("Cache-Control")).toBe(
        privateUncachedMediaCacheControl(),
      );
    }
  });

  it("returns 404 when the image row is missing (no unpublished leak)", async () => {
    createSupabaseServerClient.mockResolvedValue(mockQueryResult(null));

    const response = await GET(
      new Request(`http://localhost/api/media/listing/${DRAFT_IMAGE_ID}`),
      { params: Promise.resolve({ imageId: DRAFT_IMAGE_ID }) },
    );

    expect(response.status).toBe(404);
  });

  it("does not fall back to a signed redirect when Storage download fails", async () => {
    const createSignedUrl = vi.fn();
    createSupabaseServerClient.mockResolvedValue({
      from: () => ({
        select: () => ({
          eq: () => ({
            maybeSingle: vi.fn().mockResolvedValue({
              data: {
                id: PUBLISHED_IMAGE_ID,
                storage_path: `owner/biz/${PUBLISHED_IMAGE_ID}.png`,
                image_url: `owner/biz/${PUBLISHED_IMAGE_ID}.png`,
                business: { status: "published" },
              },
              error: null,
            }),
          }),
        }),
      }),
      storage: {
        from: () => ({
          download: vi.fn().mockResolvedValue({
            data: null,
            error: { message: "not allowed" },
          }),
          createSignedUrl,
        }),
      },
    });

    const response = await GET(
      new Request(`http://localhost/api/media/listing/${PUBLISHED_IMAGE_ID}`),
      { params: Promise.resolve({ imageId: PUBLISHED_IMAGE_ID }) },
    );

    expect(response.status).toBe(404);
    expect(createSignedUrl).not.toHaveBeenCalled();
    expect(response.headers.get("Cache-Control")).toBe(
      privateUncachedMediaCacheControl(),
    );
  });

  it("serves webp and png content types from storage extensions", async () => {
    for (const [ext, mime] of [
      ["webp", "image/webp"],
      ["png", "image/png"],
    ] as const) {
      createSupabaseServerClient.mockResolvedValue(
        mockQueryResult({
          id: PUBLISHED_IMAGE_ID,
          storage_path: `owner/biz/${PUBLISHED_IMAGE_ID}.${ext}`,
          image_url: `owner/biz/${PUBLISHED_IMAGE_ID}.${ext}`,
          business: { status: "published" },
        }),
      );

      const response = await GET(
        new Request(`http://localhost/api/media/listing/${PUBLISHED_IMAGE_ID}`),
        { params: Promise.resolve({ imageId: PUBLISHED_IMAGE_ID }) },
      );

      expect(response.status).toBe(200);
      expect(response.headers.get("Content-Type")).toBe(mime);
    }
  });

  it("after unpublish (published → draft/rejected), the same proxy URL returns 404 private no-store", async () => {
    const storagePath = `owner/biz/${PUBLISHED_IMAGE_ID}.webp`;

    createSupabaseServerClient.mockResolvedValue(
      mockQueryResult({
        id: PUBLISHED_IMAGE_ID,
        storage_path: storagePath,
        image_url: storagePath,
        business: { status: "published" },
      }),
    );

    const published = await GET(
      new Request(`http://localhost/api/media/listing/${PUBLISHED_IMAGE_ID}`),
      { params: Promise.resolve({ imageId: PUBLISHED_IMAGE_ID }) },
    );
    expect(published.status).toBe(200);
    expect(published.headers.get("Cache-Control")).toBe(
      publicListingMediaCacheControl(),
    );

    for (const nextStatus of ["draft", "rejected"] as const) {
      createSupabaseServerClient.mockResolvedValue(
        mockQueryResult({
          id: PUBLISHED_IMAGE_ID,
          storage_path: storagePath,
          image_url: storagePath,
          business: { status: nextStatus },
        }),
      );

      const unpublished = await GET(
        new Request(`http://localhost/api/media/listing/${PUBLISHED_IMAGE_ID}`),
        { params: Promise.resolve({ imageId: PUBLISHED_IMAGE_ID }) },
      );

      expect(unpublished.status).toBe(404);
      expect(unpublished.headers.get("Cache-Control")).toBe(
        privateUncachedMediaCacheControl(),
      );
    }

    /**
     * Residual CDN / next/image risk (expected, not fixed here):
     * A previously warmed `/_next/image?url=/api/media/listing/{id}&w=…` entry may
     * continue to be served from the image optimizer / edge cache for up to
     * PUBLIC_LISTING_MEDIA_CACHE_MAX_AGE_SECONDS (24h) after unpublish, because
     * Next sets Cache-Control: public on optimized responses and there is no
     * automatic purge on listing status change. Origin proxy correctly 404s.
     */
  });
});
