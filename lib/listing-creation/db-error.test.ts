import { describe, expect, it, vi } from "vitest";
import {
  logListingDbError,
  mapCommercialListingDbError,
  mapListingDbError,
} from "@/lib/listing-creation/db-error";
import { LISTING_SAVE_FAILED_PRESERVE } from "@/lib/business-images/messages";

describe("mapListingDbError", () => {
  it("maps missing locality_name column (PGRST204) without leaking schema details to users", () => {
    const userMessage = mapListingDbError(
      "Could not find the 'locality_name' column of 'businesses' in the schema cache",
      "PGRST204",
    );
    expect(userMessage).toBe(LISTING_SAVE_FAILED_PRESERVE);
  });

  it("maps location integrity trigger messages", () => {
    expect(
      mapListingDbError("district is required when city is set"),
    ).toBe("Please select a city.");
    expect(
      mapListingDbError("district does not belong to the selected state"),
    ).toBe("Please select a valid city for the selected state.");
  });

  it("maps slug uniqueness violations", () => {
    expect(
      mapListingDbError(
        'duplicate key value violates unique constraint "businesses_slug_key"',
      ),
    ).toBe("That business title is already in use. Please adjust the title.");
  });

  it("uses commercial slug wording", () => {
    expect(
      mapCommercialListingDbError(
        'duplicate key value violates unique constraint "businesses_slug_key"',
      ),
    ).toBe("That title is already in use. Please adjust the title.");
  });
});

describe("logListingDbError", () => {
  it("logs only safe Supabase error fields", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});

    logListingDbError("createDraftListing", {
      code: "PGRST204",
      message:
        "Could not find the 'locality_name' column of 'businesses' in the schema cache",
      details: null,
      hint: null,
    });

    expect(warn).toHaveBeenCalledWith("[Bizora] createDraftListing failed:", {
      code: "PGRST204",
      message:
        "Could not find the 'locality_name' column of 'businesses' in the schema cache",
      details: null,
      hint: null,
    });

    warn.mockRestore();
  });
});
