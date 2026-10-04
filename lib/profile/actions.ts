"use server";

import { revalidatePath } from "next/cache";
import { getCurrentUser } from "@/lib/auth/session";
import {
  ALLOWED_PROFILE_AVATAR_MIME_TYPES,
  MAX_PROFILE_AVATAR_BYTES,
  PROFILE_AVATARS_BUCKET,
  type AllowedProfileAvatarMime,
} from "@/lib/profile/constants";
import { parseSellerProfileFields } from "@/lib/profile/parse";
import {
  updateMyAvatarPath,
  updateMySellerProfile,
} from "@/lib/repositories/profiles.repository";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export type ProfileActionResult =
  | { ok: true; message?: string }
  | { ok: false; message: string };

function revalidateProfilePaths(userId: string) {
  revalidatePath("/dashboard/profile");
  revalidatePath("/dashboard");
  revalidatePath(`/sellers/${userId}`);
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
  const parsed = parseSellerProfileFields(input);
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
