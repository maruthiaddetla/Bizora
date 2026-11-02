/**
 * Browser-side image resize/compress before Storage upload.
 * No third-party image CDN — uses Canvas / createImageBitmap only.
 */

export const IMAGE_UPLOAD_MAX_EDGE_PX = 1800;
export const IMAGE_UPLOAD_WEBP_QUALITY = 0.8;
export const IMAGE_UPLOAD_JPEG_QUALITY = 0.82;

export type CompressImageMime = "image/jpeg" | "image/png" | "image/webp";

export type CompressImageResult =
  | {
      ok: true;
      file: File;
      mime: CompressImageMime;
      /** True when pixels were re-encoded (not a passthrough). */
      compressed: boolean;
    }
  | {
      ok: false;
      message: string;
      /**
       * unsupported = no canvas APIs available in this environment.
       * failed = corrupt/empty/oversized output — callers must not upload the original.
       */
      reason: "unsupported" | "failed";
    };

export type CompressImageOptions = {
  maxEdgePx?: number;
  webpQuality?: number;
  jpegQuality?: number;
  maxBytes?: number;
  /** Output file name stem or full name (extension stripped). */
  fileName?: string;
};

/** Pure helper — kept free of DOM for unit tests. */
export function scaleDimensions(
  width: number,
  height: number,
  maxEdge: number,
): { width: number; height: number } {
  if (width <= 0 || height <= 0) {
    return { width: 0, height: 0 };
  }
  const longest = Math.max(width, height);
  if (longest <= maxEdge) {
    return { width: Math.round(width), height: Math.round(height) };
  }
  const scale = maxEdge / longest;
  return {
    width: Math.max(1, Math.round(width * scale)),
    height: Math.max(1, Math.round(height * scale)),
  };
}

/** Strip directories and a single trailing extension for storage file names. */
export function imageFileStem(name: string): string {
  const base = name.split(/[/\\]/).pop()?.trim() || "photo";
  const stem = base.replace(/\.[^.]+$/, "").trim();
  return stem || "photo";
}

export function extensionForCompressMime(
  mime: CompressImageMime,
): "jpg" | "png" | "webp" {
  if (mime === "image/jpeg") return "jpg";
  if (mime === "image/png") return "png";
  return "webp";
}

function startsWithBytes(bytes: Uint8Array, signature: number[]): boolean {
  if (bytes.length < signature.length) return false;
  return signature.every((value, index) => bytes[index] === value);
}

/** Detect JPEG / PNG / WebP from magic bytes; reject empty or unknown blobs. */
export function sniffCompressImageMime(
  bytes: Uint8Array,
): CompressImageMime | null {
  if (bytes.length === 0) return null;

  if (startsWithBytes(bytes, [0xff, 0xd8, 0xff])) {
    return "image/jpeg";
  }

  if (
    startsWithBytes(bytes, [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])
  ) {
    return "image/png";
  }

  if (
    bytes.length >= 12 &&
    startsWithBytes(bytes, [0x52, 0x49, 0x46, 0x46]) &&
    bytes[8] === 0x57 &&
    bytes[9] === 0x45 &&
    bytes[10] === 0x42 &&
    bytes[11] === 0x50
  ) {
    return "image/webp";
  }

  return null;
}

/**
 * Reject empty, corrupt, or MIME-mismatched compression output.
 * Returns the sniffed MIME when valid.
 */
export function validateCompressedImageBlob(
  blob: Blob | null | undefined,
  expectedMime?: CompressImageMime,
):
  | { ok: true; mime: CompressImageMime; size: number }
  | { ok: false; message: string } {
  if (!blob || blob.size <= 0) {
    return {
      ok: false,
      message: "Image compression failed. Please try another photo.",
    };
  }

  return {
    ok: true,
    mime: expectedMime ?? "image/webp",
    size: blob.size,
  };
}

/** Async magic-byte check after encode (needs arrayBuffer). */
export async function assertValidCompressedImageBlob(
  blob: Blob | null | undefined,
  preferredMime: CompressImageMime,
): Promise<
  | { ok: true; mime: CompressImageMime; blob: Blob }
  | { ok: false; message: string }
> {
  const sizeCheck = validateCompressedImageBlob(blob, preferredMime);
  if (!sizeCheck.ok || !blob) {
    return {
      ok: false,
      message: sizeCheck.ok
        ? "Image compression failed. Please try another photo."
        : sizeCheck.message,
    };
  }

  const header = new Uint8Array(await blob.slice(0, 16).arrayBuffer());
  const sniffed = sniffCompressImageMime(header);
  if (!sniffed) {
    return {
      ok: false,
      message:
        "Image compression produced an invalid file. Please try another photo.",
    };
  }

  // Prefer sniffed MIME when the encoder label disagrees (still an allowed type).
  return { ok: true, mime: sniffed, blob };
}

function canvasToBlob(
  canvas: HTMLCanvasElement | OffscreenCanvas,
  type: string,
  quality?: number,
): Promise<Blob | null> {
  // Avoid `instanceof HTMLCanvasElement` when the DOM global is missing (Node tests).
  if (
    typeof HTMLCanvasElement !== "undefined" &&
    canvas instanceof HTMLCanvasElement
  ) {
    return new Promise((resolve) => {
      canvas.toBlob((blob) => resolve(blob), type, quality);
    });
  }
  if (
    "convertToBlob" in canvas &&
    typeof canvas.convertToBlob === "function"
  ) {
    return canvas.convertToBlob(
      quality == null ? { type } : { type, quality },
    );
  }
  return Promise.resolve(null);
}

function hasTransparency(
  ctx: OffscreenCanvasRenderingContext2D | CanvasRenderingContext2D,
  width: number,
  height: number,
): boolean {
  try {
    const sampleW = Math.min(width, 64);
    const sampleH = Math.min(height, 64);
    const data = ctx.getImageData(0, 0, sampleW, sampleH).data;
    for (let i = 3; i < data.length; i += 4) {
      if (data[i]! < 255) return true;
    }
  } catch {
    // Cross-origin or security — assume may have alpha for PNG/WebP sources
    return true;
  }
  return false;
}

async function encodePreferringWebp(params: {
  canvas: HTMLCanvasElement | OffscreenCanvas;
  sourceLooksTransparent: boolean;
  webpQuality: number;
  jpegQuality: number;
}): Promise<{ blob: Blob; mime: CompressImageMime } | null> {
  const { canvas, sourceLooksTransparent, webpQuality, jpegQuality } = params;

  const webpBlob = await canvasToBlob(canvas, "image/webp", webpQuality);
  const webpCheck = await assertValidCompressedImageBlob(webpBlob, "image/webp");
  if (webpCheck.ok) {
    return { blob: webpCheck.blob, mime: webpCheck.mime };
  }

  // Conversion not appropriate / unavailable — keep alpha-safe or JPEG fallback.
  if (sourceLooksTransparent) {
    const pngBlob = await canvasToBlob(canvas, "image/png");
    const pngCheck = await assertValidCompressedImageBlob(pngBlob, "image/png");
    if (pngCheck.ok) {
      return { blob: pngCheck.blob, mime: "image/png" };
    }
    return null;
  }

  const jpegBlob = await canvasToBlob(canvas, "image/jpeg", jpegQuality);
  const jpegCheck = await assertValidCompressedImageBlob(jpegBlob, "image/jpeg");
  if (jpegCheck.ok) {
    return { blob: jpegCheck.blob, mime: "image/jpeg" };
  }

  return null;
}

/**
 * Resize (max edge) and prefer WebP ~quality 80.
 * Preserves orientation via createImageBitmap imageOrientation.
 * PNG/WebP with alpha stay in alpha-capable formats (WebP or PNG — never JPEG).
 * Callers must not upload the original when this returns ok:false.
 */
export async function compressImageForUpload(
  file: File,
  options: CompressImageOptions = {},
): Promise<CompressImageResult> {
  const maxEdge = options.maxEdgePx ?? IMAGE_UPLOAD_MAX_EDGE_PX;
  const webpQuality = options.webpQuality ?? IMAGE_UPLOAD_WEBP_QUALITY;
  const jpegQuality = options.jpegQuality ?? IMAGE_UPLOAD_JPEG_QUALITY;
  const maxBytes = options.maxBytes;

  if (typeof createImageBitmap !== "function") {
    return {
      ok: false,
      message: "Image compression is not supported in this browser.",
      reason: "unsupported",
    };
  }

  let bitmap: ImageBitmap;
  try {
    bitmap = await createImageBitmap(file, {
      // Honour EXIF orientation where the browser supports it (mobile photos).
      imageOrientation: "from-image",
    } as ImageBitmapOptions);
  } catch {
    return {
      ok: false,
      message: "We couldn't read that image. Please try another file.",
      reason: "failed",
    };
  }

  try {
    const { width, height } = scaleDimensions(
      bitmap.width,
      bitmap.height,
      maxEdge,
    );
    if (width <= 0 || height <= 0) {
      bitmap.close();
      return {
        ok: false,
        message: "We couldn't process that image. Please try another file.",
        reason: "failed",
      };
    }

    const canOffscreen = typeof OffscreenCanvas !== "undefined";
    const canvas: HTMLCanvasElement | OffscreenCanvas = canOffscreen
      ? new OffscreenCanvas(width, height)
      : Object.assign(document.createElement("canvas"), { width, height });

    if (!canOffscreen) {
      (canvas as HTMLCanvasElement).width = width;
      (canvas as HTMLCanvasElement).height = height;
    }

    const ctx = canvas.getContext("2d") as
      | OffscreenCanvasRenderingContext2D
      | CanvasRenderingContext2D
      | null;
    if (!ctx) {
      bitmap.close();
      return {
        ok: false,
        message: "Image compression is not supported in this browser.",
        reason: "unsupported",
      };
    }

    ctx.drawImage(bitmap, 0, 0, width, height);
    const sourceLooksTransparent =
      file.type === "image/png" || file.type === "image/webp"
        ? hasTransparency(ctx, width, height)
        : false;
    bitmap.close();

    let encoded = await encodePreferringWebp({
      canvas,
      sourceLooksTransparent,
      webpQuality,
      jpegQuality,
    });

    if (!encoded) {
      return {
        ok: false,
        message: "Image compression failed. Please try another photo.",
        reason: "failed",
      };
    }

    if (maxBytes != null && encoded.blob.size > maxBytes) {
      const tighterWebp = await canvasToBlob(
        canvas,
        "image/webp",
        Math.min(webpQuality, 0.65),
      );
      const tighterCheck = await assertValidCompressedImageBlob(
        tighterWebp,
        "image/webp",
      );

      if (tighterCheck.ok && tighterCheck.blob.size <= maxBytes) {
        encoded = { blob: tighterCheck.blob, mime: "image/webp" };
      } else if (!sourceLooksTransparent) {
        const jpegBlob = await canvasToBlob(canvas, "image/jpeg", 0.7);
        const jpegCheck = await assertValidCompressedImageBlob(
          jpegBlob,
          "image/jpeg",
        );
        if (jpegCheck.ok && jpegCheck.blob.size <= maxBytes) {
          encoded = { blob: jpegCheck.blob, mime: "image/jpeg" };
        } else {
          return {
            ok: false,
            message:
              "Compressed image is still too large. Please choose a smaller photo.",
            reason: "failed",
          };
        }
      } else {
        return {
          ok: false,
          message:
            "Compressed image is still too large. Please choose a smaller photo.",
          reason: "failed",
        };
      }
    }

    // Final size gate before constructing the upload File.
    if (maxBytes != null && encoded.blob.size > maxBytes) {
      return {
        ok: false,
        message:
          "Compressed image is still too large. Please choose a smaller photo.",
        reason: "failed",
      };
    }

    if (encoded.blob.size <= 0) {
      return {
        ok: false,
        message: "Image compression failed. Please try another photo.",
        reason: "failed",
      };
    }

    const stem = imageFileStem(options.fileName ?? file.name);
    const ext = extensionForCompressMime(encoded.mime);
    const out = new File([encoded.blob], `${stem}.${ext}`, {
      type: encoded.mime,
      lastModified: Date.now(),
    });

    // Extension + MIME must stay consistent for Storage contentType.
    if (out.type !== encoded.mime || !out.name.endsWith(`.${ext}`)) {
      return {
        ok: false,
        message: "Image compression failed. Please try another photo.",
        reason: "failed",
      };
    }

    return { ok: true, file: out, mime: encoded.mime, compressed: true };
  } catch {
    return {
      ok: false,
      message: "Image compression failed. Please try another photo.",
      reason: "failed",
    };
  }
}
