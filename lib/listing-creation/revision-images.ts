/**
 * Pure helpers for cloning published listing images onto an edit revision.
 */

export type SourceBusinessImage = {
  image_url: string;
  storage_path: string | null;
  sort_order: number;
  is_primary: boolean;
};

export type RevisionImageInsert = {
  business_id: string;
  image_url: string;
  storage_path: string | null;
  sort_order: number;
  is_primary: boolean;
};

/**
 * Build business_images insert rows for a revision, preserving order + primary.
 * Reuses storage_path so bytes are not copied; published rows stay untouched.
 */
export function buildRevisionImageClones(
  revisionId: string,
  sourceImages: SourceBusinessImage[],
): RevisionImageInsert[] {
  return sourceImages.map((image) => ({
    business_id: revisionId,
    image_url: image.image_url,
    storage_path: image.storage_path,
    sort_order: image.sort_order,
    is_primary: image.is_primary,
  }));
}

/**
 * Storage objects should only be removed when the path belongs to this listing
 * and no other business_images row still references it (e.g. published listing).
 */
export function shouldRemoveStorageObject(params: {
  storagePath: string | null | undefined;
  listingId: string;
  remainingReferences: number;
}): boolean {
  const path = params.storagePath?.trim();
  if (!path) return false;
  if (params.remainingReferences > 0) return false;
  return path.includes(`/${params.listingId}/`);
}

export function revisionNeedsImageBackfill(params: {
  revisionImageCount: number;
  publishedImageCount: number;
}): boolean {
  return params.revisionImageCount === 0 && params.publishedImageCount > 0;
}
