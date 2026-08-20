"use server";

import { revalidatePath } from "next/cache";
import { getCurrentUser } from "@/lib/auth/session";
import {
  createFavorite,
  deleteFavorite,
  isBusinessFavorited,
} from "@/lib/repositories/favorites.repository";

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export type FavoriteActionResult =
  | { ok: true; favorited: boolean; message?: string }
  | { ok: false; message: string; favorited?: boolean };

function isUuid(value: string): boolean {
  return UUID_PATTERN.test(value);
}

function revalidateFavoritePaths(businessId: string) {
  revalidatePath(`/listings/${businessId}`);
  revalidatePath("/dashboard/favorites");
  revalidatePath("/dashboard");
}

export async function addFavorite(businessId: string): Promise<FavoriteActionResult> {
  const user = await getCurrentUser();
  if (!user) {
    return { ok: false, message: "Please sign in to save businesses.", favorited: false };
  }
  if (!isUuid(businessId)) {
    return { ok: false, message: "Invalid listing.", favorited: false };
  }

  const result = await createFavorite(user.id, businessId);
  if (!result.ok) {
    return { ok: false, message: result.message, favorited: false };
  }

  revalidateFavoritePaths(businessId);
  return { ok: true, favorited: true, message: "Saved." };
}

export async function removeFavorite(
  businessId: string,
): Promise<FavoriteActionResult> {
  const user = await getCurrentUser();
  if (!user) {
    return { ok: false, message: "Please sign in to manage saved businesses.", favorited: false };
  }
  if (!isUuid(businessId)) {
    return { ok: false, message: "Invalid listing.", favorited: true };
  }

  const result = await deleteFavorite(user.id, businessId);
  if (!result.ok) {
    return { ok: false, message: result.message, favorited: true };
  }

  revalidateFavoritePaths(businessId);
  return { ok: true, favorited: false, message: "Removed from saved." };
}

export async function toggleFavorite(
  businessId: string,
): Promise<FavoriteActionResult> {
  const user = await getCurrentUser();
  if (!user) {
    return { ok: false, message: "Please sign in to save businesses.", favorited: false };
  }
  if (!isUuid(businessId)) {
    return { ok: false, message: "Invalid listing." };
  }

  const currentlyFavorited = await isBusinessFavorited(user.id, businessId);
  if (currentlyFavorited) {
    return removeFavorite(businessId);
  }
  return addFavorite(businessId);
}
