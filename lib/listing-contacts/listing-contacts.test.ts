import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { normalizeListingContactPhone } from "@/lib/listing-contacts/phone";
import { assertCanRecordContactShare } from "@/lib/listing-contacts/share-guard";
import {
  hasContactFieldErrors,
  parseListingContactInput,
  validateContactSubmitFields,
} from "@/lib/listing-contacts/validation";

describe("listing contact phone normalisation", () => {
  it("accepts Indian local and E.164 mobiles", () => {
    expect(normalizeListingContactPhone("9876543210")).toBe("+919876543210");
    expect(normalizeListingContactPhone("+91 98765 43210")).toBe(
      "+919876543210",
    );
  });

  it("accepts other international E.164 numbers", () => {
    expect(normalizeListingContactPhone("+14155552671")).toBe("+14155552671");
  });

  it("rejects invalid numbers", () => {
    expect(normalizeListingContactPhone("12345")).toBeNull();
    expect(normalizeListingContactPhone("")).toBeNull();
  });
});

describe("listing contact validation", () => {
  it("requires name, mobile, and type on submit", () => {
    const { fields, errors } = parseListingContactInput({
      contactName: "",
      contactMobile: "",
      contactEmail: "",
      contactType: "",
      sharingAuthorised: false,
    });
    const submitErrors = validateContactSubmitFields(fields, errors);
    expect(hasContactFieldErrors(submitErrors)).toBe(true);
    expect(submitErrors.contactName).toBeTruthy();
    expect(submitErrors.contactMobile).toBeTruthy();
    expect(submitErrors.contactType).toBeTruthy();
  });

  it("parses distinct contacts without inventing profile phone", () => {
    const a = parseListingContactInput({
      contactName: "Owner A",
      contactMobile: "9876543210",
      contactEmail: "a@example.com",
      contactType: "owner",
      sharingAuthorised: "true",
    }).fields;
    const b = parseListingContactInput({
      contactName: "Broker B",
      contactMobile: "+14155552671",
      contactEmail: "",
      contactType: "broker_agent",
      sharingAuthorised: false,
    }).fields;

    expect(a.contactName).toBe("Owner A");
    expect(a.mobileE164).toBe("+919876543210");
    expect(a.sharingAuthorised).toBe(true);
    expect(b.contactName).toBe("Broker B");
    expect(b.mobileE164).toBe("+14155552671");
    expect(b.sharingAuthorised).toBe(false);
    expect(a.mobileE164).not.toBe(b.mobileE164);
  });
});

describe("contact share permission guard", () => {
  it("blocks sharing when permission is missing", () => {
    const result = assertCanRecordContactShare({
      mobile_e164: "+919876543210",
      sharing_authorised: false,
    });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.message.toLowerCase()).toContain("permission");
    }
  });

  it("blocks sharing when mobile is missing", () => {
    const result = assertCanRecordContactShare({
      mobile_e164: null,
      sharing_authorised: true,
    });
    expect(result.ok).toBe(false);
  });

  it("allows sharing when authorised with a mobile on file", () => {
    expect(
      assertCanRecordContactShare({
        mobile_e164: "+919876543210",
        sharing_authorised: true,
      }),
    ).toEqual({ ok: true });
  });
});

describe("private contact isolation from public surfaces", () => {
  it("keeps listing_seller_contacts out of public business selects and sitemap", () => {
    const mapperTypes = readFileSync(
      resolve(process.cwd(), "lib/repositories/businesses.types.ts"),
      "utf8",
    );
    const sitemap = readFileSync(
      resolve(process.cwd(), "app/sitemap.ts"),
      "utf8",
    );
    const listingPage = readFileSync(
      resolve(process.cwd(), "app/listings/[id]/page.tsx"),
      "utf8",
    );

    expect(mapperTypes).toContain("BUSINESS_WITH_RELATIONS_SELECT");
    expect(mapperTypes).not.toContain("listing_seller_contacts");
    expect(sitemap).not.toContain("listing_seller_contacts");
    expect(sitemap).not.toContain("mobile_e164");
    expect(listingPage).not.toContain("listing_seller_contacts");
    expect(listingPage).not.toContain("mobile_e164");
    expect(listingPage).not.toContain("fetchListingContact");
  });

  it("stores contacts in a dedicated table with admin/owner RLS in migration", () => {
    const migration = readFileSync(
      resolve(
        process.cwd(),
        "supabase/migrations/021_listing_seller_contacts.sql",
      ),
      "utf8",
    );
    expect(migration).toContain("create table public.listing_seller_contacts");
    expect(migration).toContain("enable row level security");
    expect(migration).toContain("enquiry_contact_shares");
    expect(migration).toContain("enquiry_admin_notes");
    expect(migration).toContain("approve_listing_edit_revision");
    expect(migration).toContain("listing_seller_contacts");
    expect(migration).not.toMatch(
      /create policy.*listing_seller_contacts[\s\S]*to anon/i,
    );
  });

  it("merges revision contacts into published on admin approval", () => {
    const migration = readFileSync(
      resolve(
        process.cwd(),
        "supabase/migrations/021_listing_seller_contacts.sql",
      ),
      "utf8",
    );
    expect(migration).toContain("on conflict (business_id) do update");
    expect(migration).toContain("v_revision.id");
    expect(migration).toContain("v_published.id");
  });

  it("clones contacts when creating a published edit revision", () => {
    const revision = readFileSync(
      resolve(process.cwd(), "lib/listing-creation/revision.ts"),
      "utf8",
    );
    expect(revision).toContain("cloneListingContact");
  });
});
