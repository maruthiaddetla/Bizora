import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import {
  deliverSellerEnquiryEmail,
  loadEnquiryNotificationContext,
  resolveSellerAuthEmail,
} from "@/lib/notifications/enquiry-email-delivery";
import { resetSupabaseAdminClientForTests } from "@/lib/supabase/admin";
import { resetResendClientForTests } from "@/lib/email/resend";

const ENQUIRY_ID = "11111111-1111-4111-8111-111111111111";
const NOTIFICATION_ID = "22222222-2222-4222-8222-222222222222";
const SELLER_ID = "33333333-3333-4333-8333-333333333333";
const DELIVERY_ID = "44444444-4444-4444-8444-444444444444";

const sendTransactionalEmail = vi.fn();
const getUserById = vi.fn();

let deliveryInsertCount = 0;
let deliveryRowStatus: string | null = null;

function buildAdminMock() {
  return {
    from: vi.fn((table: string) => {
      if (table === "enquiries") {
        return {
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              maybeSingle: vi.fn(async () => ({
                data: {
                  id: ENQUIRY_ID,
                  seller_id: SELLER_ID,
                  message: "I am interested in this listing.",
                  business: { title: "Corner Cafe" },
                  buyer: { full_name: "Priya Sharma" },
                },
                error: null,
              })),
            })),
          })),
        };
      }

      if (table === "notifications") {
        return {
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              eq: vi.fn(() => ({
                order: vi.fn(() => ({
                  limit: vi.fn(() => ({
                    maybeSingle: vi.fn(async () => ({
                      data: { id: NOTIFICATION_ID },
                      error: null,
                    })),
                  })),
                })),
              })),
            })),
          })),
        };
      }

      if (table === "notification_preferences") {
        return {
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              maybeSingle: vi.fn(async () => ({
                data: { email_enabled: true },
                error: null,
              })),
            })),
          })),
        };
      }

      if (table === "notification_deliveries") {
        return {
          insert: vi.fn(() => ({
            select: vi.fn(() => ({
              maybeSingle: vi.fn(async () => {
                deliveryInsertCount += 1;
                if (deliveryInsertCount > 1) {
                  return {
                    data: null,
                    error: { code: "23505", message: "duplicate key value" },
                  };
                }
                deliveryRowStatus = "PENDING";
                return { data: { id: DELIVERY_ID }, error: null };
              }),
            })),
          })),
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              eq: vi.fn(() => ({
                maybeSingle: vi.fn(async () => ({
                  data: deliveryRowStatus
                    ? { id: DELIVERY_ID, status: deliveryRowStatus }
                    : null,
                  error: null,
                })),
              })),
            })),
          })),
          update: vi.fn((payload: { status?: string }) => ({
            eq: vi.fn(async () => {
              if (payload.status) {
                deliveryRowStatus = payload.status;
              }
              return { error: null };
            }),
          })),
        };
      }

      throw new Error(`Unexpected table: ${table}`);
    }),
    auth: {
      admin: {
        getUserById,
      },
    },
  };
}

vi.mock("@/lib/supabase/admin", () => ({
  isSupabaseAdminConfigured: vi.fn(() => true),
  createSupabaseAdminClient: vi.fn(() => buildAdminMock()),
  resetSupabaseAdminClientForTests: vi.fn(),
}));

vi.mock("@/lib/email/resend", async (importOriginal) => {
  const original = await importOriginal<typeof import("@/lib/email/resend")>();
  return {
    ...original,
    sendTransactionalEmail: (...args: unknown[]) => sendTransactionalEmail(...args),
    resetResendClientForTests: vi.fn(),
  };
});

describe("enquiry seller email delivery", () => {
  const originalSiteUrl = process.env.NEXT_PUBLIC_SITE_URL;
  const originalResendKey = process.env.RESEND_API_KEY;

  beforeEach(() => {
    deliveryInsertCount = 0;
    deliveryRowStatus = null;
    sendTransactionalEmail.mockReset();
    getUserById.mockReset();
    process.env.NEXT_PUBLIC_SITE_URL = "https://bizoraindia.com";
    process.env.RESEND_API_KEY = "re_test_key";
    getUserById.mockResolvedValue({
      data: { user: { email: "seller@example.com" } },
      error: null,
    });
    sendTransactionalEmail.mockResolvedValue({
      ok: true,
      messageId: "msg_123",
    });
  });

  afterEach(() => {
    if (originalSiteUrl === undefined) {
      delete process.env.NEXT_PUBLIC_SITE_URL;
    } else {
      process.env.NEXT_PUBLIC_SITE_URL = originalSiteUrl;
    }
    if (originalResendKey === undefined) {
      delete process.env.RESEND_API_KEY;
    } else {
      process.env.RESEND_API_KEY = originalResendKey;
    }
    resetSupabaseAdminClientForTests();
    resetResendClientForTests();
    vi.clearAllMocks();
  });

  it("sends seller email successfully", async () => {
    const result = await deliverSellerEnquiryEmail(ENQUIRY_ID);

    expect(result).toEqual({ attempted: true, status: "SENT" });
    expect(sendTransactionalEmail).toHaveBeenCalledTimes(1);
    expect(sendTransactionalEmail).toHaveBeenCalledWith(
      expect.objectContaining({
        to: "seller@example.com",
        subject: "New enquiry for your Bizora listing",
      }),
    );
  });

  it("skips email when seller auth email is missing", async () => {
    getUserById.mockResolvedValue({
      data: { user: { email: null } },
      error: null,
    });

    const result = await deliverSellerEnquiryEmail(ENQUIRY_ID);

    expect(result).toEqual({
      attempted: true,
      status: "SKIPPED",
      errorCode: "seller_email_missing",
    });
    expect(sendTransactionalEmail).not.toHaveBeenCalled();
  });

  it("records provider failure without throwing", async () => {
    sendTransactionalEmail.mockResolvedValue({
      ok: false,
      errorCode: "resend_send_failed",
    });

    await expect(deliverSellerEnquiryEmail(ENQUIRY_ID)).resolves.toEqual({
      attempted: true,
      status: "FAILED",
      errorCode: "resend_send_failed",
    });
  });

  it("does not send duplicate email on retry", async () => {
    const first = await deliverSellerEnquiryEmail(ENQUIRY_ID);
    expect(first).toEqual({ attempted: true, status: "SENT" });
    expect(sendTransactionalEmail).toHaveBeenCalledTimes(1);

    const second = await deliverSellerEnquiryEmail(ENQUIRY_ID);
    expect(second).toEqual({
      attempted: false,
      status: "NOT_ATTEMPTED",
      errorCode: "duplicate_delivery",
    });
    expect(sendTransactionalEmail).toHaveBeenCalledTimes(1);
  });

  it("does not load buyer phone for seller email context", () => {
    const source = readFileSync(
      resolve(process.cwd(), "lib/notifications/enquiry-email-delivery.ts"),
      "utf8",
    );
    expect(source).toContain("full_name");
    expect(source).not.toContain("buyer.phone");
    expect(source).not.toMatch(/profiles!enquiries_buyer_id_fkey \( full_name, phone \)/);
  });

  it("resolves seller email only via server-side auth admin lookup", async () => {
    await resolveSellerAuthEmail(SELLER_ID);
    expect(getUserById).toHaveBeenCalledWith(SELLER_ID);
  });

  it("loads enquiry notification context from trusted enquiry data", async () => {
    const context = await loadEnquiryNotificationContext(ENQUIRY_ID);
    expect(context).toEqual({
      enquiryId: ENQUIRY_ID,
      sellerId: SELLER_ID,
      listingTitle: "Corner Cafe",
      buyerName: "Priya Sharma",
      message: "I am interested in this listing.",
      notificationId: NOTIFICATION_ID,
    });
  });
});

describe("enquiry participant access", () => {
  it("restricts enquiry detail lookup to buyer or seller participants", () => {
    const source = readFileSync(
      resolve(process.cwd(), "lib/repositories/enquiries.repository.ts"),
      "utf8",
    );
    expect(source).toContain(".or(`buyer_id.eq.${userId},seller_id.eq.${userId}`)");
    expect(source).not.toContain("buyer:profiles!enquiries_buyer_id_fkey ( full_name, phone )");
  });
});

describe("enquiry email security", () => {
  it("keeps RESEND_API_KEY server-only", () => {
    const clientFiles = [
      "components/home/NavbarClient.tsx",
      "components/listing/EnquiryForm.tsx",
      "lib/supabase/client.ts",
    ];

    for (const file of clientFiles) {
      const source = readFileSync(resolve(process.cwd(), file), "utf8");
      expect(source).not.toContain("RESEND_API_KEY");
      expect(source).not.toContain("NEXT_PUBLIC_RESEND");
    }
  });

  it("schedules email delivery only after enquiry insert succeeds", () => {
    const source = readFileSync(
      resolve(process.cwd(), "lib/enquiries/actions.ts"),
      "utf8",
    );
    expect(source).toContain("scheduleSellerEnquiryEmail(inserted.id)");
    expect(source).toMatch(
      /if \(error \|\| !inserted\?\.id\)[\s\S]*scheduleSellerEnquiryEmail\(inserted\.id\)/,
    );
  });
});
