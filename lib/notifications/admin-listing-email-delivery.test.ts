import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import {
  buildListingLocationLabel,
  deliverAdminListingSubmittedEmail,
  formatListingPriceLabel,
  listingTypeLabel,
  loadAdminListingEmailContext,
  resolveAdminAuthEmail,
} from "@/lib/notifications/admin-listing-email-delivery";
import { buildAdminListingSubmittedEmail } from "@/lib/email/admin-listing-submitted-template";
import { resetSupabaseAdminClientForTests } from "@/lib/supabase/admin";
import { resetResendClientForTests } from "@/lib/email/resend";

const LISTING_ID = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
const NOTIFICATION_ID = "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb";
const ADMIN_ID = "cccccccc-cccc-4ccc-8ccc-cccccccccccc";
const DELIVERY_ID = "dddddddd-dddd-4ddd-8ddd-dddddddddddd";

const sendTransactionalEmail = vi.fn();
const getUserById = vi.fn();

let deliveryInsertCount = 0;
let listingType: "business" | "commercial_space" = "business";
let notificationType: "listing_submitted" | "listing_resubmitted" =
  "listing_submitted";

function buildAdminMock() {
  return {
    from: vi.fn((table: string) => {
      if (table === "businesses") {
        return {
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              maybeSingle: vi.fn(async () => ({
                data: {
                  id: LISTING_ID,
                  title: "Corner Cafe",
                  listing_type: listingType,
                  asking_price: listingType === "business" ? 2500000 : null,
                  monthly_rent: listingType === "commercial_space" ? 45000 : null,
                  locality_name: "Indiranagar",
                  city: { name: "Bengaluru" },
                  state: { name: "Karnataka" },
                  seller: {
                    full_name: "Asha Patel",
                    display_name: "Asha",
                  },
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
              in: vi.fn(() => ({
                order: vi.fn(() => ({
                  limit: vi.fn(async () => ({
                    data: [
                      {
                        id: NOTIFICATION_ID,
                        user_id: ADMIN_ID,
                        type: notificationType,
                        created_at: "2026-09-08T10:00:00.000Z",
                      },
                    ],
                    error: null,
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
                return { data: { id: DELIVERY_ID }, error: null };
              }),
            })),
          })),
          update: vi.fn(() => ({
            eq: vi.fn(async () => ({ error: null })),
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
    sendTransactionalEmail: (...args: unknown[]) =>
      sendTransactionalEmail(...args),
    resetResendClientForTests: vi.fn(),
  };
});

describe("admin listing submitted email template", () => {
  it("includes required listing details and review CTA", () => {
    const email = buildAdminListingSubmittedEmail({
      listingTitle: "Corner Cafe",
      listingTypeLabel: "Business for sale",
      locationLabel: "Indiranagar, Bengaluru, Karnataka",
      priceLabel: "₹25,00,000",
      sellerName: "Asha Patel",
      reviewUrl: "https://bizoraindia.com/admin/listings/" + LISTING_ID,
      isResubmission: false,
    });

    expect(email.subject).toBe("New Bizora listing submitted for review");
    expect(email.text).toContain("Corner Cafe");
    expect(email.text).toContain("Business for sale");
    expect(email.text).toContain("Indiranagar, Bengaluru, Karnataka");
    expect(email.text).toContain("₹25,00,000");
    expect(email.text).toContain("Asha Patel");
    expect(email.html).toContain("Review listing");
    expect(email.html).toContain(`/admin/listings/${LISTING_ID}`);
  });
});

describe("admin listing email helpers", () => {
  it("formats business and commercial price labels", () => {
    expect(
      formatListingPriceLabel({
        listing_type: "business",
        asking_price: 2500000,
        monthly_rent: null,
      }),
    ).toMatch(/25/);
    expect(
      formatListingPriceLabel({
        listing_type: "commercial_space",
        asking_price: null,
        monthly_rent: 45000,
      }),
    ).toMatch(/month/i);
    expect(listingTypeLabel("commercial_space")).toBe("Commercial space");
    expect(
      buildListingLocationLabel({
        locality_name: "Indiranagar",
        city_name: "Bengaluru",
        state_name: "Karnataka",
      }),
    ).toBe("Indiranagar, Bengaluru, Karnataka");
  });
});

describe("admin listing submitted email delivery", () => {
  const originalSiteUrl = process.env.NEXT_PUBLIC_SITE_URL;
  const originalResendKey = process.env.RESEND_API_KEY;

  beforeEach(() => {
    deliveryInsertCount = 0;
    listingType = "business";
    notificationType = "listing_submitted";
    sendTransactionalEmail.mockReset();
    getUserById.mockReset();
    process.env.NEXT_PUBLIC_SITE_URL = "https://bizoraindia.com";
    process.env.RESEND_API_KEY = "re_test_key";
    getUserById.mockResolvedValue({
      data: { user: { email: "maruthiaddetla@gmail.com" } },
      error: null,
    });
    sendTransactionalEmail.mockResolvedValue({
      ok: true,
      messageId: "msg_admin_1",
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

  it("sends admin email when a business listing is submitted", async () => {
    listingType = "business";
    const result = await deliverAdminListingSubmittedEmail(LISTING_ID);

    expect(result).toEqual({ attempted: true, status: "SENT", sentCount: 1 });
    expect(sendTransactionalEmail).toHaveBeenCalledTimes(1);
    expect(sendTransactionalEmail).toHaveBeenCalledWith(
      expect.objectContaining({
        to: "maruthiaddetla@gmail.com",
        subject: "New Bizora listing submitted for review",
        text: expect.stringContaining("Business for sale"),
      }),
    );
  });

  it("sends admin email when a commercial listing is submitted", async () => {
    listingType = "commercial_space";
    const result = await deliverAdminListingSubmittedEmail(LISTING_ID);

    expect(result).toEqual({ attempted: true, status: "SENT", sentCount: 1 });
    expect(sendTransactionalEmail).toHaveBeenCalledWith(
      expect.objectContaining({
        subject: "New Bizora listing submitted for review",
      }),
    );
    const payload = sendTransactionalEmail.mock.calls[0]?.[0] as {
      text: string;
    };
    expect(payload.text).toContain("Commercial space");
    expect(payload.text).toMatch(/month/i);
  });

  it("resolves admin recipient via auth.admin.getUserById", async () => {
    const email = await resolveAdminAuthEmail(ADMIN_ID);
    expect(email).toBe("maruthiaddetla@gmail.com");
    expect(getUserById).toHaveBeenCalledWith(ADMIN_ID);
  });

  it("loads listing details into notification context payload", async () => {
    const context = await loadAdminListingEmailContext(LISTING_ID);
    expect(context).toEqual(
      expect.objectContaining({
        listingId: LISTING_ID,
        listingTitle: "Corner Cafe",
        listingType: "business",
        locationLabel: "Indiranagar, Bengaluru, Karnataka",
        sellerName: "Asha Patel",
        notifications: [
          expect.objectContaining({
            id: NOTIFICATION_ID,
            userId: ADMIN_ID,
            type: "listing_submitted",
          }),
        ],
      }),
    );
    expect(context?.priceLabel).toMatch(/25/);
  });

  it("does not send duplicate admin email on retry", async () => {
    const first = await deliverAdminListingSubmittedEmail(LISTING_ID);
    expect(first).toEqual({ attempted: true, status: "SENT", sentCount: 1 });
    expect(sendTransactionalEmail).toHaveBeenCalledTimes(1);

    const second = await deliverAdminListingSubmittedEmail(LISTING_ID);
    expect(second).toEqual({
      attempted: false,
      status: "NOT_ATTEMPTED",
      sentCount: 0,
      errorCode: "duplicate_delivery",
    });
    expect(sendTransactionalEmail).toHaveBeenCalledTimes(1);
  });

  it("records Resend failure without throwing", async () => {
    sendTransactionalEmail.mockResolvedValue({
      ok: false,
      errorCode: "resend_send_failed",
    });

    await expect(deliverAdminListingSubmittedEmail(LISTING_ID)).resolves.toEqual({
      attempted: true,
      status: "FAILED",
      sentCount: 0,
      errorCode: "resend_send_failed",
    });
  });

  it("uses resubmission subject for listing_resubmitted", async () => {
    notificationType = "listing_resubmitted";
    await deliverAdminListingSubmittedEmail(LISTING_ID);
    expect(sendTransactionalEmail).toHaveBeenCalledWith(
      expect.objectContaining({
        subject: "Bizora listing resubmitted for review",
      }),
    );
  });
});

describe("admin listing email wiring", () => {
  it("schedules email after business listing submit succeeds", () => {
    const source = readFileSync(
      resolve(process.cwd(), "lib/listing-creation/actions.ts"),
      "utf8",
    );
    expect(source).toContain("scheduleAdminListingSubmittedEmail(data.id)");
    expect(source).toMatch(
      /if \(error \|\| !data\)[\s\S]*scheduleAdminListingSubmittedEmail\(data\.id\)/,
    );
  });

  it("schedules email after commercial listing submit succeeds", () => {
    const source = readFileSync(
      resolve(process.cwd(), "lib/listing-creation/commercial-actions.ts"),
      "utf8",
    );
    expect(source).toContain("scheduleAdminListingSubmittedEmail(data.id)");
    expect(source).toMatch(
      /if \(error \|\| !data\)[\s\S]*scheduleAdminListingSubmittedEmail\(data\.id\)/,
    );
  });

  it("keeps seller enquiry email schedule intact", () => {
    const source = readFileSync(
      resolve(process.cwd(), "lib/enquiries/actions.ts"),
      "utf8",
    );
    expect(source).toContain("scheduleSellerEnquiryEmail(inserted.id)");
  });

  it("keeps published revision approve RPC path intact", () => {
    const source = readFileSync(
      resolve(process.cwd(), "lib/admin/actions.ts"),
      "utf8",
    );
    expect(source).toContain("approve_listing_edit_revision");
  });

  it("does not hard-code the admin mailbox in delivery logic", () => {
    const source = readFileSync(
      resolve(process.cwd(), "lib/notifications/admin-listing-email-delivery.ts"),
      "utf8",
    );
    expect(source).not.toContain("maruthiaddetla@gmail.com");
    expect(source).toContain("auth.admin.getUserById");
  });

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
});
