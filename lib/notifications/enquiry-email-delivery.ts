import {
  buildEnquiryDashboardUrl,
  buildEnquirySellerEmail,
} from "@/lib/email/enquiry-seller-template";
import { sendTransactionalEmail } from "@/lib/email/resend";
import type {
  NotificationDeliveryStatus,
} from "@/lib/notifications/delivery.types";
import {
  createSupabaseAdminClient,
  isSupabaseAdminConfigured,
} from "@/lib/supabase/admin";

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export type DeliverSellerEnquiryEmailResult = {
  attempted: boolean;
  status: NotificationDeliveryStatus | "NOT_ATTEMPTED";
  errorCode?: string;
};

type EnquiryNotificationContext = {
  enquiryId: string;
  sellerId: string;
  listingTitle: string;
  buyerName: string;
  message: string;
  notificationId: string;
};

function isUuid(value: string): boolean {
  return UUID_PATTERN.test(value);
}

function resolveSiteUrl(): string | null {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  return siteUrl || null;
}

function buyerDisplayName(fullName: string | null | undefined): string {
  const name = fullName?.trim();
  return name || "A buyer";
}

export async function loadEnquiryNotificationContext(
  enquiryId: string,
): Promise<EnquiryNotificationContext | null> {
  if (!isUuid(enquiryId)) {
    return null;
  }

  const admin = createSupabaseAdminClient();
  if (!admin) {
    return null;
  }

  const { data: enquiry, error: enquiryError } = await admin
    .from("enquiries")
    .select(
      `
      id,
      seller_id,
      message,
      business:businesses ( title ),
      buyer:profiles!enquiries_buyer_id_fkey ( full_name )
    `,
    )
    .eq("id", enquiryId)
    .maybeSingle();

  if (enquiryError || !enquiry) {
    return null;
  }

  const { data: notification, error: notificationError } = await admin
    .from("notifications")
    .select("id")
    .eq("enquiry_id", enquiryId)
    .eq("type", "new_enquiry")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (notificationError || !notification) {
    return null;
  }

  const business = enquiry.business as { title: string } | null;
  const buyer = enquiry.buyer as { full_name: string | null } | null;

  return {
    enquiryId: enquiry.id,
    sellerId: enquiry.seller_id,
    listingTitle: business?.title?.trim() || "your listing",
    buyerName: buyerDisplayName(buyer?.full_name),
    message: enquiry.message,
    notificationId: notification.id,
  };
}

export async function resolveSellerAuthEmail(
  sellerId: string,
): Promise<string | null> {
  if (!isUuid(sellerId)) {
    return null;
  }

  const admin = createSupabaseAdminClient();
  if (!admin) {
    return null;
  }

  const { data, error } = await admin.auth.admin.getUserById(sellerId);
  if (error || !data.user?.email) {
    return null;
  }

  const email = data.user.email.trim();
  return email || null;
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

  const { data: existing, error: existingError } = await admin
    .from("notification_deliveries")
    .select("id, status")
    .eq("notification_id", notificationId)
    .eq("channel", "email")
    .maybeSingle();

  if (existingError || !existing) {
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

/**
 * Send seller enquiry email after enquiry + in-app notification exist.
 * Never throws — enquiry creation must not depend on this result.
 */
export async function deliverSellerEnquiryEmail(
  enquiryId: string,
): Promise<DeliverSellerEnquiryEmailResult> {
  try {
    if (!isSupabaseAdminConfigured()) {
      return { attempted: false, status: "NOT_ATTEMPTED", errorCode: "misconfigured" };
    }

    const context = await loadEnquiryNotificationContext(enquiryId);
    if (!context) {
      return { attempted: false, status: "NOT_ATTEMPTED", errorCode: "context_missing" };
    }

    const admin = createSupabaseAdminClient();
    if (!admin) {
      return { attempted: false, status: "NOT_ATTEMPTED", errorCode: "misconfigured" };
    }

    const { data: preferences } = await admin
      .from("notification_preferences")
      .select("email_enabled")
      .eq("user_id", context.sellerId)
      .maybeSingle();

    if (preferences && !preferences.email_enabled) {
      const claim = await claimEmailDelivery(context.notificationId);
      if (claim.ok) {
        await finalizeEmailDelivery(claim.deliveryId, "DISABLED", {
          errorCode: "email_disabled",
        });
      }
      return { attempted: true, status: "DISABLED", errorCode: "email_disabled" };
    }

    const sellerEmail = await resolveSellerAuthEmail(context.sellerId);
    if (!sellerEmail) {
      const claim = await claimEmailDelivery(context.notificationId);
      if (claim.ok) {
        await finalizeEmailDelivery(claim.deliveryId, "SKIPPED", {
          errorCode: "seller_email_missing",
        });
      }
      return { attempted: true, status: "SKIPPED", errorCode: "seller_email_missing" };
    }

    const siteUrl = resolveSiteUrl();
    if (!siteUrl) {
      const claim = await claimEmailDelivery(context.notificationId);
      if (claim.ok) {
        await finalizeEmailDelivery(claim.deliveryId, "SKIPPED", {
          errorCode: "site_url_missing",
        });
      }
      return { attempted: true, status: "SKIPPED", errorCode: "site_url_missing" };
    }

    const claim = await claimEmailDelivery(context.notificationId);
    if (!claim.ok) {
      return { attempted: false, status: "NOT_ATTEMPTED", errorCode: "duplicate_delivery" };
    }

    const enquiryUrl = buildEnquiryDashboardUrl(siteUrl, context.enquiryId);
    const emailContent = buildEnquirySellerEmail({
      listingTitle: context.listingTitle,
      buyerName: context.buyerName,
      message: context.message,
      enquiryUrl,
    });

    const sendResult = await sendTransactionalEmail({
      to: sellerEmail,
      subject: emailContent.subject,
      html: emailContent.html,
      text: emailContent.text,
    });

    if (!sendResult.ok) {
      await finalizeEmailDelivery(claim.deliveryId, "FAILED", {
        errorCode: sendResult.errorCode,
      });
      return { attempted: true, status: "FAILED", errorCode: sendResult.errorCode };
    }

    await finalizeEmailDelivery(claim.deliveryId, "SENT", {
      providerMessageId: sendResult.messageId,
      sentAt: new Date().toISOString(),
    });

    return { attempted: true, status: "SENT" };
  } catch {
    return { attempted: false, status: "NOT_ATTEMPTED", errorCode: "unexpected_error" };
  }
}

/**
 * Fire-and-forget wrapper for enquiry creation.
 */
export function scheduleSellerEnquiryEmail(enquiryId: string): void {
  void deliverSellerEnquiryEmail(enquiryId);
}
