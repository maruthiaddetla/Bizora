import {
  buildAdminListingReviewUrl,
  buildAdminListingSubmittedEmail,
  resolveAdminListingEmailSiteUrl,
} from "@/lib/email/admin-listing-submitted-template";
import { sendTransactionalEmail } from "@/lib/email/resend";
import { formatIndianCurrency, toNumber } from "@/lib/format/currency";
import type { NotificationDeliveryStatus } from "@/lib/notifications/delivery.types";
import {
  createSupabaseAdminClient,
  isSupabaseAdminConfigured,
} from "@/lib/supabase/admin";
import type { ListingType, NotificationType } from "@/lib/supabase/database.types";

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const ADMIN_LISTING_NOTIFICATION_TYPES: NotificationType[] = [
  "listing_submitted",
  "listing_resubmitted",
];

export type DeliverAdminListingEmailResult = {
  attempted: boolean;
  status: NotificationDeliveryStatus | "NOT_ATTEMPTED";
  sentCount: number;
  errorCode?: string;
};

type AdminListingNotification = {
  id: string;
  userId: string;
  type: NotificationType;
};

type AdminListingEmailContext = {
  listingId: string;
  listingTitle: string;
  listingType: ListingType;
  locationLabel: string;
  priceLabel: string | null;
  sellerName: string | null;
  notifications: AdminListingNotification[];
};

function isUuid(value: string): boolean {
  return UUID_PATTERN.test(value);
}

export function listingTypeLabel(listingType: ListingType | string | null): string {
  return listingType === "commercial_space"
    ? "Commercial space"
    : "Business for sale";
}

export function formatListingPriceLabel(row: {
  listing_type: ListingType | string | null;
  asking_price: number | string | null;
  monthly_rent: number | string | null;
}): string | null {
  if (row.listing_type === "commercial_space") {
    const rent = toNumber(row.monthly_rent);
    if (rent == null) return null;
    const formatted = formatIndianCurrency(rent);
    return formatted ? `${formatted} / month` : null;
  }
  const price = toNumber(row.asking_price);
  if (price == null) return null;
  return formatIndianCurrency(price) ?? null;
}

export function buildListingLocationLabel(parts: {
  locality_name?: string | null;
  city_name?: string | null;
  state_name?: string | null;
}): string {
  const values = [
    parts.locality_name?.trim(),
    parts.city_name?.trim(),
    parts.state_name?.trim(),
  ].filter((value): value is string => Boolean(value));

  const unique: string[] = [];
  for (const value of values) {
    if (!unique.includes(value)) unique.push(value);
  }
  return unique.length > 0 ? unique.join(", ") : "India";
}

type DeliveryClaimResult =
  | { ok: true; deliveryId: string }
  | { ok: false; reason: "already_handled" | "claim_failed" };

async function claimEmailDelivery(
  notificationId: string,
): Promise<DeliveryClaimResult> {
  const admin = createSupabaseAdminClient();
  if (!admin) {
    return { ok: false, reason: "claim_failed" };
  }

  const { data: inserted, error: insertError } = await admin
    .from("notification_deliveries")
    .insert({
      notification_id: notificationId,
      channel: "email",
      status: "PENDING",
      attempts: 1,
    })
    .select("id")
    .maybeSingle();

  if (!insertError && inserted?.id) {
    return { ok: true, deliveryId: inserted.id };
  }

  if (insertError?.code !== "23505") {
    return { ok: false, reason: "claim_failed" };
  }

  return { ok: false, reason: "already_handled" };
}

async function finalizeEmailDelivery(
  deliveryId: string,
  status: NotificationDeliveryStatus,
  params: {
    providerMessageId?: string | null;
    errorCode?: string | null;
    sentAt?: string | null;
  },
): Promise<void> {
  const admin = createSupabaseAdminClient();
  if (!admin) {
    return;
  }

  await admin
    .from("notification_deliveries")
    .update({
      status,
      provider_message_id: params.providerMessageId ?? null,
      last_error_code: params.errorCode ?? null,
      sent_at: params.sentAt ?? null,
    })
    .eq("id", deliveryId);
}

export async function resolveAdminAuthEmail(
  adminUserId: string,
): Promise<string | null> {
  if (!isUuid(adminUserId)) {
    return null;
  }

  const admin = createSupabaseAdminClient();
  if (!admin) {
    return null;
  }

  const { data, error } = await admin.auth.admin.getUserById(adminUserId);
  if (error || !data.user?.email) {
    return null;
  }

  const email = data.user.email.trim();
  return email || null;
}

/**
 * Load listing + recent admin in-app notifications created by the DB trigger
 * when status becomes pending.
 */
export async function loadAdminListingEmailContext(
  listingId: string,
): Promise<AdminListingEmailContext | null> {
  if (!isUuid(listingId)) {
    return null;
  }

  const admin = createSupabaseAdminClient();
  if (!admin) {
    return null;
  }

  const { data: listing, error: listingError } = await admin
    .from("businesses")
    .select(
      `
      id,
      title,
      listing_type,
      asking_price,
      monthly_rent,
      locality_name,
      city:cities ( name ),
      state:states ( name ),
      seller:profiles!businesses_seller_id_fkey ( full_name, display_name )
    `,
    )
    .eq("id", listingId)
    .maybeSingle();

  if (listingError || !listing) {
    return null;
  }

  const { data: notifications, error: notificationError } = await admin
    .from("notifications")
    .select("id, user_id, type, created_at")
    .eq("business_id", listingId)
    .in("type", ADMIN_LISTING_NOTIFICATION_TYPES)
    .order("created_at", { ascending: false })
    .limit(20);

  if (notificationError || !notifications || notifications.length === 0) {
    return null;
  }

  // Only deliver for the newest status-change batch (same created_at second is fine).
  const newestCreatedAt = notifications[0]?.created_at;
  const batch = notifications.filter(
    (row) => row.created_at === newestCreatedAt,
  );

  const city = listing.city as { name: string } | null;
  const state = listing.state as { name: string } | null;
  const seller = listing.seller as {
    full_name: string | null;
    display_name: string | null;
  } | null;

  const sellerName =
    seller?.full_name?.trim() || seller?.display_name?.trim() || null;

  return {
    listingId: listing.id,
    listingTitle: listing.title?.trim() || "Untitled listing",
    listingType: (listing.listing_type ?? "business") as ListingType,
    locationLabel: buildListingLocationLabel({
      locality_name: listing.locality_name,
      city_name: city?.name ?? null,
      state_name: state?.name ?? null,
    }),
    priceLabel: formatListingPriceLabel({
      listing_type: listing.listing_type,
      asking_price: listing.asking_price,
      monthly_rent: listing.monthly_rent,
    }),
    sellerName,
    notifications: batch.map((row) => ({
      id: row.id,
      userId: row.user_id,
      type: row.type as NotificationType,
    })),
  };
}

async function deliverOneAdminListingEmail(params: {
  notification: AdminListingNotification;
  context: AdminListingEmailContext;
  siteUrl: string;
}): Promise<DeliverAdminListingEmailResult> {
  const { notification, context, siteUrl } = params;
  const admin = createSupabaseAdminClient();
  if (!admin) {
    return { attempted: false, status: "NOT_ATTEMPTED", sentCount: 0, errorCode: "misconfigured" };
  }

  const { data: preferences } = await admin
    .from("notification_preferences")
    .select("email_enabled")
    .eq("user_id", notification.userId)
    .maybeSingle();

  if (preferences && !preferences.email_enabled) {
    const claim = await claimEmailDelivery(notification.id);
    if (claim.ok) {
      await finalizeEmailDelivery(claim.deliveryId, "DISABLED", {
        errorCode: "email_disabled",
      });
    }
    return { attempted: true, status: "DISABLED", sentCount: 0, errorCode: "email_disabled" };
  }

  const adminEmail = await resolveAdminAuthEmail(notification.userId);
  if (!adminEmail) {
    const claim = await claimEmailDelivery(notification.id);
    if (claim.ok) {
      await finalizeEmailDelivery(claim.deliveryId, "SKIPPED", {
        errorCode: "admin_email_missing",
      });
    }
    return {
      attempted: true,
      status: "SKIPPED",
      sentCount: 0,
      errorCode: "admin_email_missing",
    };
  }

  const claim = await claimEmailDelivery(notification.id);
  if (!claim.ok) {
    return {
      attempted: false,
      status: "NOT_ATTEMPTED",
      sentCount: 0,
      errorCode: "duplicate_delivery",
    };
  }

  const reviewUrl = buildAdminListingReviewUrl(siteUrl, context.listingId);
  const emailContent = buildAdminListingSubmittedEmail({
    listingTitle: context.listingTitle,
    listingTypeLabel: listingTypeLabel(context.listingType),
    locationLabel: context.locationLabel,
    priceLabel: context.priceLabel,
    sellerName: context.sellerName,
    reviewUrl,
    isResubmission: notification.type === "listing_resubmitted",
  });

  const sendResult = await sendTransactionalEmail({
    to: adminEmail,
    subject: emailContent.subject,
    html: emailContent.html,
    text: emailContent.text,
  });

  if (!sendResult.ok) {
    await finalizeEmailDelivery(claim.deliveryId, "FAILED", {
      errorCode: sendResult.errorCode,
    });
    if (process.env.NODE_ENV === "development") {
      console.warn(
        "[Bizora] admin listing email failed:",
        sendResult.errorCode,
      );
    }
    return {
      attempted: true,
      status: "FAILED",
      sentCount: 0,
      errorCode: sendResult.errorCode,
    };
  }

  await finalizeEmailDelivery(claim.deliveryId, "SENT", {
    providerMessageId: sendResult.messageId,
    sentAt: new Date().toISOString(),
  });

  return { attempted: true, status: "SENT", sentCount: 1 };
}

/**
 * Email admins after a listing becomes pending.
 * Relies on in-app notifications created by notify_on_business_status_change.
 * Never throws — listing submission must not depend on email success.
 */
export async function deliverAdminListingSubmittedEmail(
  listingId: string,
): Promise<DeliverAdminListingEmailResult> {
  try {
    if (!isSupabaseAdminConfigured()) {
      return {
        attempted: false,
        status: "NOT_ATTEMPTED",
        sentCount: 0,
        errorCode: "misconfigured",
      };
    }

    const context = await loadAdminListingEmailContext(listingId);
    if (!context) {
      return {
        attempted: false,
        status: "NOT_ATTEMPTED",
        sentCount: 0,
        errorCode: "context_missing",
      };
    }

    const siteUrl = resolveAdminListingEmailSiteUrl();
    let sentCount = 0;
    let lastStatus: NotificationDeliveryStatus | "NOT_ATTEMPTED" = "NOT_ATTEMPTED";
    let lastError: string | undefined;

    for (const notification of context.notifications) {
      const result = await deliverOneAdminListingEmail({
        notification,
        context,
        siteUrl,
      });
      sentCount += result.sentCount;
      if (result.status !== "NOT_ATTEMPTED") {
        lastStatus = result.status;
      }
      if (result.errorCode) {
        lastError = result.errorCode;
      }
    }

    return {
      attempted: lastStatus !== "NOT_ATTEMPTED" || sentCount > 0,
      status: sentCount > 0 ? "SENT" : lastStatus,
      sentCount,
      errorCode: sentCount > 0 ? undefined : lastError,
    };
  } catch (error) {
    if (process.env.NODE_ENV === "development") {
      console.warn(
        "[Bizora] admin listing email unexpected error:",
        error instanceof Error ? error.message : "unknown",
      );
    }
    return {
      attempted: false,
      status: "NOT_ATTEMPTED",
      sentCount: 0,
      errorCode: "unexpected_error",
    };
  }
}

/**
 * Fire-and-forget after listing submit / republish.
 */
export function scheduleAdminListingSubmittedEmail(listingId: string): void {
  void deliverAdminListingSubmittedEmail(listingId);
}
