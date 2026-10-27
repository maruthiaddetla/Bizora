import { normalizeListingContactPhone } from "@/lib/listing-contacts/phone";
import type {
  ListingContactFieldErrors,
  ListingContactFormInput,
  ListingContactType,
  ParsedListingContact,
} from "@/lib/listing-contacts/types";

const CONTACT_TYPES = new Set<ListingContactType>([
  "owner",
  "broker_agent",
  "authorised_representative",
]);

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function parseContactType(
  value: string | null | undefined,
): ListingContactType | null | "invalid" {
  if (value == null || value.trim() === "") return null;
  const trimmed = value.trim() as ListingContactType;
  if (!CONTACT_TYPES.has(trimmed)) return "invalid";
  return trimmed;
}

function parseSharingAuthorised(
  value: boolean | string | null | undefined,
): boolean {
  if (typeof value === "boolean") return value;
  if (value == null) return false;
  const normalized = String(value).trim().toLowerCase();
  return normalized === "true" || normalized === "on" || normalized === "1";
}

export function parseListingContactInput(
  input: ListingContactFormInput,
): { fields: ParsedListingContact; errors: ListingContactFieldErrors } {
  const errors: ListingContactFieldErrors = {};

  const contactName = input.contactName?.trim() || null;
  const emailRaw = input.contactEmail?.trim() || null;
  const mobileRaw = input.contactMobile?.trim() || "";
  const mobileE164 = mobileRaw
    ? normalizeListingContactPhone(mobileRaw)
    : null;
  const contactType = parseContactType(input.contactType);
  const sharingAuthorised = parseSharingAuthorised(input.sharingAuthorised);

  if (mobileRaw && !mobileE164) {
    errors.contactMobile =
      "Enter a valid mobile number with country code (e.g. +91…).";
  }

  if (emailRaw && !EMAIL_PATTERN.test(emailRaw)) {
    errors.contactEmail = "Enter a valid email address, or leave blank.";
  }

  if (contactType === "invalid") {
    errors.contactType = "Select a valid contact type.";
  }

  return {
    fields: {
      contactName,
      mobileE164: mobileRaw && !mobileE164 ? null : mobileE164,
      email: emailRaw,
      contactType: contactType === "invalid" ? null : contactType,
      sharingAuthorised,
    },
    errors,
  };
}

/**
 * Soft rules for draft save: only reject clearly invalid formats when provided.
 */
export function validateContactDraftFields(
  fields: ParsedListingContact,
  parseErrors: ListingContactFieldErrors,
): ListingContactFieldErrors {
  return { ...parseErrors };
}

/**
 * Submit-for-review: require name, mobile, and contact type.
 * sharing_authorised may be false (admin cannot share until true).
 * Legacy empty contacts fail submit until filled — intentional for new/edited submits.
 */
export function validateContactSubmitFields(
  fields: ParsedListingContact,
  parseErrors: ListingContactFieldErrors,
): ListingContactFieldErrors {
  const errors: ListingContactFieldErrors = { ...parseErrors };

  if (!fields.contactName) {
    errors.contactName = "Contact person name is required before submitting.";
  } else if (fields.contactName.length < 2) {
    errors.contactName = "Enter the contact person's full name.";
  }

  if (!fields.mobileE164) {
    errors.contactMobile =
      "A valid mobile number is required before submitting.";
  }

  if (!fields.contactType) {
    errors.contactType = "Select whether this contact is owner, broker, or representative.";
  }

  return errors;
}

export function hasContactFieldErrors(
  errors: ListingContactFieldErrors,
): boolean {
  return Object.values(errors).some((message) => Boolean(message));
}
