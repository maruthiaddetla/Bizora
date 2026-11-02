import { afterEach, describe, expect, it, vi } from "vitest";
import {
  assertValidCompressedImageBlob,
  compressImageForUpload,
  extensionForCompressMime,
  imageFileStem,
  scaleDimensions,
  sniffCompressImageMime,
  validateCompressedImageBlob,
} from "@/lib/images/compress-image";

/** Copy into a standalone ArrayBuffer so BlobPart typing accepts it under TS 5.7+. */
function bytes(values: number[], extra = 0): Uint8Array<ArrayBuffer> {
  const out = new Uint8Array(values.length + Math.max(0, extra));
  out.set(values, 0);
  return out;
}

function jpegHeader(extra = 0): Uint8Array<ArrayBuffer> {
  return bytes([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10], extra);
}

function pngHeader(extra = 0): Uint8Array<ArrayBuffer> {
  return bytes(
    [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00, 0x00, 0x0d],
    extra,
  );
}

function webpHeader(extra = 0): Uint8Array<ArrayBuffer> {
  return bytes(
    [0x52, 0x49, 0x46, 0x46, 0x00, 0x00, 0x00, 0x00, 0x57, 0x45, 0x42, 0x50],
    extra,
  );
}

describe("scaleDimensions", () => {
  it("leaves already-small images unchanged", () => {
    expect(scaleDimensions(1200, 800, 1800)).toEqual({
      width: 1200,
      height: 800,
    });
  });

  it("scales landscape so the longest edge is the max", () => {
    expect(scaleDimensions(4000, 2000, 1800)).toEqual({
      width: 1800,
      height: 900,
    });
  });

  it("scales portrait so the longest edge is the max", () => {
    expect(scaleDimensions(1000, 4000, 1800)).toEqual({
      width: 450,
      height: 1800,
    });
  });

  it("rejects non-positive dimensions", () => {
    expect(scaleDimensions(0, 100, 1800)).toEqual({ width: 0, height: 0 });
  });
});

describe("file naming and MIME helpers", () => {
  it("strips directories and extensions for storage stems", () => {
    expect(imageFileStem("shop.jpg")).toBe("shop");
    expect(imageFileStem("C:\\photos\\store.PNG")).toBe("store");
    expect(imageFileStem("avatar")).toBe("avatar");
  });

  it("maps MIME to matching storage extensions", () => {
    expect(extensionForCompressMime("image/webp")).toBe("webp");
    expect(extensionForCompressMime("image/jpeg")).toBe("jpg");
    expect(extensionForCompressMime("image/png")).toBe("png");
  });

  it("sniffs JPEG, PNG and WebP magic bytes", () => {
    expect(sniffCompressImageMime(jpegHeader())).toBe("image/jpeg");
    expect(sniffCompressImageMime(pngHeader())).toBe("image/png");
    expect(sniffCompressImageMime(webpHeader())).toBe("image/webp");
    expect(sniffCompressImageMime(new Uint8Array([0, 1, 2]))).toBeNull();
    expect(sniffCompressImageMime(new Uint8Array())).toBeNull();
  });

  it("rejects empty compression output", () => {
    expect(validateCompressedImageBlob(null).ok).toBe(false);
    expect(validateCompressedImageBlob(new Blob([])).ok).toBe(false);
  });

  it("rejects corrupt blobs that lack image magic bytes", async () => {
    const corrupt = new Blob([new Uint8Array([0x00, 0x01, 0x02])], {
      type: "image/webp",
    });
    const result = await assertValidCompressedImageBlob(corrupt, "image/webp");
    expect(result.ok).toBe(false);
  });

  it("accepts WebP magic with image/webp MIME", async () => {
    const blob = new Blob([webpHeader(32)], { type: "image/webp" });
    const result = await assertValidCompressedImageBlob(blob, "image/webp");
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.mime).toBe("image/webp");
  });
});

describe("compressImageForUpload", () => {
  const originalCreateImageBitmap = globalThis.createImageBitmap;
  const originalOffscreenCanvas = globalThis.OffscreenCanvas;

  afterEach(() => {
    vi.unstubAllGlobals();
    if (originalCreateImageBitmap) {
      globalThis.createImageBitmap = originalCreateImageBitmap;
    } else {
      // @ts-expect-error cleanup
      delete globalThis.createImageBitmap;
    }
    if (originalOffscreenCanvas) {
      globalThis.OffscreenCanvas = originalOffscreenCanvas;
    } else {
      // @ts-expect-error cleanup
      delete globalThis.OffscreenCanvas;
    }
  });

  function installCanvasMocks(options: {
    bitmapWidth?: number;
    bitmapHeight?: number;
    alpha?: number;
    blobsByType?: Partial<Record<string, Blob | null>>;
  }) {
    const createImageBitmap = vi.fn(async () => ({
      width: options.bitmapWidth ?? 4000,
      height: options.bitmapHeight ?? 2000,
      close: vi.fn(),
    }));

    const getImageData = vi.fn(() => {
      const alpha = options.alpha ?? 255;
      // RGBA sample — one pixel worth of channel pattern repeated
      return {
        data: new Uint8ClampedArray([10, 20, 30, alpha, 40, 50, 60, alpha]),
      };
    });

    const convertToBlob = vi.fn(
      async ({ type }: { type: string; quality?: number }) => {
        if (options.blobsByType && type in options.blobsByType) {
          return options.blobsByType[type] ?? null;
        }
        if (type === "image/webp") {
          return new Blob([webpHeader(120)], { type: "image/webp" });
        }
        if (type === "image/png") {
          return new Blob([pngHeader(120)], { type: "image/png" });
        }
        return new Blob([jpegHeader(120)], { type: "image/jpeg" });
      },
    );

    class MockOffscreenCanvas {
      width: number;
      height: number;
      constructor(width: number, height: number) {
        this.width = width;
        this.height = height;
      }
      getContext() {
        return {
          drawImage: vi.fn(),
          getImageData,
        };
      }
      convertToBlob = convertToBlob;
    }

    vi.stubGlobal("createImageBitmap", createImageBitmap);
    vi.stubGlobal("OffscreenCanvas", MockOffscreenCanvas);

    return { createImageBitmap, convertToBlob, getImageData };
  }

  it("requests EXIF orientation via createImageBitmap imageOrientation", async () => {
    const { createImageBitmap } = installCanvasMocks({});
    const file = new File([jpegHeader(64)], "phone.jpg", {
      type: "image/jpeg",
    });

    await compressImageForUpload(file);

    expect(createImageBitmap).toHaveBeenCalledWith(
      expect.any(File),
      expect.objectContaining({ imageOrientation: "from-image" }),
    );
  });

  it("outputs WebP with matching .webp name and image/webp type", async () => {
    installCanvasMocks({});
    const file = new File([jpegHeader(2048)], "store-front.jpg", {
      type: "image/jpeg",
    });

    const result = await compressImageForUpload(file, {
      fileName: file.name,
    });

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.mime).toBe("image/webp");
    expect(result.file.type).toBe("image/webp");
    expect(result.file.name).toBe("store-front.webp");
    expect(result.compressed).toBe(true);
  });

  it("preserves transparency by never falling back to JPEG for alpha sources", async () => {
    const { convertToBlob } = installCanvasMocks({
      alpha: 120,
      blobsByType: {
        // WebP encoder unavailable — must keep PNG, not JPEG
        "image/webp": null,
        "image/png": new Blob([pngHeader(80)], { type: "image/png" }),
        "image/jpeg": new Blob([jpegHeader(80)], { type: "image/jpeg" }),
      },
    });

    const file = new File([pngHeader(64)], "logo.png", { type: "image/png" });
    const result = await compressImageForUpload(file, { fileName: "logo" });

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.mime).toBe("image/png");
    expect(result.file.name).toBe("logo.png");
    expect(result.file.type).toBe("image/png");
    expect(
      convertToBlob.mock.calls.some(
        (call) => call[0]?.type === "image/jpeg",
      ),
    ).toBe(false);
  });

  it("converts transparent PNG to WebP when encoder succeeds", async () => {
    installCanvasMocks({ alpha: 80 });
    const file = new File([pngHeader(64)], "badge.png", { type: "image/png" });
    const result = await compressImageForUpload(file, { fileName: "badge" });

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.mime).toBe("image/webp");
    expect(result.file.name).toBe("badge.webp");
    expect(result.file.type).toBe("image/webp");
  });

  it("falls back to JPEG when WebP conversion is not appropriate for opaque photos", async () => {
    installCanvasMocks({
      alpha: 255,
      blobsByType: {
        "image/webp": null,
        "image/jpeg": new Blob([jpegHeader(90)], { type: "image/jpeg" }),
      },
    });

    const file = new File([jpegHeader(64)], "room.jpg", {
      type: "image/jpeg",
    });
    const result = await compressImageForUpload(file, { fileName: "room" });

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.mime).toBe("image/jpeg");
    expect(result.file.name).toBe("room.jpg");
    expect(result.file.type).toBe("image/jpeg");
  });

  it("fails closed on empty encoder output (does not return ok)", async () => {
    installCanvasMocks({
      blobsByType: {
        "image/webp": new Blob([]),
        "image/jpeg": new Blob([]),
        "image/png": new Blob([]),
      },
    });

    const file = new File([jpegHeader(64)], "bad.jpg", { type: "image/jpeg" });
    const result = await compressImageForUpload(file);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reason).toBe("failed");
  });

  it("fails closed when createImageBitmap cannot decode the file", async () => {
    vi.stubGlobal(
      "createImageBitmap",
      vi.fn(async () => {
        throw new Error("decode failed");
      }),
    );

    const file = new File([jpegHeader(16)], "corrupt.jpg", {
      type: "image/jpeg",
    });
    const result = await compressImageForUpload(file);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reason).toBe("failed");
  });

  it("rejects compressed output that still exceeds maxBytes", async () => {
    installCanvasMocks({
      blobsByType: {
        "image/webp": new Blob([webpHeader(5000)], { type: "image/webp" }),
        "image/jpeg": new Blob([jpegHeader(5000)], { type: "image/jpeg" }),
      },
    });

    const file = new File([jpegHeader(64)], "huge.jpg", {
      type: "image/jpeg",
    });
    const result = await compressImageForUpload(file, { maxBytes: 100 });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.reason).toBe("failed");
      expect(result.message).toMatch(/too large/i);
    }
  });

  it("returns unsupported when createImageBitmap is missing", async () => {
    // @ts-expect-error force missing API
    delete globalThis.createImageBitmap;
    // @ts-expect-error force missing API
    delete globalThis.OffscreenCanvas;

    const file = new File([jpegHeader(16)], "x.jpg", { type: "image/jpeg" });
    const result = await compressImageForUpload(file);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reason).toBe("unsupported");
  });

  it("reports a smaller compressed size than a large original input", async () => {
    const originalBytes = jpegHeader(2_400_000);
    const compressedBytes = webpHeader(180_000);
    installCanvasMocks({
      blobsByType: {
        "image/webp": new Blob([compressedBytes], { type: "image/webp" }),
      },
    });

    const original = new File([originalBytes], "hero.jpg", {
      type: "image/jpeg",
    });
    const result = await compressImageForUpload(original, {
      fileName: "hero",
      maxBytes: 5 * 1024 * 1024,
    });

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(original.size).toBeGreaterThan(2_000_000);
    expect(result.file.size).toBeLessThan(200_000);
    expect(result.file.size).toBeLessThan(original.size);
  });
});
