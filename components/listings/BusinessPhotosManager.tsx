"use client";

import Image from "next/image";
import { ChevronLeft, ChevronRight, Loader2, Star, Trash2, Upload } from "lucide-react";
import { useRef, useState, useTransition } from "react";
import {
  deleteBusinessImage,
  reorderBusinessImage,
  setPrimaryBusinessImage,
  uploadBusinessImage,
  type BusinessImageView,
} from "@/lib/business-images/actions";
import {
  MAX_BUSINESS_IMAGES,
} from "@/lib/business-images/constants";
import { validateBusinessImageFileClient } from "@/lib/business-images/validate-file";
import { Button } from "@/components/ui/Button";

type BusinessPhotosManagerProps = {
  businessId: string;
  initialImages: BusinessImageView[];
};

export function BusinessPhotosManager({
  businessId,
  initialImages,
}: BusinessPhotosManagerProps) {
  const [images, setImages] = useState(initialImages);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [selectedName, setSelectedName] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const inputRef = useRef<HTMLInputElement>(null);

  async function refreshFromServer() {
    const { listBusinessImagesForOwner } = await import(
      "@/lib/business-images/actions"
    );
    const result = await listBusinessImagesForOwner(businessId);
    if (result.ok && result.images) {
      setImages(result.images);
    }
  }

  function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    setError(null);
    setSuccess(null);
    setSelectedName(file.name);

    const clientError = validateBusinessImageFileClient(file);
    if (clientError) {
      setError(clientError);
      return;
    }

    if (images.length >= MAX_BUSINESS_IMAGES) {
      setError(`You can upload up to ${MAX_BUSINESS_IMAGES} photos per listing.`);
      return;
    }

    const formData = new FormData();
    formData.set("businessId", businessId);
    formData.set("file", file);

    startTransition(async () => {
      const result = await uploadBusinessImage(formData);
      if (!result.ok) {
        setError(result.message);
        return;
      }
      setSuccess(result.message ?? "Photo uploaded.");
      await refreshFromServer();
    });
  }

  function runAction(
    action: () => Promise<{ ok: boolean; message?: string }>,
  ) {
    setError(null);
    setSuccess(null);
    startTransition(async () => {
      const result = await action();
      if (!result.ok) {
        setError(result.message ?? "Something went wrong.");
        return;
      }
      setSuccess(result.message ?? "Updated.");
      await refreshFromServer();
    });
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm text-muted">
            Upload up to {MAX_BUSINESS_IMAGES} photos (JPEG, PNG, or WebP, max 5
            MB each). One primary photo is required before you submit for review.
          </p>
          {selectedName && (
            <p className="mt-1 text-xs text-muted">Selected: {selectedName}</p>
          )}
        </div>
        <div>
          <input
            ref={inputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="sr-only"
            onChange={handleFileChange}
            disabled={isPending || images.length >= MAX_BUSINESS_IMAGES}
          />
          <Button
            type="button"
            size="sm"
            variant="secondary"
            disabled={isPending || images.length >= MAX_BUSINESS_IMAGES}
            onClick={() => inputRef.current?.click()}
          >
            {isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
            ) : (
              <Upload className="h-4 w-4" aria-hidden />
            )}
            {isPending ? "Uploading…" : "Add Photos"}
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

      {images.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border bg-surface/60 px-4 py-10 text-center text-sm text-muted">
          No photos yet. Add at least one before submitting for review.
        </div>
      ) : (
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
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
                    disabled={isPending}
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
                  disabled={isPending}
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
                  disabled={isPending || index === 0}
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
                  disabled={isPending || index === images.length - 1}
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
