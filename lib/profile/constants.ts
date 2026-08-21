export const PROFILE_AVATARS_BUCKET = "profile-avatars";
export const MAX_PROFILE_AVATAR_BYTES = 5 * 1024 * 1024; // 5 MB
export const MAX_PROFILE_BIO_LENGTH = 2000;
export const MAX_PROFILE_NAME_LENGTH = 120;
export const MAX_PROFILE_CITY_LENGTH = 80;
export const MAX_PROFILE_WEBSITE_LENGTH = 200;

export const ALLOWED_PROFILE_AVATAR_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
] as const;

export type AllowedProfileAvatarMime =
  (typeof ALLOWED_PROFILE_AVATAR_MIME_TYPES)[number];
