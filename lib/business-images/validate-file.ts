import {
  ALLOWED_BUSINESS_IMAGE_MIME_TYPES,
  MAX_BUSINESS_IMAGE_BYTES,
  type AllowedBusinessImageMime,
} from "@/lib/business-images/constants";
import {
  PHOTO_EMPTY,
  PHOTO_TOO_LARGE,
  PHOTO_TYPE_INVALID,
} from "@/lib/business-images/messages";

export type ImageFileValidationResult =
  | {
      ok: true;
      mime: AllowedBusinessImageMime;
      extension: "jpg" | "png" | "webp";
    }
  | { ok: false; message: string };

function startsWithBytes(bytes: Uint8Array, signature: number[]): boolean {
  if (bytes.length < signature.length) return false;
  return signature.every((value, index) => bytes[index] === value);
}

function detectMimeFromMagic(bytes: Uint8Array): AllowedBusinessImageMime | null {
  // JPEG
  if (startsWithBytes(bytes, [0xff, 0xd8, 0xff])) {
    return "image/jpeg";
  }

  // PNG
  if (
    startsWithBytes(bytes, [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])
  ) {
    return "image/png";
  }

  // WEBP: RIFF....WEBP
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

function extensionForMime(mime: AllowedBusinessImageMime): "jpg" | "png" | "webp" {
  if (mime === "image/jpeg") return "jpg";
  if (mime === "image/png") return "png";
  return "webp";
}

/**
 * Validate size + MIME using declared type and magic bytes.
 * Never trust browser MIME alone.
 */
export async function validateBusinessImageFile(
  file: File | Blob,
  declaredType?: string | null,
): Promise<ImageFileValidationResult> {
  if (file.size <= 0) {
    return { ok: false, message: PHOTO_EMPTY };
  }

  if (file.size > MAX_BUSINESS_IMAGE_BYTES) {
    return {
      ok: false,
      message: PHOTO_TOO_LARGE,
    };
  }

  const header = new Uint8Array(await file.slice(0, 16).arrayBuffer());
  const magicMime = detectMimeFromMagic(header);

  if (!magicMime) {
    return {
      ok: false,
      message: PHOTO_TYPE_INVALID,
    };
  }

  const declared = (declaredType ?? ("type" in file ? file.type : "") ?? "")
    .toLowerCase()
    .trim();

  if (
    declared &&
    !(ALLOWED_BUSINESS_IMAGE_MIME_TYPES as readonly string[]).includes(declared)
  ) {
    return {
      ok: false,
      message: PHOTO_TYPE_INVALID,
    };
  }

  // If browser declared a type, it must agree with magic bytes
  if (declared && declared !== magicMime) {
    return {
      ok: false,
      message: PHOTO_TYPE_INVALID,
    };
  }

  return {
    ok: true,
    mime: magicMime,
    extension: extensionForMime(magicMime),
  };
}

/** Lightweight client-side pre-check (still re-validated with magic bytes before upload). */
export function validateBusinessImageFileClient(file: File): string | null {
  if (file.size <= 0) return PHOTO_EMPTY;
  if (file.size > MAX_BUSINESS_IMAGE_BYTES) {
    return PHOTO_TOO_LARGE;
  }
  const type = file.type.toLowerCase();
  if (
    !(ALLOWED_BUSINESS_IMAGE_MIME_TYPES as readonly string[]).includes(type)
  ) {
    return PHOTO_TYPE_INVALID;
  }
  return null;
}
