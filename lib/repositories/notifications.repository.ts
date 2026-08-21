import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { NotificationType } from "@/lib/supabase/database.types";

const NOTIFICATIONS_FETCH_ERROR =
  "We couldn't load notifications right now. Please try again shortly.";

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function isUuid(value: string): boolean {
  return UUID_PATTERN.test(value);
}

export type NotificationView = {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  businessId: string | null;
  enquiryId: string | null;
  isRead: boolean;
  createdAt: string;
  href: string | null;
};

export type FetchMyNotificationsResult =
  | {
      notifications: NotificationView[];
      total: number;
      unreadCount: number;
      error: null;
    }
  | {
      notifications: [];
      total: 0;
      unreadCount: 0;
      error: string;
    };

/**
 * Deep-link for a notification based on type and related IDs.
 */
export function notificationHref(params: {
  type: NotificationType;
  businessId: string | null;
  enquiryId: string | null;
}): string | null {
  const { type, businessId, enquiryId } = params;

  switch (type) {
    case "listing_submitted":
    case "listing_resubmitted":
      return businessId ? `/admin/listings/${businessId}` : "/admin/listings";
    case "listing_approved":
      return businessId ? `/listings/${businessId}` : "/dashboard";
    case "listing_rejected":
      return businessId
        ? `/dashboard/listings/${businessId}/edit`
        : "/dashboard";
    case "listing_sold":
      return "/dashboard/favorites";
    case "new_enquiry":
    case "enquiry_response":
      return enquiryId
        ? `/dashboard/enquiries/${enquiryId}`
        : "/dashboard/enquiries";
    default:
      return "/dashboard/notifications";
  }
}

function mapRow(row: {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  business_id: string | null;
  enquiry_id: string | null;
  is_read: boolean;
  created_at: string;
}): NotificationView {
  return {
    id: row.id,
    type: row.type,
    title: row.title,
    message: row.message,
    businessId: row.business_id,
    enquiryId: row.enquiry_id,
    isRead: row.is_read,
    createdAt: row.created_at,
    href: notificationHref({
      type: row.type,
      businessId: row.business_id,
      enquiryId: row.enquiry_id,
    }),
  };
}

/**
 * Ownership-scoped notifications for the given user (newest first).
 */
export async function fetchMyNotifications(
  userId: string,
  options: { page?: number; pageSize?: number } = {},
): Promise<FetchMyNotificationsResult> {
  if (!isUuid(userId)) {
    return {
      notifications: [],
      total: 0,
      unreadCount: 0,
      error: NOTIFICATIONS_FETCH_ERROR,
    };
  }

  const page =
    options.page != null && options.page >= 1 ? Math.floor(options.page) : 1;
  const pageSize =
    options.pageSize != null && options.pageSize >= 1
      ? Math.min(Math.floor(options.pageSize), 50)
      : 20;
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  const supabase = await createSupabaseServerClient();
  if (!supabase) {
    return {
      notifications: [],
      total: 0,
      unreadCount: 0,
      error: NOTIFICATIONS_FETCH_ERROR,
    };
  }

  const [listResult, unreadResult] = await Promise.all([
    supabase
      .from("notifications")
      .select(
        "id, type, title, message, business_id, enquiry_id, is_read, created_at",
        { count: "exact" },
      )
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .range(from, to),
    supabase
      .from("notifications")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId)
      .eq("is_read", false),
  ]);

  if (listResult.error) {
    if (process.env.NODE_ENV === "development") {
      console.warn(
        "[Bizora] fetchMyNotifications failed:",
        listResult.error.message,
      );
    }
    return {
      notifications: [],
      total: 0,
      unreadCount: 0,
      error: NOTIFICATIONS_FETCH_ERROR,
    };
  }

  const rows = listResult.data ?? [];
  return {
    notifications: rows.map(mapRow),
    total: listResult.count ?? rows.length,
    unreadCount: unreadResult.count ?? 0,
    error: null,
  };
}

export async function countUnreadNotifications(userId: string): Promise<number> {
  if (!isUuid(userId)) return 0;

  const supabase = await createSupabaseServerClient();
  if (!supabase) return 0;

  const { count, error } = await supabase
    .from("notifications")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .eq("is_read", false);

  if (error) {
    if (process.env.NODE_ENV === "development") {
      console.warn(
        "[Bizora] countUnreadNotifications failed:",
        error.message,
      );
    }
    return 0;
  }

  return count ?? 0;
}

export async function markNotificationRead(
  userId: string,
  notificationId: string,
): Promise<{ ok: true } | { ok: false; message: string }> {
  if (!isUuid(userId) || !isUuid(notificationId)) {
    return { ok: false, message: "Invalid notification." };
  }

  const supabase = await createSupabaseServerClient();
  if (!supabase) {
    return {
      ok: false,
      message: "Notifications are temporarily unavailable. Please try again.",
    };
  }

  const { data, error } = await supabase
    .from("notifications")
    .update({ is_read: true })
    .eq("id", notificationId)
    .eq("user_id", userId)
    .select("id")
    .maybeSingle();

  if (error) {
    if (process.env.NODE_ENV === "development") {
      console.warn("[Bizora] markNotificationRead failed:", error.message);
    }
    return {
      ok: false,
      message: "We couldn't update that notification. Please try again.",
    };
  }

  if (!data) {
    return { ok: false, message: "Notification not found." };
  }

  return { ok: true };
}

export async function markAllNotificationsRead(
  userId: string,
): Promise<{ ok: true; updated: number } | { ok: false; message: string }> {
  if (!isUuid(userId)) {
    return { ok: false, message: "Invalid request." };
  }

  const supabase = await createSupabaseServerClient();
  if (!supabase) {
    return {
      ok: false,
      message: "Notifications are temporarily unavailable. Please try again.",
    };
  }

  const { data, error } = await supabase
    .from("notifications")
    .update({ is_read: true })
    .eq("user_id", userId)
    .eq("is_read", false)
    .select("id");

  if (error) {
    if (process.env.NODE_ENV === "development") {
      console.warn(
        "[Bizora] markAllNotificationsRead failed:",
        error.message,
      );
    }
    return {
      ok: false,
      message: "We couldn't mark notifications as read. Please try again.",
    };
  }

  return { ok: true, updated: data?.length ?? 0 };
}
