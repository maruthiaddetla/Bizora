"use client";

import Image from "next/image";
import {
  ChevronLeft,
  ChevronRight,
  Loader2,
  RotateCcw,
  Star,
  Trash2,
  Upload,
  X,
} from "lucide-react";
import { useEffect, useRef, useState, useTransition } from "react";
import {
  deleteBusinessImage,
  registerBusinessImage,
  reorderBusinessImage,
  setPrimaryBusinessImage,
} from "@/lib/business-images/actions";
import {
  photosUploadStateFromItems,
  uploadListingPhotoDirect,
  type ClientUploadPhase,
  type ClientUploadProgress,
} from "@/lib/business-images/client-upload";
import { MAX_BUSINESS_IMAGES } from "@/lib/business-images/constants";
import {
  PHOTO_UPLOAD_FAILED,
  PHOTO_UPLOADS_PENDING,
} from "@/lib/business-images/messages";
import type {
  BusinessImageView,
  BusinessPhotosUploadState,
} from "@/lib/business-images/types";
import { validateBusinessImageFileClient } from "@/lib/business-images/validate-file";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/Button";

type PendingPhoto = ClientUploadProgress & {
  file: File;
};

type BusinessPhotosManagerProps = {
  businessId: string;
  initialImages: BusinessImageView[];
  onUploadStateChange?: (state: BusinessPhotosUploadState) => void;
};

function phaseLabel(phase: ClientUploadPhase): string {
  switch (phase) {
    case "validating":
      return "Checking…";
    case "uploading":
      return "Uploading…";
    case "registering":
      return "Saving…";
    case "failed":
      return "Failed";
    case "done":
      return "Done";
    default:
      return "";
  }
}

export function BusinessPhotosManager({
  businessId,
  initialImages,
  onUploadStateChange,
}: BusinessPhotosManagerProps) {
  const [images, setImages] = useState(initialImages);
  const [pending, setPending] = useState<PendingPhoto[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isActionPending, startTransition] = useTransition();
  const inputRef = useRef<HTMLInputElement>(null);
  const pendingRef = useRef(pending);

  useEffect(() => {
    pendingRef.current = pending;
  }, [pending]);

  useEffect(() => {
    const state = photosUploadStateFromItems(pending);
    onUploadStateChange?.(state);
  }, [pending, onUploadStateChange]);

  useEffect(() => {
    return () => {
      for (const item of pendingRef.current) {
        if (item.previewUrl.startsWith("blob:")) {
          URL.revokeObjectURL(item.previewUrl);
        }
      }
    };
  }, []);

  async function refreshFromServer() {
    const { listBusinessImagesForOwner } = await import(
      "@/lib/business-images/actions"
    );
    const result = await listBusinessImagesForOwner(businessId);
    if (result.ok && result.images) {
      setImages(result.images);
    }
  }

  function patchPending(
    localId: string,
    update: Partial<ClientUploadProgress>,
  ) {
    setPending((prev) =>
      prev.map((item) =>
        item.localId === localId ? { ...item, ...update } : item,
      ),
    );
  }

  function removePending(localId: string) {
    setPending((prev) => {
      const target = prev.find((item) => item.localId === localId);
      if (target?.previewUrl.startsWith("blob:")) {
        URL.revokeObjectURL(target.previewUrl);
      }
      return prev.filter((item) => item.localId !== localId);
    });
  }

  async function runDirectUpload(file: File, existing?: PendingPhoto) {
    const previewUrl =
      existing?.previewUrl ?? URL.createObjectURL(file);
    const localId =
      existing?.localId ??
      (typeof crypto !== "undefined" && "randomUUID" in crypto
        ? crypto.randomUUID()
        : `local-${Date.now()}`);

    if (!existing) {
      setPending((prev) => [
        ...prev,
        {
          localId,
          file,
          previewUrl,
          phase: "validating",
          progress: 0,
          error: null,
          imageId: null,
          storagePath: null,
          fileName: file.name,
        },
      ]);
    } else {
      patchPending(localId, {
        phase: "validating",
        progress: 0,
        error: null,
        imageId: null,
        storagePath: null,
      });
    }

    try {
      const supabase = createSupabaseBrowserClient();
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError || !user) {
        patchPending(localId, {
          phase: "failed",
          error: PHOTO_UPLOAD_FAILED,
        });
        setError(PHOTO_UPLOAD_FAILED);
        return;
      }

      const result = await uploadListingPhotoDirect({
        supabase,
        file,
        businessId,
        userId: user.id,
        currentImageCount: images.length + pendingRef.current.filter(
          (p) => p.localId !== localId && p.phase !== "failed",
        ).length,
        localId,
        previewUrl,
        register: registerBusinessImage,
        onProgress: (update) => {
          patchPending(localId, update);
        },
      });

      if (!result.ok) {
        setError(result.message);
        setSuccess(null);
        return;
      }

      removePending(localId);
      setSuccess("Photo uploaded.");
      setError(null);
      await refreshFromServer();
    } catch {
      patchPending(localId, {
        phase: "failed",
        error: PHOTO_UPLOAD_FAILED,
      });
      setError(PHOTO_UPLOAD_FAILED);
      setSuccess(null);
    }
  }

  function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files ?? []);
    event.target.value = "";
    if (files.length === 0) return;

    setError(null);
    setSuccess(null);

    const slots =
      MAX_BUSINESS_IMAGES -
      images.length -
      pending.filter((p) => p.phase !== "failed").length;

    if (slots <= 0) {
      setError(`You can upload up to ${MAX_BUSINESS_IMAGES} photos per listing.`);
      return;
    }

    const accepted = files.slice(0, slots);
    if (files.length > slots) {
      setError(
        `Only ${slots} more photo${slots === 1 ? "" : "s"} can be added (max ${MAX_BUSINESS_IMAGES}).`,
      );
    }

    for (const file of accepted) {
      const clientError = validateBusinessImageFileClient(file);
      if (clientError) {
        setError(clientError);
        continue;
      }
      void runDirectUpload(file);
    }
  }

  function runAction(
    action: () => Promise<{ ok: boolean; message?: string }>,
  ) {
    setError(null);
    setSuccess(null);
    startTransition(async () => {
      try {
        const result = await action();
        if (!result.ok) {
          setError(result.message ?? PHOTO_UPLOAD_FAILED);
          return;
        }
        setSuccess(result.message ?? "Updated.");
        await refreshFromServer();
      } catch {
        setError(PHOTO_UPLOAD_FAILED);
      }
    });
  }

  const uploadBusy = photosUploadStateFromItems(pending).hasPendingUploads;
  const totalVisible = images.length + pending.length;
  const canAddMore =
    images.length + pending.filter((p) => p.phase !== "failed").length <
    MAX_BUSINESS_IMAGES;

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm text-muted">
            Upload up to {MAX_BUSINESS_IMAGES} photos (JPEG, PNG, or WebP, max 5
            MB each). One primary photo is required before you submit for review.
          </p>
          {uploadBusy && (
            <p className="mt-1 text-xs font-medium text-primary" role="status">
              {PHOTO_UPLOADS_PENDING}
            </p>
          )}
        </div>
        <div>
          <input
            ref={inputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            multiple
            className="sr-only"
            onChange={handleFileChange}
            disabled={!canAddMore || isActionPending}
          />
          <Button
            type="button"
            size="sm"
            variant="secondary"
            disabled={!canAddMore || isActionPending}
            onClick={() => inputRef.current?.click()}
          >
            {uploadBusy ? (
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
            ) : (
              <Upload className="h-4 w-4" aria-hidden />
            )}
            {uploadBusy ? "Uploading…" : "Add Photos"}
          </Button>
        </div>
      </div>

      {error && (
        <div
          role="alert"
          className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800"
        >
          {error}
        </div>
      )}
      {success && !error && (
        <div
          role="status"
          className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-900"
        >
          {success}
        </div>
      )}

      {totalVisible === 0 ? (
        <div className="rounded-xl border border-dashed border-border bg-surface/60 px-4 py-10 text-center text-sm text-muted">
          No photos yet. Add at least one before submitting for review.
        </div>
      ) : (
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {pending.map((item) => (
            <li
              key={item.localId}
              className="overflow-hidden rounded-xl border border-border bg-white shadow-sm"
            >
              <div className="relative aspect-[4/3] bg-surface">
                {/* eslint-disable-next-line @next/next/no-img-element -- blob preview */}
                <img
                  src={item.previewUrl}
                  alt={item.fileName}
                  className="h-full w-full object-cover"
                />
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/45 px-2 text-center text-white">
                  {item.phase !== "failed" ? (
                    <>
                      <Loader2
                        className="mb-1 h-5 w-5 animate-spin"
                        aria-hidden
                      />
                      <span className="text-xs font-medium">
                        {phaseLabel(item.phase)}
                      </span>
                      <span className="mt-1 text-[11px] tabular-nums opacity-90">
                        {Math.max(0, Math.min(100, item.progress))}%
                      </span>
                    </>
                  ) : (
                    <span className="text-xs font-medium text-red-100">
                      Upload failed
                    </span>
                  )}
                </div>
              </div>
              <div className="space-y-1 p-2">
                {item.error && (
                  <p className="text-[11px] leading-snug text-red-700">
                    {item.error}
                  </p>
                )}
                <div className="flex flex-wrap gap-1">
                  {item.phase === "failed" && (
                    <button
                      type="button"
                      className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-primary hover:bg-primary-light"
                      onClick={() => void runDirectUpload(item.file, item)}
                    >
                      <RotateCcw className="h-3 w-3" aria-hidden />
                      Retry
                    </button>
                  )}
                  <button
                    type="button"
                    className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-red-700 hover:bg-red-50"
                    disabled={
                      item.phase === "uploading" || item.phase === "registering"
                    }
                    onClick={() => removePending(item.localId)}
                  >
                    <X className="h-3 w-3" aria-hidden />
                    Remove
                  </button>
                </div>
              </div>
            </li>
          ))}

          {images.map((image, index) => (
            <li
              key={image.id}
              className="overflow-hidden rounded-xl border border-border bg-white shadow-sm"
            >
              <div className="relative aspect-[4/3] bg-surface">
                <Image
                  src={image.displayUrl}
                  alt={`Business photo ${index + 1}`}
                  fill
                  className="object-cover"
                  sizes="(max-width: 640px) 50vw, 200px"
                  unoptimized
                />
                {image.isPrimary && (
                  <span className="absolute left-2 top-2 inline-flex items-center gap-1 rounded-md bg-amber-500 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-white">
                    <Star className="h-3 w-3" aria-hidden />
                    Primary
                  </span>
                )}
              </div>
              <div className="flex flex-wrap gap-1 p-2">
                {!image.isPrimary && (
                  <button
                    type="button"
                    className="rounded-md px-2 py-1 text-xs font-medium text-primary hover:bg-primary-light disabled:opacity-50"
                    disabled={isActionPending || uploadBusy}
                    onClick={() =>
                      runAction(() =>
                        setPrimaryBusinessImage(businessId, image.id),
                      )
                    }
                  >
                    Primary
                  </button>
                )}
                <button
                  type="button"
                  className="rounded-md px-2 py-1 text-xs font-medium text-red-700 hover:bg-red-50 disabled:opacity-50"
                  disabled={isActionPending || uploadBusy}
                  onClick={() =>
                    runAction(() => deleteBusinessImage(businessId, image.id))
                  }
                >
                  <span className="inline-flex items-center gap-1">
                    <Trash2 className="h-3 w-3" aria-hidden />
                    Delete
                  </span>
                </button>
                <button
                  type="button"
                  className="rounded-md px-2 py-1 text-xs font-medium text-muted hover:bg-surface disabled:opacity-50"
                  disabled={isActionPending || uploadBusy || index === 0}
                  aria-label="Move photo left"
                  onClick={() =>
                    runAction(() =>
                      reorderBusinessImage(businessId, image.id, "left"),
                    )
                  }
                >
                  <ChevronLeft className="h-3.5 w-3.5" aria-hidden />
                </button>
                <button
                  type="button"
                  className="rounded-md px-2 py-1 text-xs font-medium text-muted hover:bg-surface disabled:opacity-50"
                  disabled={
                    isActionPending ||
                    uploadBusy ||
                    index === images.length - 1
                  }
                  aria-label="Move photo right"
                  onClick={() =>
                    runAction(() =>
                      reorderBusinessImage(businessId, image.id, "right"),
                    )
                  }
                >
                  <ChevronRight className="h-3.5 w-3.5" aria-hidden />
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
