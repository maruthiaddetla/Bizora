import { describe, expect, it } from "vitest";
import { parseListingFormInput } from "@/lib/listing-creation/validation";
import { parseCommercialFormInput } from "@/lib/listing-creation/commercial-validation";
import { MAX_LOCALITY_NAME_LENGTH } from "@/lib/listing-creation/locality";

describe("listing locality free text", () => {
  it("treats locality as optional for business listings", () => {
    const { fields, errors } = parseListingFormInput({
      title: "Cafe for sale",
      locality: "   ",
    });
    expect(fields.locality).toBeNull();
    expect(errors.locality).toBeUndefined();
  });

  it("trims and keeps free-text locality for business listings", () => {
    const { fields, errors } = parseListingFormInput({
      title: "Cafe for sale",
      locality: "  Banjara Hills  ",
    });
    expect(fields.locality).toBe("Banjara Hills");
    expect(errors.locality).toBeUndefined();
  });

  it("persists locality via locality_name on draft insert (requires migration 016)", () => {
    const { fields } = parseListingFormInput({
      title: "Cafe for sale",
      locality: "Banjara Hills",
    });
    expect(fields.locality).toBe("Banjara Hills");
  });

  it("rejects overly long locality text", () => {
    const { fields, errors } = parseListingFormInput({
      title: "Cafe for sale",
      locality: "x".repeat(MAX_LOCALITY_NAME_LENGTH + 1),
    });
    expect(fields.locality).toBeNull();
    expect(errors.locality).toContain(String(MAX_LOCALITY_NAME_LENGTH));
  });

  it("treats locality as optional for commercial listings", () => {
    const { fields, errors } = parseCommercialFormInput({
      title: "Shop for lease",
      locality: "",
    });
    expect(fields.locality).toBeNull();
    expect(errors.locality).toBeUndefined();
  });
});
