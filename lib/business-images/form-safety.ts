import { PHOTO_UPLOADS_PENDING } from "@/lib/business-images/messages";

/**
 * Forms use controlled React state for listing fields. Upload / server-action
 * failures must never replace that state with empty defaults.
 */
export function preserveListingFormFieldsAfterFailure<T extends Record<string, unknown>>(
  currentFields: T,
  failure: { ok: false; message: string },
): T {
  // Controlled form state must survive failure payloads; only the message is shown.
  void failure.message;
  return currentFields;
}

export function canSubmitWhilePhotosUpload(hasPendingUploads: boolean): {
  allow: boolean;
  message: string | null;
} {
  if (hasPendingUploads) {
    return { allow: false, message: PHOTO_UPLOADS_PENDING };
  }
  return { allow: true, message: null };
}
