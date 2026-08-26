export type BusinessImageView = {
  id: string;
  businessId: string;
  sortOrder: number;
  isPrimary: boolean;
  displayUrl: string;
  storagePath: string | null;
};

export type BusinessImageActionResult =
  | {
      ok: true;
      message?: string;
      images?: BusinessImageView[];
      image?: BusinessImageView;
    }
  | { ok: false; message: string };

export type BusinessPhotosUploadState = {
  /** True while any photo is uploading or registering. */
  hasPendingUploads: boolean;
  /** True when at least one photo failed and needs retry/remove. */
  hasFailedUploads: boolean;
};
