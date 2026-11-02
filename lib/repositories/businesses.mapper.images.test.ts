import { beforeEach, describe, expect, it, vi } from "vitest";
import type { BusinessWithRelations } from "@/lib/repositories/businesses.types";

const resolveBusinessImageDisplayUrls = vi.fn();

vi.mock("@/lib/business-images/resolve-url", () => ({
  resolveBusinessImageDisplayUrls: (...args: unknown[]) =>
    resolveBusinessImageDisplayUrls(...args),
  isExternalImageUrl: (value: string | null | undefined) =>
    Boolean(value && /^https?:\/\//i.test(value)),
  getStoragePathFromImage: () => null,
  resolveBusinessImageDisplayUrl: async () => null,
}));

import {
  getSortedImageUrls,
  mapBusinessToDetail,
  mapBusinessToSellerListing,
} from "@/lib/repositories/businesses.mapper";

const IMAGE_ID = "33333333-3333-4333-8333-333333333333";

function businessWithStatus(
  status: BusinessWithRelations["status"],
): BusinessWithRelations {
  return {
    id: "22222222-2222-4222-8222-222222222222",
    slug: "test-listing",
    title: "Test",
    description: null,
    status,
    listing_type: "business",
    asking_price: 100,
    annual_revenue: null,
    annual_profit: null,
    ebitda: null,
    established_year: null,
    employees: null,
    reason_for_sale: null,
    is_premium: false,
    is_verified: false,
    seller_id: "11111111-1111-4111-8111-111111111111",
    category_id: null,
    locality_name: null,
    locality: null,
    city: null,
    state: null,
    category: { name: "Retail" },
    monthly_rent: null,
    security_deposit: null,
    area_sqft: null,
    space_type: null,
    floor: null,
    parking_spaces: null,
    listing_purpose: null,
    furnished: null,
    lease_term_months: null,
    available_from: null,
    business_usage: null,
    rejection_reason: null,
    submitted_at: null,
    reviewed_at: null,
    reviewed_by: null,
    supersedes_id: null,
    updated_at: new Date().toISOString(),
    created_at: new Date().toISOString(),
    business_images: [
      {
        id: IMAGE_ID,
        business_id: "22222222-2222-4222-8222-222222222222",
        image_url: `owner/biz/${IMAGE_ID}.webp`,
        storage_path: `owner/biz/${IMAGE_ID}.webp`,
        sort_order: 0,
        is_primary: true,
      },
    ],
  } as unknown as BusinessWithRelations;
}

describe("listing image delivery by status", () => {
  beforeEach(() => {
    resolveBusinessImageDisplayUrls.mockReset();
    resolveBusinessImageDisplayUrls.mockResolvedValue([
      "https://signed.example/private.webp?token=abc",
    ]);
  });

  it("uses the public proxy for published listings", async () => {
    const urls = await getSortedImageUrls(businessWithStatus("published"));
    expect(urls[0]).toBe(`/api/media/listing/${IMAGE_ID}`);
    expect(resolveBusinessImageDisplayUrls).not.toHaveBeenCalled();
  });

  it("uses signed URLs for sold, leased and withdrawn", async () => {
    for (const status of ["sold", "leased", "withdrawn"] as const) {
      resolveBusinessImageDisplayUrls.mockClear();
      const urls = await getSortedImageUrls(businessWithStatus(status));
      expect(urls[0]).toContain("signed.example");
      expect(resolveBusinessImageDisplayUrls).toHaveBeenCalled();
    }
  });

  it("uses signed URLs for draft, pending and rejected", async () => {
    for (const status of ["draft", "pending", "rejected"] as const) {
      resolveBusinessImageDisplayUrls.mockClear();
      const urls = await getSortedImageUrls(businessWithStatus(status));
      expect(urls[0]).toContain("signed.example");
    }
  });

  it("forces signed URLs for owner seller listings even when published", async () => {
    const listing = await mapBusinessToSellerListing(
      businessWithStatus("published"),
    );
    expect(listing.image).toContain("signed.example");
    expect(resolveBusinessImageDisplayUrls).toHaveBeenCalled();
  });

  it("forces signed URLs for owner/admin detail when delivery is signed", async () => {
    const detail = await mapBusinessToDetail(businessWithStatus("published"), {
      delivery: "signed",
    });
    expect(detail.images[0]).toContain("signed.example");
  });

  it("keeps published public detail on the stable proxy by default", async () => {
    const detail = await mapBusinessToDetail(businessWithStatus("published"));
    expect(detail.images[0]).toBe(`/api/media/listing/${IMAGE_ID}`);
  });
});
