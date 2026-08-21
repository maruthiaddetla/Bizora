"use server";

import { revalidatePath } from "next/cache";
import { getCurrentUser } from "@/lib/auth/session";
import {
  ALLOWED_PROFILE_AVATAR_MIME_TYPES,
  MAX_PROFILE_AVATAR_BYTES,
  MAX_PROFILE_BIO_LENGTH,
  MAX_PROFILE_CITY_LENGTH,
  MAX_PROFILE_NAME_LENGTH,
  MAX_PROFILE_WEBSITE_LENGTH,
  PROFILE_AVATARS_BUCKET,
  type AllowedProfileAvatarMime,
} from "@/lib/profile/constants";
import {
  updateMyAvatarPath,
  updateMySellerProfile,
  type SellerProfileUpdateInput,
} from "@/lib/repositories/profiles.repository";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export type ProfileActionResult =
  | { ok: true; message?: string }
  | { ok: false; message: string };

function sanitizeText(value: unknown, maxLen: number): string | null {
  if (value == null) return null;
  if (typeof value !== "string") return null;
  const trimmed = value.trim().replace(/\s+/g, " ");
  if (!trimmed) return null;
  return trimmed.slice(0, maxLen);
}

function sanitizeMultiline(value: unknown, maxLen: number): string | null {
  if (value == null) return null;
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  return trimmed.slice(0, maxLen);
}

function normalizeWebsite(value: unknown):
  | { ok: true; value: string | null }
  | { ok: false; message: string } {
  if (value == null || value === "") return { ok: true, value: null };
  if (typeof value !== "string") {
    return { ok: false, message: "Website must be a valid URL." };
  }
  const trimmed = value.trim();
  if (!trimmed) return { ok: true, value: null };
  if (trimmed.length > MAX_PROFILE_WEBSITE_LENGTH) {
    return { ok: false, message: "Website URL is too long." };
  }

  let url: URL;
  try {
    url = new URL(trimmed.includes("://") ? trimmed : `https://${trimmed}`);
  } catch {
    return { ok: false, message: "Enter a valid website URL." };
  }

  if (url.protocol !== "http:" && url.protocol !== "https:") {
    return { ok: false, message: "Website must use http or https." };
  }

  return { ok: true, value: url.toString() };
}

function revalidateProfilePaths(userId: string) {
  revalidatePath("/dashboard/profile");
  revalidatePath("/dashboard");
  revalidatePath(`/sellers/${userId}`);
}

function parseProfileFields(input: {
  displayName?: unknown;
  companyName?: unknown;
  bio?: unknown;
  city?: unknown;
  website?: unknown;
}): { ok: true; data: SellerProfileUpdateInput } | { ok: false; message: string } {
  const displayName = sanitizeText(input.displayName, MAX_PROFILE_NAME_LENGTH);
  const companyName = sanitizeText(input.companyName, MAX_PROFILE_NAME_LENGTH);
  const bio = sanitizeMultiline(input.bio, MAX_PROFILE_BIO_LENGTH);
  const city = sanitizeText(input.city, MAX_PROFILE_CITY_LENGTH);
  const websiteResult = normalizeWebsite(input.website);
  if (!websiteResult.ok) return websiteResult;

  if (bio && bio.length > MAX_PROFILE_BIO_LENGTH) {
    return {
      ok: false,
      message: `Bio must be ${MAX_PROFILE_BIO_LENGTH} characters or fewer.`,
    };
  }

  return {
    ok: true,
    data: {
      displayName,
      companyName,
      bio,
      city,
      website: websiteResult.value,
    },
  };
}

export async function updateMyProfile(input: {
  displayName?: unknown;
  companyName?: unknown;
  bio?: unknown;
  city?: unknown;
  website?: unknown;
}): Promise<ProfileActionResult> {
  const user = await getCurrentUser();
  if (!user) {
    return { ok: false, message: "Please sign in to update your profile." };
  }

  // Never accept role, user id, email, seller_id from client
  const parsed = parseProfileFields(input);
  if (!parsed.ok) return parsed;

  const result = await updateMySellerProfile(user.id, parsed.data);
  if (!result.ok) return result;

  revalidateProfilePaths(user.id);
  return { ok: true, message: "Profile saved." };
}

export async function updateMyProfileFormAction(
  _prev: ProfileActionResult | null,
  formData: FormData,
): Promise<ProfileActionResult> {
  return updateMyProfile({
    displayName: formData.get("displayName"),
    companyName: formData.get("companyName"),
    bio: formData.get("bio"),
    city: formData.get("city"),
    website: formData.get("website"),
  });
}

function mimeToExt(mime: AllowedProfileAvatarMime): string {
  if (mime === "image/png") return "png";
  if (mime === "image/webp") return "webp";
  return "jpg";
}

export async function uploadMyAvatar(
  formData: FormData,
): Promise<ProfileActionResult> {
  const user = await getCurrentUser();
  if (!user) {
    return { ok: false, message: "Please sign in to upload an avatar." };
  }

  const file = formData.get("avatar");
  if (!(file instanceof File) || file.size === 0) {
    return { ok: false, message: "Choose an image to upload." };
  }

  if (file.size > MAX_PROFILE_AVATAR_BYTES) {
    return { ok: false, message: "Avatar must be 5 MB or smaller." };
  }

  const mime = file.type as AllowedProfileAvatarMime;
  if (!ALLOWED_PROFILE_AVATAR_MIME_TYPES.includes(mime)) {
    return { ok: false, message: "Avatar must be a JPEG, PNG, or WebP image." };
  }

  const supabase = await createSupabaseServerClient();
  if (!supabase) {
    return {
      ok: false,
      message: "Avatar upload is temporarily unavailable. Please try again.",
    };
  }

  const ext = mimeToExt(mime);
  const path = `${user.id}/avatar.${ext}`;

  // Remove prior avatar variants for this user
  const { data: existing } = await supabase.storage
    .from(PROFILE_AVATARS_BUCKET)
    .list(user.id);
  if (existing && existing.length > 0) {
    await supabase.storage
      .from(PROFILE_AVATARS_BUCKET)
      .remove(existing.map((f) => `${user.id}/${f.name}`));
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const { error: uploadError } = await supabase.storage
    .from(PROFILE_AVATARS_BUCKET)
    .upload(path, buffer, {
      contentType: mime,
      upsert: true,
    });

  if (uploadError) {
    if (process.env.NODE_ENV === "development") {
      console.warn("[Bizora] avatar upload failed:", uploadError.message);
    }
    return { ok: false, message: "We couldn't upload that image. Please try again." };
  }

  const pathResult = await updateMyAvatarPath(user.id, path);
  if (!pathResult.ok) return pathResult;

  revalidateProfilePaths(user.id);
  return { ok: true, message: "Avatar updated." };
}

export async function removeMyAvatar(): Promise<ProfileActionResult> {
  const user = await getCurrentUser();
  if (!user) {
    return { ok: false, message: "Please sign in to manage your avatar." };
  }

  const supabase = await createSupabaseServerClient();
  if (!supabase) {
    return {
      ok: false,
      message: "Avatar updates are temporarily unavailable. Please try again.",
    };
  }

  const { data: existing } = await supabase.storage
    .from(PROFILE_AVATARS_BUCKET)
    .list(user.id);
  if (existing && existing.length > 0) {
    await supabase.storage
      .from(PROFILE_AVATARS_BUCKET)
      .remove(existing.map((f) => `${user.id}/${f.name}`));
  }

  const pathResult = await updateMyAvatarPath(user.id, null);
  if (!pathResult.ok) return pathResult;

  revalidateProfilePaths(user.id);
  return { ok: true, message: "Avatar removed." };
}
