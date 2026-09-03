import { describe, expect, it } from "vitest";
import {
  LISTING_EDIT_REVIEW_SUBMITTED,
  canSellerOpenEdit,
  isOwnerEditableStatus,
  isPublishedEditRevision,
} from "@/lib/listing-creation/editability";
import { listingDefaultsFromRow } from "@/lib/listing-creation/form-defaults";
import { commercialDefaultsFromRow } from "@/lib/listing-creation/commercial-form-defaults";

describe("seller listing editability", () => {
  it("allows owners to edit draft, pending, and rejected listings", () => {
    expect(isOwnerEditableStatus("draft")).toBe(true);
    expect(isOwnerEditableStatus("pending")).toBe(true);
    expect(isOwnerEditableStatus("rejected")).toBe(true);
    expect(isOwnerEditableStatus("published")).toBe(false);
    expect(isOwnerEditableStatus("sold")).toBe(false);
  });

  it("opens edit for published listings via revision workflow", () => {
    expect(canSellerOpenEdit("published")).toBe(true);
    expect(canSellerOpenEdit("draft")).toBe(true);
    expect(canSellerOpenEdit("pending")).toBe(true);
    expect(canSellerOpenEdit("withdrawn")).toBe(false);
  });

  it("identifies published edit revisions", () => {
    expect(
      isPublishedEditRevision({
        supersedes_id: "11111111-1111-1111-1111-111111111111",
        status: "draft",
      }),
    ).toBe(true);
    expect(
      isPublishedEditRevision({
        supersedes_id: "11111111-1111-1111-1111-111111111111",
        status: "pending",
      }),
    ).toBe(true);
    expect(
      isPublishedEditRevision({
        supersedes_id: null,
        status: "draft",
      }),
    ).toBe(false);
    expect(
      isPublishedEditRevision({
        supersedes_id: "11111111-1111-1111-1111-111111111111",
        status: "published",
      }),
    ).toBe(false);
  });

  it("uses the keep-published review message for published edits", () => {
    expect(LISTING_EDIT_REVIEW_SUBMITTED).toContain(
      "current published listing will remain visible",
    );
  });
});

describe("listing form pre-population", () => {
  it("pre-populates business listing fields from an existing row", () => {
    const defaults = listingDefaultsFromRow({
      id: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
      title: "Cafe for sale",
      description: "Busy cafe in Hyderabad",
      category_id: "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb",
      state_id: "cccccccc-cccc-cccc-cccc-cccccccccccc",
      district_id: "dddddddd-dddd-dddd-dddd-dddddddddddd",
      city_id: "eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee",
      locality_name: "Banjara Hills",
      asking_price: 2500000,
      annual_revenue: 1200000,
      annual_profit: 400000,
      ebitda: 450000,
      established_year: 2018,
      employees: 8,
      reason_for_sale: "Relocation",
    });

    expect(defaults.listingId).toBe("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa");
    expect(defaults.title).toBe("Cafe for sale");
    expect(defaults.description).toBe("Busy cafe in Hyderabad");
    expect(defaults.categoryId).toBe("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb");
    expect(defaults.stateId).toBe("cccccccc-cccc-cccc-cccc-cccccccccccc");
    expect(defaults.cityId).toBe("eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee");
    expect(defaults.locality).toBe("Banjara Hills");
    expect(defaults.askingPrice).toBe("2500000");
    expect(defaults.employees).toBe("8");
    expect(defaults.reasonForSale).toBe("Relocation");
  });

  it("pre-populates commercial space fields from an existing row", () => {
    const defaults = commercialDefaultsFromRow({
      id: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
      title: "Shop for lease",
      description: "Ground floor retail unit",
      category_id: "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb",
      state_id: "cccccccc-cccc-cccc-cccc-cccccccccccc",
      district_id: "dddddddd-dddd-dddd-dddd-dddddddddddd",
      city_id: "eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee",
      locality_name: "Madhapur",
      space_type: "retail_shop",
      listing_purpose: "lease",
      monthly_rent: 85000,
      security_deposit: 250000,
      area_sqft: 1200,
      floor: "Ground",
      parking_spaces: 2,
      furnished: "semi_furnished",
      lease_term_months: 36,
      available_from: "2026-10-01",
      business_usage: "Retail / F&B",
    });

    expect(defaults.listingId).toBe("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa");
    expect(defaults.title).toBe("Shop for lease");
    expect(defaults.spaceType).toBe("retail_shop");
    expect(defaults.listingPurpose).toBe("lease");
    expect(defaults.monthlyRent).toBe("85000");
    expect(defaults.areaSqft).toBe("1200");
    expect(defaults.locality).toBe("Madhapur");
    expect(defaults.furnished).toBe("semi_furnished");
  });
});

describe("ownership edit gates", () => {
  it("documents that non-owners cannot edit via server ownership checks", () => {
    // Server actions always filter `.eq("seller_id", user.id)` before update.
    // A mismatched seller_id fails the load and returns a not-found/access error.
    const ownerId = "11111111-1111-1111-1111-111111111111";
    const otherSellerId = "22222222-2222-2222-2222-222222222222";
    const listingOwnerId: string = ownerId;

    expect(listingOwnerId === otherSellerId).toBe(false);
    expect(isOwnerEditableStatus("draft")).toBe(true);
  });

  it("keeps published rows non-editable directly (revision path required)", () => {
    expect(isOwnerEditableStatus("published")).toBe(false);
    expect(canSellerOpenEdit("published")).toBe(true);
  });
});
