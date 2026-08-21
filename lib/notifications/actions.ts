"use server";

import { revalidatePath } from "next/cache";
import { getCurrentUser } from "@/lib/auth/session";
import {
  markAllNotificationsRead as markAllInRepo,
  markNotificationRead as markOneInRepo,
} from "@/lib/repositories/notifications.repository";

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export type NotificationActionResult =
  | { ok: true; message?: string }
  | { ok: false; message: string };

function isUuid(value: string): boolean {
  return UUID_PATTERN.test(value);
}

function revalidateNotificationPaths() {
  revalidatePath("/dashboard/notifications");
  revalidatePath("/dashboard");
}

export async function markNotificationRead(
  notificationId: string,
): Promise<NotificationActionResult> {
  const user = await getCurrentUser();
  if (!user) {
    return { ok: false, message: "Please sign in to manage notifications." };
  }
  if (!isUuid(notificationId)) {
    return { ok: false, message: "Invalid notification." };
  }

  const result = await markOneInRepo(user.id, notificationId);
  if (!result.ok) {
    return { ok: false, message: result.message };
  }

  revalidateNotificationPaths();
  return { ok: true };
}

export async function markAllNotificationsRead(): Promise<NotificationActionResult> {
  const user = await getCurrentUser();
  if (!user) {
    return { ok: false, message: "Please sign in to manage notifications." };
  }

  const result = await markAllInRepo(user.id);
  if (!result.ok) {
    return { ok: false, message: result.message };
  }

  revalidateNotificationPaths();
  return {
    ok: true,
    message:
      result.updated > 0
        ? "All notifications marked as read."
        : "No unread notifications.",
  };
}
