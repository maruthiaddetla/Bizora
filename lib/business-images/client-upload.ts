import {
  BUSINESS_IMAGES_BUCKET,
  BUSINESS_IMAGE_UPLOAD_MAX_EDGE_PX,
  MAX_BUSINESS_IMAGE_BYTES,
  MAX_BUSINESS_IMAGES,
} from "@/lib/business-images/constants";
import {
  PHOTO_COMPRESS_FAILED,
  PHOTO_REGISTER_FAILED,
  PHOTO_TOO_LARGE,
  PHOTO_UPLOAD_FAILED,
} from "@/lib/business-images/messages";
import {
  buildBusinessImageStoragePath,
  extensionForBusinessImageMime,
} from "@/lib/business-images/storage-path";
import { validateBusinessImageFile } from "@/lib/business-images/validate-file";
import { compressImageForUpload } from "@/lib/images/compress-image";
import type { SupabaseClient } from "@supabase/supabase-js";

export type ClientUploadPhase =
  | "validating"
  | "uploading"
  | "registering"
  | "done"
  | "failed";

export type ClientUploadProgress = {
  localId: string;
  phase: ClientUploadPhase;
  /** 0–100; indeterminate phases may stay at prior value. */
  progress: number;
  error: string | null;
  imageId: string | null;
  storagePath: string | null;
  previewUrl: string;
  fileName: string;
};

export type RegisterBusinessImageFn = (input: {
  businessId: string;
  imageId: string;
  storagePath: string;
  mime: string;
}) => Promise<{ ok: true; message?: string } | { ok: false; message: string }>;

function newLocalId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `local-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

/**
 * Upload a listing photo directly to Supabase Storage, then register metadata
 * via a Server Action (no image bytes through Next.js).
 */
export async function uploadListingPhotoDirect(params: {
  supabase: SupabaseClient;
  file: File;
  businessId: string;
  userId: string;
  currentImageCount: number;
  register: RegisterBusinessImageFn;
  onProgress?: (update: Partial<ClientUploadProgress> & { localId: string }) => void;
  /** Reuse localId / preview on retry. */
  localId?: string;
  previewUrl?: string;
}): Promise<
  | { ok: true; localId: string; imageId: string; storagePath: string }
  | { ok: false; localId: string; message: string; storagePath?: string; imageId?: string }
> {
  const localId = params.localId ?? newLocalId();
  const previewUrl =
    params.previewUrl ??
    (typeof URL !== "undefined" ? URL.createObjectURL(params.file) : "");

  const emit = (
    update: Omit<Partial<ClientUploadProgress>, "localId"> & {
      phase?: ClientUploadPhase;
    },
  ) => {
    params.onProgress?.({ localId, previewUrl, fileName: params.file.name, ...update });
  };

  emit({ phase: "validating", progress: 5, error: null, imageId: null, storagePath: null });

  if (params.currentImageCount >= MAX_BUSINESS_IMAGES) {
    const message = `You can upload up to ${MAX_BUSINESS_IMAGES} photos per listing.`;
    emit({ phase: "failed", progress: 0, error: message });
    return { ok: false, localId, message };
  }

  const precheck = await validateBusinessImageFile(
    params.file,
    params.file.type,
  );
  if (!precheck.ok) {
    emit({ phase: "failed", progress: 0, error: precheck.message });
    return { ok: false, localId, message: precheck.message };
  }

  // Resize/compress before Storage — never upload the original when compression fails.
  const compressed = await compressImageForUpload(params.file, {
    maxEdgePx: BUSINESS_IMAGE_UPLOAD_MAX_EDGE_PX,
    maxBytes: MAX_BUSINESS_IMAGE_BYTES,
    fileName: params.file.name,
  });

  if (!compressed.ok) {
    emit({
      phase: "failed",
      progress: 5,
      error: compressed.message || PHOTO_COMPRESS_FAILED,
    });
    return {
      ok: false,
      localId,
      message: compressed.message || PHOTO_COMPRESS_FAILED,
    };
  }

  const uploadFile = compressed.file;
  if (uploadFile.size <= 0 || uploadFile.size > MAX_BUSINESS_IMAGE_BYTES) {
    const message =
      uploadFile.size <= 0 ? PHOTO_COMPRESS_FAILED : PHOTO_TOO_LARGE;
    emit({ phase: "failed", progress: 5, error: message });
    return { ok: false, localId, message };
  }

  const validation = await validateBusinessImageFile(
    uploadFile,
    compressed.mime,
  );
  if (!validation.ok) {
    emit({ phase: "failed", progress: 5, error: validation.message });
    return { ok: false, localId, message: validation.message };
  }

  // Storage path extension and contentType must match compressed MIME (e.g. .webp).
  const mime = validation.mime;
  const imageId =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : newLocalId();
  const extension = extensionForBusinessImageMime(mime);
  const storagePath = buildBusinessImageStoragePath({
    userId: params.userId,
    businessId: params.businessId,
    imageId,
    extension,
  });

  emit({
    phase: "uploading",
    progress: 15,
    error: null,
    imageId,
    storagePath,
  });

  const { error: uploadError } = await params.supabase.storage
    .from(BUSINESS_IMAGES_BUCKET)
    .upload(storagePath, uploadFile, {
      contentType: mime,
      upsert: false,
    });

  if (uploadError) {
    if (process.env.NODE_ENV === "development") {
      console.warn("[Bizora] direct storage upload failed:", uploadError.message);
    }
    emit({ phase: "failed", progress: 15, error: PHOTO_UPLOAD_FAILED });
    return { ok: false, localId, message: PHOTO_UPLOAD_FAILED, imageId, storagePath };
  }

  emit({ phase: "registering", progress: 80, error: null, imageId, storagePath });

  try {
    const registered = await params.register({
      businessId: params.businessId,
      imageId,
      storagePath,
      mime,
    });

    if (!registered.ok) {
      // Best-effort cleanup of orphaned storage object
      await params.supabase.storage
        .from(BUSINESS_IMAGES_BUCKET)
        .remove([storagePath])
        .catch(() => undefined);
      const message = registered.message || PHOTO_REGISTER_FAILED;
      emit({ phase: "failed", progress: 80, error: message });
      return { ok: false, localId, message, imageId, storagePath };
    }
  } catch {
    await params.supabase.storage
      .from(BUSINESS_IMAGES_BUCKET)
      .remove([storagePath])
      .catch(() => undefined);
    emit({ phase: "failed", progress: 80, error: PHOTO_REGISTER_FAILED });
    return { ok: false, localId, message: PHOTO_REGISTER_FAILED, imageId, storagePath };
  }

  emit({ phase: "done", progress: 100, error: null, imageId, storagePath });
  return { ok: true, localId, imageId, storagePath };
}

export function photosUploadStateFromItems(
  items: Array<{ phase: ClientUploadPhase }>,
): { hasPendingUploads: boolean; hasFailedUploads: boolean } {
  return {
    hasPendingUploads: items.some(
      (item) =>
        item.phase === "validating" ||
        item.phase === "uploading" ||
        item.phase === "registering",
    ),
    hasFailedUploads: items.some((item) => item.phase === "failed"),
  };
}
